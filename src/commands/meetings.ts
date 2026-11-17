import { CliError } from "@wirecat/cli-base"
import { annotate, hasSharedContract, metaOf, overrideSharedContract } from "@wirecat/cli-base/commands"
import type { Missing } from "@wirecat/cli-base/standards"
import {
  askBeforeWrite,
  baseContext,
  environmentOf,
  fetchesOnly,
  inCommandRun,
  itemOf,
  listOf,
  NO_EFFECTS,
  outputFor,
  pagingOf,
  readsOverMcp,
  refuseOffline,
  renderAnswer,
  runBudgetOf,
  snakeKeys,
  writeNewFile,
  writesNewFileOnlyWith,
} from "@wirecat/cli-core/cli"
import { createMeetingManagement, type MeetingManagement, type MeetingStore } from "@wirecat/cli-core/meetings"
import { addMeetingCommands, type MeetingCommandDeps } from "@wirecat/cli-core/meetings/cli"
import type { MessageStore } from "@wirecat/cli-core/store"
import { Command } from "commander"
import { configuration } from "../config.js"
import { MEET_READ_SCOPE } from "../grants.js"
import { IDENTITY } from "../identity.js"
import type { MeetApi } from "../meet/api.js"
import { spaceIdOf } from "../meet/ids.js"
import type { GoogleMeetSource, MeetRun } from "../meet/source.js"
import { spacePorts } from "../meet/spaces.js"
import { MEET_PROVIDER } from "../store.js"
import { type StoreRows, storeFor } from "./open-store.js"
import type { GcalEnvironment } from "./session.js"
import { inWords, signInWords, wordedApi } from "./words.js"

interface Opened {
  /** Absent for a space write: it changes Google only, and keeps nothing. */
  store?: MessageStore
  accountId?: number
  source: () => GoogleMeetSource
  run: () => MeetRun | undefined
  management: () => MeetingManagement
  close: () => Promise<void>
}

const leaves = (command: Command): Command[] => (command.commands.length ? command.commands.flatMap(leaves) : [command])
const pathOf = (command: Command): string[] =>
  command.parent?.parent ? [...pathOf(command.parent), command.name()] : [command.name()]
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
const LIST_KEYS = new Set(["items", "page", "limit", "hasMore", "meta"])
const SHOWN_KEYS = new Set(["item", "missing", "meta"])

/** Meet makes no summary of its own (Gemini notes are a Doc, linked like the transcript), and there is no file to import. */
const UNUSED = new Set(["summary", "import"])

const EXAMPLES: Record<string, string> = {
  "meetings list": "started_at>=2026-11-01 --limit 20",
  "meetings show": "1",
  "meetings transcript": "1",
  "meetings export": "1 --format markdown",
  "meetings people": '"Test Person"',
  "meetings sync": "--since-time 2026-11-01T00:00:00Z",
  "meetings repair": "",
  "meetings create": "--setting access_type=trusted --setting auto_transcription=true --dry-run",
  "meetings update": "spaces/jQCFfuBOdN5z --setting moderation=true --dry-run",
}

const SPACE_WRITES: Record<string, string> = {
  "meetings create": "meet.spaces.create",
  "meetings update": "meet.spaces.patch",
}

const withExample = (leaf: Command) => {
  const path = pathOf(leaf).join(" ")
  const args = EXAMPLES[path]
  if (args === undefined) return
  const change = (one: Command) => {
    annotate(one, { examples: [[IDENTITY.command, "personal", path, args, "--json"].filter(Boolean).join(" ")] })
  }
  if (hasSharedContract(leaf)) overrideSharedContract(leaf, "gcal's examples name its profile.", change)
  else change(leaf)
}

/** Google deletes a call's record, its people and its transcript 30 days after it ends; this leaves five to sync. */
const HELD_MS = 25 * 86_400_000
const SYNC_WHY = "the run stopped before it reached every call; running it again goes on from there"

/**
 * The same sync again, as cli-core's calendar sync gives it: with the run's own `--timeout` and `--lookback-days`, never
 * `--since-time` or `--rescan`, which would read the same calls again; a run that saved nothing gets a hint instead.
 */
