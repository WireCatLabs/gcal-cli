import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { CliError } from "@wirecat/cli-base"
import { annotate, metaOf } from "@wirecat/cli-base/commands"
import { hostFetch } from "@wirecat/cli-base/http"
import type { Missing } from "@wirecat/cli-base/standards"
import type { EventSink } from "@wirecat/cli-core/cli"
import {
  baseContext,
  environmentOf,
  fetchesOnly,
  hasSharedContract,
  inCommandRun,
  itemOf,
  listOf,
  NO_EFFECTS,
  outputFor,
  overrideSharedContract,
  readOnlyLockOf,
  readsOverMcp,
  refuseOffline,
  renderAnswer,
  runBudgetOf,
  snakeKeys,
  writeNewFile,
  writesNewFileOnlyWith,
} from "@wirecat/cli-core/cli"
import type { MeetingSource, MeetingStore } from "@wirecat/cli-core/meetings"
import { addMeetingCommands, type MeetingCommandDeps } from "@wirecat/cli-core/meetings/cli"
import type { MessageStore } from "@wirecat/cli-core/store"
import { Command } from "commander"
import { configuration } from "../config.js"
import { MEET_READ_SCOPE } from "../grants.js"
import { DESKTOP, IDENTITY } from "../identity.js"
import type { MeetApi } from "../meet/api.js"
import type { GcalEnvironment } from "./session.js"
import { inWords, signInWords, worded } from "./words.js"

