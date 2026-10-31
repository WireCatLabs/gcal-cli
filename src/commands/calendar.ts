import { CliError } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import type { NextStep } from "@wirecat/cli-base/standards"
import type { CalendarSource, CalendarWriter } from "@wirecat/cli-core/calendar"
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
import { levelFor } from "@wirecat/cli-core/sends"
import type { MessageStore } from "@wirecat/cli-core/store"
import { Command } from "commander"
import type { GoogleCalendarWriter } from "../calendar-writer.js"
import { configuration, permissions, writeKeys } from "../config.js"
import type { GoogleApi } from "../google-api.js"
import { IDENTITY } from "../identity.js"
import type { GcalEnvironment } from "./session.js"
import { reshape } from "./shape.js"
import { signInWords, wordedApi } from "./words.js"

interface Opened {
  profile: string
  store: MessageStore
  accountId: number
  account: { provider: string; account: string }
  env: NodeJS.ProcessEnv
  /** Built on first use: a local read never reads the sign-in. */
  source: () => CalendarSource
  writer: () => GoogleCalendarWriter
  close: () => Promise<void>
}

const leaves = (command: Command): Command[] => (command.commands.length ? command.commands.flatMap(leaves) : [command])

const pathOf = (command: Command): string[] =>
  command.parent?.parent ? [...pathOf(command.parent), command.name()] : [command.name()]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

// `links review` adds `accounts: "all"`, which the envelope has no room for: `meta.accounts` names accounts.
const LIST_KEYS = new Set(["items", "page", "limit", "hasMore", "meta", "accounts"])

const listedFields = (fields: unknown, prefix: string) =>
  Array.isArray(fields)
    ? fields.filter((field) => typeof field === "string" && field.startsWith(prefix)).map((f) => f.slice(prefix.length))
    : []

/**
 * A search answers `{ hits, has_more, next_offset?, meaning_skipped?, untrusted }`; gcal prints it as a list of hits
 * with cursor paging (WC-OUT-4, WC-OUT-5), and each hit names its own untrusted fields, as `events list` does.
 */
const hitsOf = (command: Command, value: Record<string, unknown>) => {
  const opts = command.opts<{ limit: number; exact?: boolean; newest?: boolean }>()
  const untrusted = listedFields(value.untrusted, "hits.")
  const { next, ...list } = listOf(pathOf(command).join(" "), {
    items: (value.hits as unknown[]).map((hit) => ({ ...(snakeKeys(hit) as object), untrusted })),
    limit: opts.limit,
    has_more: value.has_more === true,
    paging: "cursor",
    ...(typeof value.next_offset === "number" ? { cursor: String(value.next_offset) } : {}),
    args: {
      query: command.processedArgs[0],
      ...(opts.exact ? { exact: true } : {}),
      ...(opts.newest ? { newest: true } : {}),
    },
    ...(typeof value.meaning_skipped === "string"
      ? { missing: [{ field: "items", why: `not searched by meaning: ${value.meaning_skipped}` }] }
      : {}),
  })
  // Without a cursor there is no next page to run: Google's search pages per calendar, and gcal does not follow it.
  const kept = typeof value.next_offset === "number" ? next : next?.filter((one) => one.step !== "page.next")
  return { ...list, ...(kept?.length ? { next: kept } : {}) }
}

/**
 * cli-core's reads answer `{ items, page, limit, hasMore, meta? }` or one value; gcal prints both in its own envelope.
 * The shared reads take no `--page`, so `has_more` stays without the page step `listOf` would add: it could not run.
 */
const bodyOf = (command: Command, value: unknown) => {
  if (isRecord(value) && Array.isArray(value.hits)) return hitsOf(command, value)
  if (isRecord(value) && Array.isArray(value.items) && Object.keys(value).every((key) => LIST_KEYS.has(key))) {
    const { next, page, ...list } = listOf(pathOf(command).join(" "), {
      items: snakeKeys(value.items) as unknown[],
      limit: Math.max(1, typeof value.limit === "number" ? value.limit : value.items.length),
      has_more: value.hasMore === true,
      ...(isRecord(value.meta) ? { meta: snakeKeys(value.meta) as Parameters<typeof listOf>[1]["meta"] } : {}),
    })
    const { next_page: _unreachable, ...shown } = page as typeof page & { next_page?: number }
    const kept = next?.filter((one) => one.step !== "page.next") ?? []
    return { ...list, page: shown, ...(kept.length > 0 ? { next: kept } : {}) }
  }
  // A sync its budget stopped is a partial answer: `meta.complete` says so, the command's `partial` keeps exit 0, and
  // its `next` goes where the envelope prints a step: the whole line at a terminal, the command and args for an agent.
  if (isRecord(value) && value.state === "partial") {
    const { next, hint, ...report } = value
    // cli-core points at `status`, which gcal moved to `store status`.
    if (typeof hint === "string") report.hint = hint.replace(/ status$/u, " store status")
    return itemOf(snakeKeys(report), {
      meta: { complete: false },
      ...(Array.isArray(next) ? { next: next as NextStep[] } : {}),
    })
  }
  return itemOf(snakeKeys(value))
}

const notOpen = () => new CliError("configuration_error", "the shared store is not open for this command")

/**
 * cli-core's shared calendar commands over Google, mounted for one program. The commands are mounted when the program
 * is built, before a profile is known, so the store, the account and the provider are read through getters once
 * `prepare` opened them.
 */