const syncAnswer = (command: Command, value: Record<string, unknown>, state: MeetingsRun) => {
  const flags = command.optsWithGlobals<{ timeout?: string; lookbackDays?: number }>()
  const limited = state.opened?.run()?.limitedBy
  const wait = limited?.details.retry_after_ms
  const report = snakeKeys(value) as Record<string, unknown>
  const moved = typeof value.meetings === "number" && value.meetings > 0
  const held = state.cursor === undefined || state.cursor === null ? undefined : Date.parse(state.cursor)
  if (held !== undefined && Date.now() - held >= HELD_MS)
    report.hint =
      `the sync is held at ${state.cursor} by a call it could not finish, such as a transcript still pending; ` +
      "Google deletes a call's record and transcript 30 days after it ends"
  if (!value.stopped && !limited) return itemOf(report)
  if (limited)
    report.hint = `Google Meet's rate limit stopped the run; run meetings sync again${typeof wait === "number" ? ` after ${Math.ceil(wait / 1000)} s` : " later"}`
  else if (!moved) report.hint = "this run saved no call: raise --timeout, then run meetings sync again"
  return itemOf(report, {
    meta: { complete: false, ...(typeof wait === "number" ? { retry_after_ms: wait } : {}) },
    ...(moved || limited
      ? {
          next: [
            {
              kind: "command" as const,
              step: "meetings.sync",
              command: "meetings sync",
              args: Object.fromEntries(
                Object.entries({ timeout: flags.timeout, lookback_days: flags.lookbackDays }).filter(
                  ([, one]) => one !== undefined,
                ),
              ),
              why: limited ? "Google Meet's rate limit stopped the run" : SYNC_WHY,
              safe_to_auto_execute: true,
            },
          ],
        }
      : {}),
  })
}

const TRANSCRIPT_PENDING = "Google Meet has not finished the transcript yet; the next sync or show reads it again"

/** cli-core's reads answer `{ items, page, limit, hasMore, meta? }` or one value; gcal prints both in its envelope. */
const bodyOf = (command: Command, value: unknown, state: MeetingsRun) => {
  const body = answerOf(command, value, state)
  const ungranted = state.ungranted
  if (!ungranted || !isRecord(body)) return body
  const missing = [
    ...(Array.isArray(body.missing) ? (body.missing as Missing[]) : []),
    { field: "server", why: ungranted },
  ]
  return { ...body, missing } as typeof body
}

const answerOf = (command: Command, value: unknown, state: MeetingsRun) => {
  const run = state.opened?.run()
  if (isRecord(value) && Array.isArray(value.items) && isRecord(value.page))
    return value as Parameters<typeof renderAnswer>[2]
  if (isRecord(value) && Array.isArray(value.items) && Object.keys(value).every((key) => LIST_KEYS.has(key))) {
    const { next, ...list } = listOf(pathOf(command).join(" "), {
      items: snakeKeys(value.items) as unknown[],
      limit: Math.max(1, typeof value.limit === "number" ? value.limit : value.items.length),
      has_more: value.hasMore === true,
      ...(isRecord(value.meta) ? { meta: snakeKeys(value.meta) as Parameters<typeof listOf>[1]["meta"] } : {}),
    })
    const kept = next?.filter((one) => one.step !== "page.next") ?? []
    return { ...list, ...(kept.length > 0 ? { next: kept } : {}) }
  }
  if (isRecord(value) && isRecord(value.item) && Object.keys(value).every((key) => SHOWN_KEYS.has(key))) {
    const missing = [
      ...(Array.isArray(value.missing) ? (value.missing as Missing[]) : []),
      ...(run?.pending.size ? [{ field: "transcript", why: TRANSCRIPT_PENDING }] : []),
    ]
    return itemOf(snakeKeys(value.item), {
      ...(missing.length > 0 ? { missing } : {}),
      ...(isRecord(value.meta)
        ? { meta: snakeKeys(value.meta) as NonNullable<Parameters<typeof itemOf>[1]>["meta"] }
        : {}),
    })
  }
  if (pathOf(command).join(" ") === "meetings sync" && isRecord(value)) return syncAnswer(command, value, state)
  return itemOf(snakeKeys(value))
}

/** The profile's Google Meet account: provider `google-meet` and the Google address, so it joins the calendar's. */
const meetRows = (account: string): StoreRows => {
  const key = { provider: MEET_PROVIDER.name, account }
  return {
    stored: async (store) => (await store.accounts.storedAccount(key)).id,
    save: async (store) => {
      await store.accounts.registerProvider(MEET_PROVIDER)
      return store.accounts.saveAccount(key, { name: null })
    },
  }
}

