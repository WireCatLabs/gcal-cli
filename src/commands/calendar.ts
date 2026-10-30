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
  overrideSharedContract,
  type RunOptions,
  renderAnswer,
  snakeKeys,
} from "@wirecat/cli-core/cli"
import type { MessageStore } from "@wirecat/cli-core/store"
import { Command, Option } from "commander"
import { configuration, permissions, writeKeys } from "../config.js"
import type { GoogleApi } from "../google-api.js"
import { IDENTITY } from "../identity.js"
import type { GcalEnvironment } from "./session.js"
import { wordedApi } from "./words.js"

interface Opened {
  profile: string
  store: MessageStore
  accountId: number
  account: { provider: string; account: string }
  env: NodeJS.ProcessEnv
  /** Built on first use: a local read never reads the sign-in. */
  source: () => CalendarSource
  writer: () => CalendarWriter
  api: () => GoogleApi
  close: () => Promise<void>
}

type Handler = Parameters<Command["action"]>[0]

/** Keeps each command's action, through Commander's documented `createCommand` hook, so gcal can hand back to it. */
class Recorded extends Command {
  handler: Handler | undefined
  override createCommand(name?: string): Command {
    return new Recorded(name)
  }
  override action(handler: Handler): this {
    this.handler = handler
    return super.action(handler)
  }
}

const REMOTE_READ_LOCAL_READ = { remote: "read", local: "read" } as const

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
      words: command.processedArgs[0],
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
    const { next, ...report } = value
    return itemOf(snakeKeys(report), {
      meta: { complete: false },
      ...(Array.isArray(next) ? { next: next as NextStep[] } : {}),
    })
  }
  return itemOf(snakeKeys(value))
}

type Backend = "archive" | "server" | "both"

interface RemoteOptions {
  backend: Backend
  limit: number
  cursor: number
  exact?: boolean
  newest?: boolean
}

const notOpen = () => new CliError("configuration_error", "the shared store is not open for this command")

/**
 * cli-core's shared calendar commands over Google. The commands are mounted when the program is built, before a
 * profile is known, so the store, the account and the provider are read through getters once `prepare` opened them.
 */
export const calendarMount = () => {
  let action: Command | undefined
  let opened: Opened | undefined
  const answers: (() => void)[] = []
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
      get writer() {
        return need().writer()
      },
      app: IDENTITY,
      // Read on every write, with the command's own --permission and the read-only lock, as the shared check sees them.
      settings: () => {
        if (!action) throw notOpen()
        return {
          ...configuration.resolveSettings(action.optsWithGlobals<GlobalFlags>(), { env: need().env }),
          permissionDefaults: permissions.defaults,
        }
      },
      extraKeys: writeKeys,
      get env() {
        return need().env
      },
    },
  }

  const flush = () => {
    for (const answer of answers.splice(0)) answer()
  }

  // cli-core's sync prints its report, then fails when a calendar did not sync: the report must still reach the
  // caller, after the store closed (WC-LIFE-4), and never when the close failed.
  const keepAnswerOnFailure = (leaf: Command) => {
    const handler = leaf instanceof Recorded ? leaf.handler : undefined
    if (!handler) return
    leaf.action(async function (this: Command, ...args: unknown[]) {
      try {
        return await handler.apply(this, args)
      } catch (error) {
        const closed = await (opened?.close() ?? Promise.resolve()).then(
          () => true,
          () => false,
        )
        if (closed) flush()
        else answers.length = 0
        throw error
      }
    })
  }

  const remoteSearch = async (words: string[], opts: RemoteOptions, command: Command) => {
    const flags = command.optsWithGlobals<GlobalFlags>()
    if (flags.offline)
      throw new CliError("permission_error", "search --backend server asks Google; leave out --offline", {
        reason: "offline.refused",
      })
    if (opts.exact || opts.cursor || opts.newest)
      throw new CliError(
        "validation_error",
        "search --backend server takes neither --exact, --cursor nor --newest: Google ranks and pages it, and " +
          "returns no newest-first order",
      )
    const { store, accountId, account, api } = need()
    const calendars = (await store.calendar.calendars(accountId)).filter(
      ({ synced, deletedAt }) => synced && !deletedAt,
    )
    if (calendars.length === 0)
      throw new CliError("validation_error", "no calendar syncs yet; run sync, or calendars sync <calendar>", {
        reason: "calendars.none-synced",
      })
    const { searchGoogle } = await import("../remote-search.js")
    const found = await searchGoogle(api(), calendars, {
      query: words.join(" "),
      limit: opts.limit,
      account: account.account,
    })
    answers.push(() => renderAnswer(command, outputFor(command), hitsOf(command, found)))
  }

  const withRemote = (search: Recorded) => {
    const local = search.handler
    if (!local) throw new CliError("configuration_error", "cli-core's search has no action to hand back to")
    overrideSharedContract(
      search,
      "gcal's search can also ask Google's own text search (--backend server), read only: a scope of the same search (WC-CMD-6, WC-CMD-7).",
      (command) => {
        annotate(command, {
          effects: REMOTE_READ_LOCAL_READ,
          examples: [
            `${IDENTITY.command} personal search roadmap planning --json`,
            `${IDENTITY.command} personal search --backend server quarterly review`,
          ],
        })
        command.description(
          "find stored events by words, and by meaning when its model is downloaded; with --backend server, ask Google instead",
        )
        command.summary("find stored events by words and meaning, or with --backend server ask Google")
        command.addOption(
          new Option(
            "--backend <archive|server|both>",
            "where to search: archive, the local store, or server, Google Calendar's own search over the synced calendars, earliest first",
          )
            .choices(["archive", "server", "both"])
            .default("archive"),
        )
      },
    )
    search.action(async function (this: Command, ...args: unknown[]) {
      const [words, opts, command] = args as [string[], RemoteOptions, Command]
      if (opts.backend === "both")
        throw new CliError(
          "validation_error",
          "search --backend both is not offered: the store's search and Google's rank and page events differently, so " +
            "one merged list would have no single order or next page; run --backend archive and --backend server",
          { reason: "search.backend-both" },
        )
      return opts.backend === "server" ? remoteSearch(words, opts, command) : local.apply(this, args)
    })
  }

  return {
    commands: (): Command[] => {
      const holder = new Recorded(IDENTITY.command)
      addCalendarCommands(holder, deps)
      const search = holder.commands.find((one) => one.name() === "search")
      if (!(search instanceof Recorded)) throw new CliError("configuration_error", "cli-core mounted no search")
      withRemote(search)
      for (const group of holder.commands) {
        if (group.commands.length) annotate(group, { effects: NO_EFFECTS })
        for (const leaf of leaves(group)) {
          keepAnswerOnFailure(leaf)
          commands.add(leaf)
        }
      }
      return [...holder.commands]
    },
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
      let writer: CalendarWriter | undefined
      let api: GoogleApi | undefined
      const { keyring, fetch, signal } = gcalEnvironment
      const googleOf = () =>
        (api ??= wordedApi(googleApi(apiAccess({ env, profile, keyring, fetch, signal })), profile))
      opened = {
        profile,
        store,
        accountId,
        account: key,
        env,
        api: googleOf,
        source: () => (source ??= googleCalendarSource(googleOf())),
        writer: () => (writer ??= googleCalendarWriter(googleOf())),
        close,
      }
    },
  }
}
