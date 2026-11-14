import { CliError } from "@wirecat/cli-base"
import { annotate, metaOf, overrideSharedContract } from "@wirecat/cli-base/commands"
import { timezoneOf } from "@wirecat/cli-base/query"
import { addCalendarCommands, type CalendarRun } from "@wirecat/cli-core/calendar/cli"
import { baseContext, environmentOf, type GlobalFlags, NO_EFFECTS } from "@wirecat/cli-core/cli"
import { levelFor } from "@wirecat/cli-core/sends"
import type { MessageStore } from "@wirecat/cli-core/store"
import { Command } from "commander"
import { configuration, permissions, writeKeys } from "../config.js"
import { IDENTITY } from "../identity.js"
import { type StoreRows, storeFor } from "./open-store.js"
import type { GcalEnvironment } from "./session.js"
import { signInWords, wordedApi } from "./words.js"

type AccountKey = { provider: string; account: string }
type ProfileRow = [profile: string, key: AccountKey]

/** The own account's id when every profile already points at its account in the store; nothing is written. */
const storedId = async (store: MessageStore, rows: [ProfileRow, ...ProfileRow[]]) => {
  const profiles = (await store.accounts.profiles())[IDENTITY.command] ?? {}
  const current = rows.every(([name, key]) => {
    const saved = profiles[name]
    return saved?.provider === key.provider && saved.account === key.account
  })
  return current ? (await store.accounts.storedAccount(rows[0][1])).id : undefined
}

/** The account and profile rows, the own profile's first. */
const profileRows = (rows: [ProfileRow, ...ProfileRow[]]): StoreRows => ({
  stored: async (store, locked) => {
    const saved = (some: [ProfileRow, ...ProfileRow[]]) => storedId(store, some).catch(() => undefined)
    // The lock writes no rows, so a profile never opened stays out of `--source` rather than hiding the own events.
    return (await saved(rows)) ?? (locked ? await saved([rows[0]]) : undefined)
  },
  save: async (store) => {
    const save = async ([name, key]: ProfileRow) => {
      const id = await store.accounts.saveAccount(key, { name: null })
      await store.accounts.saveProfile(IDENTITY.command, name, key)
      return id
    }
    const [own, ...others] = rows
    const accountId = await save(own)
    for (const other of others) await save(other)
    return accountId
  },
})

/** The selected profile's Google calendar for one command; cli-core closes it before the answer prints. */
const openProfile = async (command: Command, { readOnly }: { readOnly: boolean }): Promise<CalendarRun> => {
  const environment = environmentOf<GcalEnvironment>(command)
  const env = environment.env ?? process.env
  const flags = command.optsWithGlobals<GlobalFlags>()
  const { profile, configuredProfiles } = configuration.resolveSettings(flags, { env })
  const [
    { apiAccess, savedAccount, signedInAccounts },
    { openGcalStore, PROVIDER },
    { googleApi },
    { googleCalendarSource },
    { googleCalendarWriter },
    { icsFeeds },
    { feedRegistry },
  ] = await Promise.all([
    import("../session.js"),
    import("../store.js"),
    import("../google-api.js"),
    import("../calendar-source.js"),
    import("../calendar-writer.js"),
    import("@wirecat/cli-core/calendar"),
    import("../feeds.js"),
  ])
  const account = savedAccount(env, profile)
  if (!account) {
    throw new CliError(
      "authentication_error",
      `profile ${profile} has no Google account yet; run ${IDENTITY.command} ${profile} session start`,
      { reason: "session.missing" },
    )
  }
  const key = { provider: PROVIDER.name, account }
  const locked = Boolean(env[`${IDENTITY.envPrefix}_PROFILE_LOCK`])
  // So `events list --source gcal:<profile>` finds this account by its profile, as tg's and max's lists do. A
  // profile signed in but never opened has no store row, and `--source` would leave it out without a word; with
  // one, the answer names it and says it has no synced calendar. A lock keeps the other profiles out of reach.
  const rows: [ProfileRow, ...ProfileRow[]] = [[profile, key]]
  if (command.opts<{ source?: string }>().source !== undefined && !locked)
    for (const [other, address] of signedInAccounts(env, configuredProfiles))
      rows.push([other, { provider: PROVIDER.name, account: address }])
  const { store, accountId } = await storeFor(env, readOnly, profileRows(rows), openGcalStore)
  const { keyring, fetch, signal } = environment
  let api: ReturnType<typeof googleApi> | undefined
  const google = () =>
    (api ??= wordedApi(
      googleApi(apiAccess({ env, profile, signInCommand: signInWords(profile), keyring, fetch, signal })),
      profile,
    ))
  // The run's settings, not resolveSettings: they carry the levels `mcp serve --permission` tightened.
  const settings = () => baseContext(command, configuration.resolveSettings).settings
  let source: ReturnType<typeof googleCalendarSource> | undefined
  let writer: ReturnType<typeof googleCalendarWriter> | undefined
  let feeds: ReturnType<typeof icsFeeds> | undefined
  const meet = command.opts<{ meet?: boolean }>().meet === true
  const googleWriter = () => (writer ??= googleCalendarWriter(google(), { meet }))
  return {
    profile,
    account: key,
    accountId,
    store: store.calendar,
    messages: store,
    env,
    locked,
    source: () => (source ??= googleCalendarSource(google())),
    writes: () => ({
      writer: googleWriter(),
      app: IDENTITY,
      env,
      // Read on every write, with the command's own --permission and the read-only lock, as the shared check sees them.
      settings: () => ({ ...settings(), permissionDefaults: permissions.defaults }),
      // An api key joins a shared write only when it stops or asks: at `allow` it would add a key to every question.
      extraKeys: (write) => writeKeys(write).filter((one) => levelFor(settings().permissions, one).level !== "allow"),
    }),
    feeds: () =>
      (feeds ??= icsFeeds({
        registry: feedRegistry(env, profile, keyring),
        zone: timezoneOf(),
        ...(fetch ? { fetch } : {}),
        ...(signal ? { signal } : {}),
      })),
    close: () => store.close(),
  }
}

/** cli-core's shared calendar commands over Google. */
export const calendarCommands = (): Command[] => {
  const holder = new Command(IDENTITY.command)
  addCalendarCommands(holder, {
    app: IDENTITY,
    open: openProfile,
    freeBusy: true,
    serverSearch: true,
    feeds: true,
    writes: { quickAdd: true, move: true, importEvent: true },
  })
  const events = holder.commands.find((group) => group.name() === "events")
  for (const name of ["create", "update"]) {
    const write = events?.commands.find((one) => one.name() === name)
    if (write)
      overrideSharedContract(write, "Google Calendar makes a Google Meet link for an event it writes.", (one) => {
        one.option(
          "--meet",
          name === "create"
            ? "also make a Google Meet link for the event"
            : "also give the event a Google Meet link, with at least one other change",
        )
        annotate(one, {
          examples: [
            // Within the three examples a command may give: the last shared one makes room.
            ...(metaOf(one).examples ?? []).slice(0, 2),
            name === "create"
              ? `${IDENTITY.command} personal events create 3 --title 'Example sync' ` +
                "--start-time 2026-11-20T10:00 --end-time 2026-11-20T10:30 --meet"
              : `${IDENTITY.command} personal events update event:42 --title 'Example sync' --meet --no-notify`,
          ],
        })
      })
  }
  for (const group of holder.commands) if (group.commands.length) annotate(group, { effects: NO_EFFECTS })
  return [...holder.commands]
}