/** What one program's meetings command holds: an MCP server runs many programs at once, each with its own. */
interface MeetingsRun {
  commands: Set<Command>
  action?: Command
  opened?: Opened
  answers: (() => void)[]
  /** Where a sync left the cursor, read after it so its answer can say how long a call has held it. */
  cursor?: string | null
  /** Why Google was not asked: the profile signed in without `--grant meetings`, and the command that adds it. */
  ungranted?: string
}

const depsOf = (state: MeetingsRun): MeetingCommandDeps => {
  const need = (): Opened => {
    if (!state.opened) throw new CliError("configuration_error", "the meetings store is not open for this command")
    return state.opened
  }
  const stored = () => {
    const { store, accountId } = need()
    if (!store || accountId === undefined)
      throw new CliError("configuration_error", "the meetings store is not open for this command")
    return { store, accountId }
  }
  // The account is known only once the command runs; the declaration, which mounts the options, is the same for all.
  const declared = createMeetingManagement(
    { provider: MEET_PROVIDER.name, account: "unbound" },
    spacePorts(() => {
      throw new CliError("configuration_error", "no Google Meet account is open for this command")
    }),
  )
  const management: MeetingManagement = {
    ...declared,
    create: (change, options) => need().management().create(change, options),
    update: (id, change, options) => need().management().update(id, change, options),
  }
  return {
    get store(): MeetingStore {
      return stored().store.meetings
    },
    get accountId() {
      return stored().accountId
    },
    management,
    // A read the run's stop cut short must end the command, not fall back to the store (CORE-70).
    signal: () => (state.action ? environmentOf<GcalEnvironment>(state.action).signal : undefined),
    askFirst: askBeforeWrite,
    pagingOf,
    get source() {
      return need().source()
    },
    // Every Meet request lands in the command's run, so `--timeout` ends it and `runs` shows it (WC-LIFE-5).
    inRun: (command, body) =>
      inCommandRun(command, async () => {
        const result = await body()
        if (pathOf(command).join(" ") === "meetings sync")
          state.cursor = await stored().store.meetings.cursor(stored().accountId)
        return result
      }),
    newFileOutput: writesNewFileOnlyWith,
    writeFile: writeNewFile,
    // A rate limit ends the run: each request after it would be refused too, and the cursor waits at the call it hit.
    budgetOf: (command) => {
      const budget = runBudgetOf(command)
      return { take: () => (state.opened?.run()?.limitedBy ? "requests" : budget.take()) }
    },
    write: (value) => {
      const at = state.action
      if (!at) throw new CliError("configuration_error", "no command is running")
      state.answers.push(() => renderAnswer(at, outputFor(at), bodyOf(at, value, state)))
    },
  }
}