interface Opened {
  store: MessageStore
  accountId: number
  source: () => MeetingSource
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

const goOn = (command: string, step: string, why: string) => ({
  meta: { complete: false },
  next: [{ kind: "command" as const, step, command, args: {}, why, safe_to_auto_execute: true }],
})

/** cli-core's reads answer `{ items, page, limit, hasMore, meta? }` or one value; gcal prints both in its envelope. */
const bodyOf = (command: Command, value: unknown) => {
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
  // `meetings show` answers one item with what the service could not say beside it.
  if (isRecord(value) && isRecord(value.item) && Object.keys(value).every((key) => SHOWN_KEYS.has(key)))
    return itemOf(snakeKeys(value.item), {
      ...(Array.isArray(value.missing) ? { missing: value.missing as Missing[] } : {}),
      ...(isRecord(value.meta)
        ? { meta: snakeKeys(value.meta) as NonNullable<Parameters<typeof itemOf>[1]>["meta"] }
        : {}),
    })
  if (pathOf(command).join(" ") === "meetings sync" && isRecord(value) && value.stopped)
    return itemOf(
      snakeKeys(value),
      goOn("meetings sync", "sync.continue", `${value.remaining} calls were not reached before the run stopped`),
    )
  return itemOf(snakeKeys(value))
}

const scopeMissing = () =>
  new CliError("permission_error", "this profile signed in without access to Google Meet", {
    reason: "oauth.scope-missing",
    grant: "meetings",
    sent: false,
  })

/** An empty store in a temporary folder, removed when it closes: `GCAL_READ_ONLY` creates no `wirecat.db`. */
const emptyStore = async (env: NodeJS.ProcessEnv, open: (env: NodeJS.ProcessEnv) => Promise<MessageStore>) => {
  const folder = mkdtempSync(join(tmpdir(), `${IDENTITY.command}-empty-`))
  const removing = () => rmSync(folder, { recursive: true, force: true })
  try {
    const store = await open({ ...env, MESSAGING_STORE: join(folder, "wirecat.db") })
    const close = store.close.bind(store)
    store.close = () => close().finally(removing)
    return store
  } catch (error) {
    removing()
    throw error
  }
}

/**
 * The profile's Google Meet account in the shared store: provider `google-meet` and the Google address, as the
 * calendar's own account, so both join by address. A pure read opens it read-only and finds the row an earlier
 * sync saved; a read that keeps what Google returns, a sync, and the first read of a profile open it for writing.
 */
const openMeetStore = async (env: NodeJS.ProcessEnv, email: string, readOnly: boolean) => {
  const [{ openGcalStore, MEET_PROVIDER }] = await Promise.all([import("../store.js")])
  const key = { provider: MEET_PROVIDER.name, account: email }
  const writable = async (target: NodeJS.ProcessEnv) => {
    const store = await openGcalStore(target)
    try {
      await store.accounts.registerProvider(MEET_PROVIDER)
      return { store, accountId: await store.accounts.saveAccount(key, { name: null }) }
    } catch (error) {
      await store.close()
      throw error
    }
  }
  if (readOnly) {
    const store = await openGcalStore(env, { readOnly: true }).catch(() => undefined)
    if (store) {
      const saved = await store.accounts.storedAccount(key).catch(() => undefined)
      if (saved) return { store, accountId: saved.id }
      await store.close()
    }
    if (readOnlyLockOf(IDENTITY, env) !== undefined) {
      let accountId = 0
      const store = await emptyStore(env, async (target) => {
        const opened = await writable(target)
        accountId = opened.accountId
        return opened.store
      })
      return { store, accountId }
    }
  }
  return writable(env)
}

/** The shared `meetings` commands over Google Meet; their store reads and writes are cli-core's. */
export const meetingsMount = () => {
  const commands = new Set<Command>()
  let action: Command | undefined
  let opened: Opened | undefined
  let events: EventSink | undefined
  const answers: (() => void)[] = []
  const need = (): Opened => {
    if (!opened) throw new CliError("configuration_error", "the meetings store is not open for this command")
    return opened
  }
  const deps: MeetingCommandDeps = {
    get store(): MeetingStore {
      return need().store.meetings
    },
    get accountId() {
      return need().accountId
    },
    get source() {
      return need().source()
    },
    // Every Meet request lands in the command's run, so `--timeout` ends it and `runs` shows it (WC-LIFE-5).
    inRun: (command, body) =>
      inCommandRun(command, (sink) => {
        events = sink
        return body()
      }),
    newFileOutput: writesNewFileOnlyWith,
    writeFile: writeNewFile,
    budgetOf: runBudgetOf,
    write: (value) => {
      const at = action
      if (!at) throw new CliError("configuration_error", "no command is running")
      const body = bodyOf(at, value)
      answers.push(() => renderAnswer(at, outputFor(at), body))
    },
  }
  return {
    commands: (): Command[] => {
      const holder = new Command(IDENTITY.command)
      addMeetingCommands(holder, deps)
      // cli-core's `events list` reads the same stored events gcal's own `events` group already lists.
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
        commands.add(leaf)
      }
      return [meetings]
    },
    configure: (program: Command) => {
      program.hook("preAction", (_root, chosen) => {
        action = chosen
      })
      // WC-LIFE-4: a close that fails can change the answer, so the store closes before anything is printed.
      program.hook("postAction", async () => {
        await opened?.close()
        for (const answer of answers.splice(0)) answer()
      })
    },
    prepare: async () => {
      const at = action
      if (!at || !commands.has(at)) return
      const environment = environmentOf<GcalEnvironment>(at)
      const { settings, env, keyring } = baseContext(at, configuration.resolveSettings)
      const { profile } = settings
      const [{ apiAccess, savedAccount }, { meetApi }, { googleMeetSource }] = await Promise.all([
        import("../session.js"),
        import("../meet/api.js"),
        import("../meet/source.js"),
      ])
      const email = savedAccount(env, profile)
      if (!email)
        throw new CliError(
          "authentication_error",
          `profile ${profile} has no Google account yet; run ${signInWords(profile)} --grant meetings`,
          { reason: "session.missing" },
        )
      const effects = metaOf(at).effects
      const flags = at.optsWithGlobals<{ offline?: boolean; backend?: string }>()
      const storeOnly = flags.offline === true || flags.backend === "archive"
      // A command whose only write is a file (`meetings export --output`) leaves the store as it was; list and show
      // keep what Google returns, so they write unless they read the store alone.
      const reads =
        effects?.remote === "read"
          ? storeOnly && effects.local === "read"
          : effects?.local === "read" || (readsOverMcp(at) && !fetchesOnly(at))
      const { store, accountId } = await openMeetStore(env, email, reads)
      let closed: Promise<void> | undefined
      const close = () => (closed ??= store.close())
      // Still tracked: a command that fails never reaches postAction.
      environment.trackCloseable?.({ close })
      const fetch = hostFetch({ hosts: DESKTOP.hosts, ...(environment.fetch ? { fetch: environment.fetch } : {}) })
      let api: MeetApi | undefined
      const meet = (): MeetApi => {
        if (api) return api
        refuseOffline(at, "Google Meet")
        const access = apiAccess({
          env,
          profile,
          signInCommand: signInWords(profile),
          keyring,
          fetch,
          signal: environment.signal,
        })
        const scopes = access.scopes()
        if (!scopes)
          throw inWords(
            new CliError("authentication_error", "not signed in to Google", { reason: "session.missing" }),
            profile,
          )
        if (!scopes.includes(MEET_READ_SCOPE)) throw inWords(scopeMissing(), profile)
        api = meetApi({
          fetch,
          accessToken: () => worded(profile, access.accessToken),
          signal: environment.signal,
          events,
        })
        return api
      }
      let source: MeetingSource | undefined
      opened = { store, accountId, close, source: () => (source ??= googleMeetSource(meet)) }
    },
  }
}