const mountOnce = () => {
  let action: Command | undefined
  let opened: Opened | undefined
  const answers: (() => void)[] = []
  const commands = new Set<Command>()
  const need = () => {
    if (!opened) throw notOpen()
    return opened
  }
  // cli-core mounts `events move` only when the writer has `move`, and reads that before any store is open.
  const google = () => need().writer()
  const writer: CalendarWriter = {
    provider: "google-calendar",
    create: (...args) => google().create(...args),
    update: (...args) => google().update(...args),
    remove: (...args) => google().remove(...args),
    respond: (...args) => google().respond(...args),
    move: (...args) => google().move(...args),
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
    get profile() {
      return need().profile
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
    freeBusy: true,
    serverSearch: true,
    embed: async (max) => {
      const { store, env } = need()
      const { embedEvents } = await import("@wirecat/cli-core/services")
      return embedEvents(store, { maxChunks: max, env, command: IDENTITY.command })
    },
    write: (value) => {
      const at = action
      if (!at) throw notOpen()
      const body = bodyOf(at, value)
      answers.push(() => renderAnswer(at, outputFor(at), body))
    },
    writes: {
      writer,
      app: IDENTITY,
      // Read on every write, with the command's own --permission and the read-only lock, as the shared check sees them.
      settings: () => ({ ...resolved(), permissionDefaults: permissions.defaults }),
      // The api keys guard the shared writes only once the owner sets them: their built-in `ask` is for the raw
      // `gcal api` calls, which check no delete or series key of their own, and would undo cli-core's `allow`.
      extraKeys: (write) => writeKeys(write).filter((key) => levelFor(resolved().permissions, key).level !== "allow"),
      get env() {
        return need().env
      },
    },
  }

  const resolved = () => {
    if (!action) throw notOpen()
    return configuration.resolveSettings(action.optsWithGlobals<GlobalFlags>(), { env: need().env })
  }

  const flush = () => {
    for (const answer of answers.splice(0)) answer()
  }

  const holder = new Command(IDENTITY.command)
  addCalendarCommands(holder, deps)
  reshape(holder)
  for (const group of holder.commands) {
    if (group.commands.length) annotate(group, { effects: NO_EFFECTS })
    for (const leaf of leaves(group)) commands.add(leaf)
  }

  return {
    commands: [...holder.commands],
    configure: (program: Command) => {
      program.hook("preAction", (_root, chosen) => {
        action = chosen
      })
      // WC-LIFE-4: a close that fails can change the answer, so the store closes before anything is printed.
      program.hook("postAction", async () => {
        await opened?.close()
        flush()
      })
    },
    /** After the shared checks passed: opens the store for a calendar command, for the profile's own account only. */
    prepare: async (_program: Command, environment: RunOptions) => {
      if (!action || !commands.has(action)) return
      const gcalEnvironment = environment as GcalEnvironment
      const env = gcalEnvironment.env ?? process.env
      const { profile } = configuration.resolveSettings(action.optsWithGlobals<GlobalFlags>(), { env })
      const [
        { apiAccess, savedAccount },
        { openGcalStore, PROVIDER },
        { googleApi },
        { googleCalendarSource },
        { googleCalendarWriter },
      ] = await Promise.all([
        import("../session.js"),
        import("../store.js"),
        import("../google-api.js"),
        import("../calendar-source.js"),
        import("../calendar-writer.js"),
      ])
      const account = savedAccount(env, profile)
      if (!account)
        throw new CliError(
          "authentication_error",
          `profile ${profile} has no Google account yet; run ${IDENTITY.command} ${profile} session start`,
          { reason: "profile.not-signed-in" },
        )
      const store = await openGcalStore(env)
      let closed: Promise<void> | undefined
      const close = () => (closed ??= store.close())
      // Still tracked: a command that fails never reaches postAction.
      gcalEnvironment.trackCloseable?.({ close })
      const key = { provider: PROVIDER.name, account }
      const accountId = await store.accounts.saveAccount(key, { name: null })
      let source: CalendarSource | undefined
      let writer: GoogleCalendarWriter | undefined
      let api: GoogleApi | undefined
      const { keyring, fetch, signal } = gcalEnvironment
      const googleOf = () =>
        (api ??= wordedApi(
          googleApi(apiAccess({ env, profile, signInCommand: signInWords(profile), keyring, fetch, signal })),
          profile,
        ))
      opened = {
        profile,
        store,
        accountId,
        account: key,
        env,
        source: () => (source ??= googleCalendarSource(googleOf())),
        writer: () => (writer ??= googleCalendarWriter(googleOf())),
        close,
      }
    },
  }
}

type Mount = ReturnType<typeof mountOnce>

/**
 * cli-core builds a new program for every MCP tool call from one definition, and runs those calls at once, so each
 * program keeps its own action, store and answers (WC-ARCH-22).
 */
export const calendarMount = () => {
  const mounts = new WeakMap<Command, Mount>()
  const mountOf = (program: Command) => {
    const mount = mounts.get(program)
    if (!mount) throw new CliError("configuration_error", "the calendar commands are not mounted on this program")
    return mount
  }
  return {
    commands: (): Command[] => {
      const mount = mountOnce()
      for (const command of mount.commands) mounts.set(command, mount)
      return mount.commands
    },
    configure: (program: Command) => {
      const mount = program.commands.map((command) => mounts.get(command)).find((one) => one !== undefined)
      if (!mount) throw new CliError("configuration_error", "the calendar commands are not mounted on this program")
      mounts.set(program, mount)
      mount.configure(program)
    },
    prepare: (program: Command, environment: RunOptions) => mountOf(program).prepare(program, environment),
  }
}