export const meetingsMount = () => {
  const runs = new WeakMap<Command, MeetingsRun>()
  const runOf = (program: Command) => {
    const group = program.commands.find((one) => one.name() === "meetings")
    return group ? runs.get(group) : undefined
  }
  return {
    commands: (): Command[] => {
      const state: MeetingsRun = { commands: new Set(), answers: [] }
      const holder = new Command(IDENTITY.command)
      addMeetingCommands(holder, depsOf(state))
      const meetings = holder.commands.find((group) => group.name() === "meetings")
      if (!meetings) throw new CliError("configuration_error", "cli-core mounted no meetings group")
      overrideSharedContract(
        meetings,
        "Google Meet has no summaries of its own and no transcript files to import.",
        (group) => {
          const mounted = group.commands as Command[]
          for (const one of mounted.filter((leaf) => UNUSED.has(leaf.name()))) mounted.splice(mounted.indexOf(one), 1)
        },
      )
      if (!hasSharedContract(meetings)) annotate(meetings, { effects: NO_EFFECTS })
      for (const leaf of leaves(meetings)) {
        withExample(leaf)
        state.commands.add(leaf)
      }
      runs.set(meetings, state)
      // Not cli-core's `events list`: it reads the same stored events gcal's own `events` group already lists.
      return [meetings]
    },
    configure: (program: Command) => {
      const state = runOf(program)
      if (!state) return
      program.hook("preAction", (_root, chosen) => {
        state.action = chosen
      })
      // WC-LIFE-4: a close that fails can change the answer, so the store closes before anything is printed.
      program.hook("postAction", async () => {
        await state.opened?.close()
        for (const answer of state.answers.splice(0)) answer()
      })
    },
    prepare: async (program: Command) => {
      const state = runOf(program)
      const at = state?.action
      if (!state || !at || !state.commands.has(at)) return
      const environment = environmentOf<GcalEnvironment>(at)
      const { settings, env, keyring } = baseContext(at, configuration.resolveSettings)
      const { profile } = settings
      const [
        { apiAccess, savedAccount },
        { googleApi, refuseMissingScope },
        { meetApi, MEET },
        { googleMeetSource },
        { openGcalStore },
      ] = await Promise.all([
        import("../session.js"),
        import("../google-api.js"),
        import("../meet/api.js"),
        import("../meet/source.js"),
        import("../store.js"),
      ])
      const spaceWrite = SPACE_WRITES[pathOf(at).join(" ")]
      const email = savedAccount(env, profile)
      if (!email)
        throw new CliError(
          "authentication_error",
          `profile ${profile} has no Google account yet; run ${signInWords(profile)} --grant ${spaceWrite ? "write,meetings" : "meetings"}`,
          { reason: "session.missing" },
        )
      const effects = metaOf(at).effects
      const flags = at.optsWithGlobals<{ offline?: boolean; backend?: string }>()
      const storeOnly = flags.offline === true || flags.backend === "archive"
      const { fetch, signal } = environment
      const access = apiAccess({ env, profile, signInCommand: signInWords(profile), keyring, fetch, signal })
      const granted = (method = "meet.conferenceRecords.list") => {
        const scopes = access.scopes()
        if (!scopes)
          throw inWords(
            new CliError("authentication_error", "not signed in to Google", { reason: "session.missing" }),
            profile,
          )
        try {
          refuseMissingScope(method, scopes, MEET)
        } catch (error) {
          throw inWords(error, profile)
        }
      }
      let api: MeetApi | undefined
      const meet = (): MeetApi => {
        if (api) return api
        refuseOffline(at, MEET.name)
        granted(spaceWrite)
        api = meetApi(wordedApi(googleApi(access, MEET), profile))
        return api
      }
      let management: MeetingManagement | undefined
      const manage = () =>
        (management ??= createMeetingManagement({ provider: MEET_PROVIDER.name, account: email }, spacePorts(meet)))
      if (spaceWrite) {
        // Checked before the owner's question, which a missing grant or a wrong id would only waste.
        granted(spaceWrite)
        if (at.name() === "update") spaceIdOf(String(at.args[0] ?? ""))
        state.opened = {
          close: async () => {},
          source: () => {
            throw new CliError("configuration_error", "a space write reads no calls")
          },
          run: () => undefined,
          management: manage,
        }
        return
      }
      // Before the store opens for writing, so a refused sync leaves no Google Meet account behind.
      if (fetchesOnly(at)) granted()
      const unread = !(access.scopes() ?? []).includes(MEET_READ_SCOPE)
      if (unread && effects?.remote === "read" && !storeOnly)
        try {
          granted()
        } catch (error) {
          state.ungranted = error instanceof Error ? error.message : String(error)
        }
      // A command whose only write is a file (`meetings export --output`) leaves the store as it was; list and show
      // keep what Google returns, so they write unless they read the store alone or cannot read Google at all.
      const reads =
        effects?.remote === "read"
          ? (storeOnly || unread) && effects.local === "read"
          : effects?.local === "read" || (readsOverMcp(at) && !fetchesOnly(at))
      // Without the grant a read can keep nothing from Google, so it saves no Google Meet account either.
      const { store, accountId } = await storeFor(env, reads, meetRows(email), openGcalStore, {
        saves: !(unread && effects?.remote === "read"),
      })
      let closed: Promise<void> | undefined
      const close = () => (closed ??= store.close())
      // Still tracked: a command that fails never reaches postAction.
      environment.trackCloseable?.({ close })
      let source: GoogleMeetSource | undefined
      state.opened = {
        store,
        accountId,
        close,
        source: () => (source ??= googleMeetSource(meet)),
        run: () => source?.run,
        management: manage,
      }
    },
  }
}
