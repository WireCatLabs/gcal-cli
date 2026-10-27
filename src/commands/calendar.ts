import { CliError } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import type { CalendarSource } from "@wirecat/cli-core/calendar"
import { addCalendarCommands, type CalendarCommandDeps } from "@wirecat/cli-core/calendar/cli"
import {
  type GlobalFlags,
  itemOf,
  listOf,
  NO_EFFECTS,
  outputFor,
  type RunOptions,
  renderAnswer,
  snakeKeys,
} from "@wirecat/cli-core/cli"
import type { MessageStore } from "@wirecat/cli-core/store"
import { Command } from "commander"
import { configuration } from "../config.js"
import { IDENTITY } from "../identity.js"
import type { GcalEnvironment } from "./session.js"

interface Opened {
  store: MessageStore
  accountId: number
  account: { provider: string; account: string }
  env: NodeJS.ProcessEnv
  /** Built on first use: a local read never reads the sign-in. */
  source: () => CalendarSource
}

const leaves = (command: Command): Command[] => (command.commands.length ? command.commands.flatMap(leaves) : [command])

const pathOf = (command: Command): string[] =>
  command.parent?.parent ? [...pathOf(command.parent), command.name()] : [command.name()]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const LIST_KEYS = new Set(["items", "page", "limit", "hasMore"])

/**
 * cli-core's reads answer `{ items, page, limit, hasMore }` or one value; gcal prints both in its own envelope. A list
 * that says more (`links review`'s `accounts: "all"`) stays one value, since the envelope's meta has no room for it.
 */
const bodyOf = (command: Command, value: unknown) => {
  if (isRecord(value) && Array.isArray(value.items) && Object.keys(value).every((key) => LIST_KEYS.has(key)))
    return listOf(pathOf(command).join(" "), {
      items: snakeKeys(value.items) as unknown[],
      limit: Math.max(1, typeof value.limit === "number" ? value.limit : value.items.length),
      has_more: value.hasMore === true,
    })
  return itemOf(snakeKeys(value))
}

const notOpen = () => new CliError("configuration_error", "the shared store is not open for this command")

/**
 * cli-core's shared calendar commands over Google. The commands are mounted when the program is built, before a
 * profile is known, so the store, the account and the provider are read through getters once `prepare` opened them.
 */
export const calendarMount = () => {
  let action: Command | undefined
  let opened: Opened | undefined
  const commands = new Set<Command>()
  const need = () => {
    if (!opened) throw notOpen()
    return opened
  }
  // cli-core decides at mount whether `person:` references are shown, from whether `messages` is there.
  const closedStore = new Proxy({} as MessageStore, {
    get: () => {
      throw notOpen()
    },
  })
  const deps: CalendarCommandDeps = {
    get store() {
      return need().store.calendar
    },
    get accountId() {
      return need().accountId
    },
    get account() {
      return need().account
    },
    get messages() {
      return opened?.store ?? closedStore
    },
    get source() {
      return need().source()
    },
    embed: async (max) => {
      const { store, env } = need()
      const { embedEvents } = await import("@wirecat/cli-core/services")
      return embedEvents(store, { maxChunks: max, env, command: IDENTITY.command })
    },
    write: (value) => {
      if (!action) throw notOpen()
      renderAnswer(action, outputFor(action), bodyOf(action, value))
    },
  }

  return {
    commands: (): Command[] => {
      const holder = new Command(IDENTITY.command)
      addCalendarCommands(holder, deps)
      for (const group of holder.commands) {
        if (group.commands.length) annotate(group, { effects: NO_EFFECTS })
        for (const leaf of leaves(group)) commands.add(leaf)
      }
      return [...holder.commands]
    },
    configure: (program: Command) => {
      program.hook("preAction", (_root, chosen) => {
        action = chosen
      })
    },
    /** After the shared checks passed: opens the store for a calendar command, for the profile's own account only. */
    prepare: async (_program: Command, environment: RunOptions) => {
      if (!action || !commands.has(action)) return
      const gcalEnvironment = environment as GcalEnvironment
      const env = gcalEnvironment.env ?? process.env
      const { profile } = configuration.resolveSettings(action.optsWithGlobals<GlobalFlags>(), { env })
      const [{ apiAccess, savedAccount }, { openGcalStore, PROVIDER }, { googleApi }, { googleCalendarSource }] =
        await Promise.all([
          import("../session.js"),
          import("../store.js"),
          import("../google-api.js"),
          import("../calendar-source.js"),
        ])
      const account = savedAccount(env, profile)
      if (!account)
        throw new CliError(
          "authentication_error",
          `profile ${profile} has no Google account yet; run ${IDENTITY.command} ${profile} session start`,
          { reason: "profile.not-signed-in" },
        )
      const store = await openGcalStore(env)
      gcalEnvironment.trackCloseable?.({ close: () => store.close() })
      const key = { provider: PROVIDER.name, account }
      const accountId = await store.accounts.saveAccount(key, { name: null })
      let source: CalendarSource | undefined
      const { keyring, fetch, signal } = gcalEnvironment
      opened = {
        store,
        accountId,
        account: key,
        env,
        source: () => (source ??= googleCalendarSource(googleApi(apiAccess({ env, profile, keyring, fetch, signal })))),
      }
    },
  }
}
