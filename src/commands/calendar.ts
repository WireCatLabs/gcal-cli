import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { CliError, isCliError } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import { timezoneOf } from "@wirecat/cli-base/query"
import { addCalendarCommands, type CalendarRun } from "@wirecat/cli-core/calendar/cli"
import { baseContext, environmentOf, type GlobalFlags, NO_EFFECTS, readOnlyLockOf } from "@wirecat/cli-core/cli"
import { levelFor } from "@wirecat/cli-core/sends"
import type { MessageStore } from "@wirecat/cli-core/store"
import { Command } from "commander"
import { configuration, permissions, writeKeys } from "../config.js"
import { IDENTITY } from "../identity.js"
import type { GcalEnvironment } from "./session.js"
import { signInWords, wordedApi } from "./words.js"

type AccountKey = { provider: string; account: string }
type ProfileRow = [profile: string, key: AccountKey]
type OpenStore = (env: NodeJS.ProcessEnv, options?: { readOnly?: boolean }) => Promise<MessageStore>

/** The own account's id when every profile already points at its account in the store; nothing is written. */
const storedId = async (store: MessageStore, rows: [ProfileRow, ...ProfileRow[]]) => {
  const profiles = (await store.accounts.profiles())[IDENTITY.command] ?? {}
  const current = rows.every(([name, key]) => {
    const saved = profiles[name]
    return saved?.provider === key.provider && saved.account === key.account
  })
  return current ? (await store.accounts.storedAccount(rows[0][1])).id : undefined
}

/**
 * A command that only reads opens the store read-only, so parallel MCP reads take no write lock. The first read of a
 * profile, a store that is missing or needs a migration, and every command that writes open it for writing and save
 * the account and profile rows. The own profile's row comes first.
 *
 * Under `GCAL_READ_ONLY` such a read gets an empty store in a temporary folder instead, as cli-core's `openCrmStore`
 * does, so the lock creates no `wirecat.db`; the folder goes when the store closes.
 */
const storeFor = async (
  env: NodeJS.ProcessEnv,
  readOnly: boolean,
  rows: [ProfileRow, ...ProfileRow[]],
  open: OpenStore,
) => {
  const locked = readOnly && readOnlyLockOf(IDENTITY, env) !== undefined
  if (readOnly) {
    // Unlocked, a failed read-only open is never the answer: the writable open below says what is wrong, or fixes it.
    const store = await open(env, { readOnly: true }).catch((error) => {
      if (locked && !(isCliError(error) && error.code === "not_found")) throw error
      return undefined
    })
    if (store) {
      const accountId = await storedId(store, rows).catch(() => undefined)
      if (accountId !== undefined) return { store, accountId }
      await store.close()
    }
  }
  if (locked) return emptyStoreFor(env, rows, open)
  return savedStoreFor(env, rows, open)
}

const emptyStoreFor = async (env: NodeJS.ProcessEnv, rows: [ProfileRow, ...ProfileRow[]], open: OpenStore) => {
  const folder = mkdtempSync(join(tmpdir(), `${IDENTITY.command}-empty-`))
  const removing = () => rmSync(folder, { recursive: true, force: true })
  try {
    const empty = await savedStoreFor({ ...env, MESSAGING_STORE: join(folder, "wirecat.db") }, rows, open)
    const close = empty.store.close.bind(empty.store)
    empty.store.close = () => close().finally(removing)
    return empty
  } catch (error) {
    removing()
    throw error
  }
}

const savedStoreFor = async (env: NodeJS.ProcessEnv, rows: [ProfileRow, ...ProfileRow[]], open: OpenStore) => {
  const store = await open(env)
  try {
    const save = async ([name, key]: ProfileRow) => {
      const id = await store.accounts.saveAccount(key, { name: null })
      await store.accounts.saveProfile(IDENTITY.command, name, key)
      return id
    }
    const [own, ...others] = rows
    const accountId = await save(own)
    for (const other of others) await save(other)
    return { store, accountId }
  } catch (error) {
    await store.close()
    throw error
  }
}

/** The selected profile's Google calendar for one command; cli-core closes it before the answer prints. */
const openProfile = async (command: Command, { readOnly }: { readOnly: boolean }): Promise<CalendarRun> => {
  const environment = environmentOf<GcalEnvironment>(command)
  const env = environment.env ?? process.env
  const flags = command.optsWithGlobals<GlobalFlags>()
  const { profile, configuredProfiles, profilesHere } = configuration.resolveSettings(flags, { env })
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
    const signIn = `run ${IDENTITY.command} ${profile} session start`
    // A name no config and no sign-in knows is most likely a typo: the choices come before the sign-in hint.
    const others = profilesHere.includes(profile) ? [] : profilesHere
    throw new CliError(
      "authentication_error",
      others.length
        ? `no profile named "${profile}" — profiles here: ${others.join(", ")}; to add it, ${signIn}`
        : `profile ${profile} has no Google account yet; ${signIn}`,
      { reason: "oauth.missing", ...(others.length ? { profiles: others } : {}) },
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
  const { store, accountId } = await storeFor(env, readOnly, rows, openGcalStore)
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
  const googleWriter = () => (writer ??= googleCalendarWriter(google()))
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
  for (const group of holder.commands) if (group.commands.length) annotate(group, { effects: NO_EFFECTS })
  return [...holder.commands]
}
