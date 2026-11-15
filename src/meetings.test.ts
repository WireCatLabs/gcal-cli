import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring } from "@wirecat/cli-base"
import { rememberAccount, run as runShared } from "@wirecat/cli-core/cli"
import type { MeetingSearchIndexStore } from "@wirecat/cli-core/meetings"
import { describe, expect, it } from "vitest"
import { CALENDAR_READ_SCOPE, sessionStorage } from "./google.js"
import { EVENTS_SCOPE, MEET_READ_SCOPE, MEET_WRITE_SCOPE } from "./grants.js"
import { IDENTITY } from "./identity.js"
import { googleMeetSource } from "./meet/source.js"
import { definition, run } from "./program.js"
import { MEET_PROVIDER, openGcalStore } from "./store.js"
import { type FakeMeetOptions, googleFailure, MEET_ACCESS } from "./testing/fake-meet.js"
import { fakeGoogleCalendar } from "./testing/google-calendar.js"
import { CONFERENCES, meetOn, RECORD, sampleMeet } from "./testing/meet-sample.js"

const harness = ({
  scopes = [CALENDAR_READ_SCOPE, MEET_READ_SCOPE],
  meet: options = {},
}: {
  scopes?: string[]
  meet?: FakeMeetOptions
} = {}) => {
  const keyring = memoryKeyring()
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
    GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
    MESSAGING_STORE: join(mkdtempSync(join(tmpdir(), "store-")), "wirecat.db"),
  }
  sessionStorage(env, "personal", keyring).write({
    tokens: { accessToken: MEET_ACCESS, refreshToken: "fixture-refresh", expiresAt: Date.now() + 3_600_000, scopes },
    client: { clientId: "fixture-client.apps" },
  })
  rememberAccount(IDENTITY, "personal", "owner@example.com", env)
  const meet = sampleMeet({ conferences: structuredClone(CONFERENCES), ...options })
  const calendar = fakeGoogleCalendar()
  const fetch = (async (input: string | URL | Request, init?: RequestInit) =>
    String(input).startsWith("https://meet.googleapis.com/")
      ? meet.fetch(input, init)
      : calendar.fetch(input, init)) as typeof globalThis.fetch
  const raw = async (argv: string[], extra: NodeJS.ProcessEnv = {}) => {
    const out: string[] = []
    const err: string[] = []
    const code = await run(argv, {
      streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
      tty: false,
      env: { ...env, ...extra },
      keyring,
      fetch,
    })
    return { code, out, err }
  }
  const gcal = async (...argv: string[]) => {
    const { code, out, err } = await raw([...argv, "--json"])
    const answer = code === 0 ? JSON.parse(out.join("\n")) : undefined
    const last = err.join("\n").trim().split("\n").at(-1)
    return { code, answer, err: err.join("\n"), error: code ? JSON.parse(last ?? "{}").error : undefined }
  }
  const ok = async (...argv: string[]) => {
    const result = await gcal(...argv)
    if (result.code !== 0) throw new Error(`${argv.join(" ")} exited ${result.code}: ${result.err}`)
    return result.answer
  }
  const meetAccount = async () => {
    const store = await openGcalStore(env, { readOnly: true })
    try {
      const { id } = await store.accounts.storedAccount({ provider: MEET_PROVIDER.name, account: "owner@example.com" })
      return { id, cursor: await store.meetings.cursor(id) }
    } finally {
      await store.close()
    }
  }
  return { gcal, ok, raw, env, meet, meetAccount, keyring, fetch }
}

const records = (meet: ReturnType<typeof sampleMeet>) =>
  meet.calls.filter(({ path }) => path === "/v2/conferenceRecords")

describe("meetings over Google Meet", () => {
  it("sync keeps the ended calls with who joined, the transcript and its Drive files, and skips a live one", async () => {
    const { ok, meet, meetAccount } = harness()
    const report = await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    expect(report.item).toMatchObject({ meetings: 2, participants: 3, transcript_rows: 2 })
    expect(records(meet)[0]?.query.filter).toBe('start_time>="2026-10-30T00:00:00.000Z"')
    expect(meet.refusals).toEqual([])
    expect((await meetAccount()).cursor).not.toBeNull()

    const listed = await ok("personal", "meetings", "list", "--offline")
    expect(listed.items.map(({ provider_id }: { provider_id: string }) => provider_id)).toEqual(["rec-2", "rec-1"])
    const shown = (await ok("personal", "meetings", "show", RECORD, "--offline")).item
    expect(shown).toMatchObject({
      provider_id: RECORD,
      url: "https://meet.google.com/abc-defg-hij",
      found_in: "archive",
    })
    expect(shown.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ file_id: "doc-t1", role: "transcript" }),
        expect.objectContaining({ file_id: "file-r1", role: "recording" }),
      ]),
    )
    const transcript = await ok("personal", "meetings", "transcript", shown.id)
    expect(JSON.stringify(transcript)).toContain("Shall we start with the plan?")
    expect(JSON.stringify(transcript)).toContain("Test Person A")
  })

  it("a transcript Google has not finished keeps the call due, and the next sync reads it", async () => {
    const conferences = structuredClone(CONFERENCES)
    const transcript = conferences[1]?.transcripts?.[0]?.transcript as Record<string, unknown>
    transcript.state = "ENDED"
    const { ok, meetAccount, meet } = harness({ meet: { conferences } })
    const first = await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    expect(JSON.stringify(first.item.warnings)).toContain("has not finished the transcript")
    expect((await meetAccount()).cursor).toBeNull()

    transcript.state = "FILE_GENERATED"
    const second = await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    expect(second.item).toMatchObject({ transcript_rows: 2, warnings: [] })
    expect((await meetAccount()).cursor).not.toBeNull()
    expect(meet.refusals).toEqual([])
  })

  it("list asks Google for the window, keeps what it returns, and says where each call was found", async () => {
    const { ok, meet } = harness()
    const first = await ok("personal", "meetings", "list", "started_at>=2026-11-01", "started_at<=2026-11-10")
    expect(records(meet).at(-1)?.query.filter).toMatch(/^start_time>="2026-1[01]-.*" AND start_time<="2026-11-1.*"$/u)
    expect(first.items.map(({ provider_id, found_in }: Record<string, string>) => [provider_id, found_in])).toEqual([
      ["rec-2", "server"],
      ["rec-1", "server"],
    ])
    const again = await ok("personal", "meetings", "list", "started_at>=2026-11-01", "started_at<=2026-11-10")
    expect(again.items.map(({ found_in }: Record<string, string>) => found_in)).toEqual(["both", "both"])
    const calls = meet.calls.length
    const archive = await ok("personal", "meetings", "list", "--backend", "archive")
    expect(archive.items).toHaveLength(2)
    expect(meet.calls).toHaveLength(calls)
  })

  it("show by Google's id reads the call live, with its people, transcript and Drive files", async () => {
    const { ok } = harness()
    const shown = (await ok("personal", "meetings", "show", `conferenceRecords/${RECORD}`)).item
    expect(shown.found_in).toBe("server")
    expect(shown.participants.map(({ name }: Record<string, string>) => name)).toEqual(
      expect.arrayContaining(["Test Person A", "Guest B"]),
    )
    expect(shown.documents).toEqual(
      expect.arrayContaining([expect.objectContaining({ file_id: "doc-t1", role: "transcript" })]),
    )
  })

  it("without --grant meetings list answers the store and names the grant; sync is refused before any request", async () => {
    const { gcal, ok, meet } = harness({ scopes: [CALENDAR_READ_SCOPE] })
    const listed = await ok("personal", "meetings", "list")
    expect(listed.items).toEqual([])
    expect(listed.meta.complete).toBe(false)
    expect(JSON.stringify(listed.meta.issues)).toContain("meetings.server-refused")
    const synced = await gcal("personal", "meetings", "sync")
    expect(synced.error).toMatchObject({ code: "permission_error", reason: "oauth.scope-missing" })
    expect(synced.error.message).toContain("gcal personal session start --grant meetings")
    expect(meet.calls).toEqual([])
  })

  it("without --grant meetings list and show save no Google Meet account, and name the grant", async () => {
    const { gcal, env } = harness({ scopes: [CALENDAR_READ_SCOPE] })
    const listed = await gcal("personal", "meetings", "list")
    expect(listed.answer.items).toEqual([])
    expect(listed.answer.missing).toContainEqual({
      field: "server",
      why: expect.stringContaining("gcal personal session start --grant meetings again"),
    })
    const shown = await gcal("personal", "meetings", "show", RECORD)
    expect(shown.error.message).toContain("--grant meetings")
    expect(existsSync(env.MESSAGING_STORE ?? "")).toBe(false)
  })

  it("a sync refused for the grant leaves no Google Meet account, and the hint keeps the grants held", async () => {
    const { gcal, env } = harness({ scopes: [CALENDAR_READ_SCOPE, EVENTS_SCOPE] })
    const synced = await gcal("personal", "meetings", "sync")
    expect(synced.error.message).toContain("--grant write,meetings again")
    expect(existsSync(env.MESSAGING_STORE ?? "")).toBe(false)
  })

  it("a synced call links to its calendar entry by its meet: code, and adds no event of its own", async () => {
    const { ok } = harness()
    await ok("personal", "sync")
    await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    const shown = (await ok("personal", "meetings", "show", "rec-1", "--offline")).item
    const listed = (await ok("personal", "events", "list", "ends_at>=2026-11-02", "starts_at<=2026-11-03")).items
    const day = listed.filter(({ starts_at }: { starts_at: string }) => starts_at.startsWith("2026-11-02"))
    expect(day.map(({ title }: { title: string }) => title)).toEqual(["Weekly planning"])
    expect(shown.event_id).toBe(day[0].id)
    expect(JSON.stringify((await ok("personal", "events", "show", `event:${day[0].id}`)).item)).toContain(
      "meet.google.com/abc-defg-hij",
    )
  })

  it("search all finds what a Meet transcript said, once the search index holds it", async () => {
    const { ok, env, meetAccount } = harness()
    await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    const store = await openGcalStore(env)
    try {
      await (store.meetings as unknown as MeetingSearchIndexStore).indexSearch({
        accountId: (await meetAccount()).id,
        maxReadBytes: 1_000_000,
      })
    } finally {
      await store.close()
    }
    const found = await ok("personal", "search", "all", "plan")
    expect(JSON.stringify(found.items)).toContain("Shall we start with the plan?")
  })

  it("keeps the token and what a transcript said out of the errors and the run records (WC-TEST-8)", async () => {
    const { raw, env } = harness()
    const printed = [
      await raw(["--record", "personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z", "--json"]),
      await raw(["--record", "personal", "meetings", "show", "rec-2", "--backend", "server", "--json"]),
      await raw(["--record", "personal", "meetings", "show", "missing-call", "--backend", "server", "--json"]),
    ]
      .map(({ err }) => err.join("\n"))
      .join("\n")
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
      )
    const records = files(env.GCAL_STATE_DIR ?? "")
      .map((path) => readFileSync(path, "latin1"))
      .join("\n")
    expect(records).toContain("/v2/conferenceRecords")
    for (const marker of [MEET_ACCESS, "Shall we start with the plan?", "Test Person A", "doc-t1"]) {
      expect(printed).not.toContain(marker)
      expect(records).not.toContain(marker)
    }
  })

  it("show keeps no transcript while Google is still making it, and says so", async () => {
    const conferences = structuredClone(CONFERENCES)
    const transcript = conferences[1]?.transcripts?.[0]?.transcript as Record<string, unknown>
    transcript.state = "ENDED"
    const { ok } = harness({ meet: { conferences } })
    const shown = await ok("personal", "meetings", "show", RECORD)
    expect(shown.missing).toEqual([expect.objectContaining({ field: "transcript" })])
    expect(shown.item.transcripts).toEqual([])
    expect((await ok("personal", "meetings", "show", RECORD, "--offline")).item.transcripts).toEqual([])
  })

  it("a smart note Google finished is kept as the call's notes document", async () => {
    const conferences = structuredClone(CONFERENCES)
    const note = conferences[1]?.smartNotes?.[0] as Record<string, unknown>
    Object.assign(note, { state: "FILE_GENERATED", docsDestination: { document: "doc-n1" } })
    const { ok } = harness({ meet: { conferences } })
    const shown = (await ok("personal", "meetings", "show", RECORD)).item
    expect(shown.documents).toEqual(
      expect.arrayContaining([expect.objectContaining({ file_id: "doc-n1", role: "notes" })]),
    )
  })

  it("sync reads every page of calls, past Google's hundred", async () => {
    const conferences = Array.from({ length: 105 }, (_, at) => ({
      record: {
        name: `conferenceRecords/many-${at}`,
        startTime: new Date(Date.UTC(2026, 10, 3, 0, at)).toISOString(),
        endTime: new Date(Date.UTC(2026, 10, 3, 0, at, 30)).toISOString(),
      },
    }))
    const { ok, meet } = harness({ meet: { conferences } })
    const synced = await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    expect(synced.item.meetings).toBe(105)
    expect(records(meet)).toHaveLength(2)
  })

  it("a call live at one sync is kept by the next one after it ends", async () => {
    const conferences = structuredClone(CONFERENCES)
    const { ok, env, meetAccount } = harness({ meet: { conferences } })
    expect((await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")).item.meetings).toBe(2)
    const store = await openGcalStore(env)
    try {
      await store.meetings.setCursor((await meetAccount()).id, "2026-11-12T00:00:00.000Z", Date.now())
    } finally {
      await store.close()
    }
    const live = conferences[2]?.record as Record<string, unknown>
    live.endTime = "2026-11-12T15:45:00Z"
    await ok("personal", "meetings", "sync")
    const listed = (await ok("personal", "meetings", "list", "--offline")).items
    expect(listed.map(({ provider_id }: { provider_id: string }) => provider_id)).toEqual(["rec-3", "rec-2", "rec-1"])
  })

  it("an MCP server's programs keep their own meetings run, so two calls at once answer each their own", async () => {
    const { env, keyring, fetch, ok } = harness()
    await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    const shared = definition()
    const call = async (argv: string[]) => {
      const out: string[] = []
      const code = await runShared([...argv, "--json"], shared, {
        streams: { data: (text) => out.push(text), diagnostic: () => {} },
        tty: false,
        env,
        keyring,
        fetch,
      })
      return { code, answer: JSON.parse(out.join("\n")) }
    }
    const [listed, shown] = await Promise.all([
      call(["personal", "meetings", "list", "--offline"]),
      call(["personal", "meetings", "show", RECORD]),
    ])
    expect(listed.answer.items).toHaveLength(2)
    expect(shown.answer.item.provider_id).toBe(RECORD)
  })

  it("GCAL_READ_ONLY with a store that cannot be opened fails, and serves no empty one in its place", async () => {
    const { raw, env } = harness()
    const broken = join(mkdtempSync(join(tmpdir(), "store-broken-")), "wirecat.db")
    writeFileSync(broken, "not a SQLite file")
    const read = await raw(["personal", "meetings", "list", "--offline", "--json"], {
      GCAL_READ_ONLY: "1",
      MESSAGING_STORE: broken,
    })
    expect(read.code).not.toBe(0)
    expect(readFileSync(broken, "utf8")).toBe("not a SQLite file")
    expect(env.MESSAGING_STORE).not.toBe(broken)
  })

  it("a sync held 25 days by a transcript still pending says so, before Google deletes the call", async () => {
    const conferences = structuredClone(CONFERENCES)
    const { ok, env, meetAccount } = harness({ meet: { conferences } })
    await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    expect((await ok("personal", "meetings", "sync")).item.hint).toBeUndefined()
    const held = new Date(Date.now() - 26 * 86_400_000).toISOString()
    const store = await openGcalStore(env)
    try {
      await store.meetings.setCursor((await meetAccount()).id, held, Date.now())
    } finally {
      await store.close()
    }
    const transcript = conferences[1]?.transcripts?.[0]?.transcript as Record<string, unknown>
    transcript.state = "ENDED"
    const synced = await ok("personal", "meetings", "sync")
    expect(synced.item.hint).toContain(`the sync is held at ${held}`)
    expect(synced.item.hint).toContain("30 days after it ends")
    expect((await meetAccount()).cursor).toBe(held)
  })
})

describe("Google Meet's refusals and limits", () => {
  const failing = (status: number, path: RegExp, headers: Record<string, string> = {}) => ({
    status,
    path,
    headers,
    body: googleFailure(
      status,
      status === 429 ? "RESOURCE_EXHAUSTED" : status === 404 ? "NOT_FOUND" : "PERMISSION_DENIED",
      "x",
    ),
  })

  it("sync: 403 on the list is access denied, 404 is not found, and nothing is saved", async () => {
    for (const [status, code] of [
      [403, "permission_error"],
      [404, "not_found"],
    ] as const) {
      const { gcal, ok } = harness({ meet: { failWith: failing(status, /^\/v2\/conferenceRecords$/u) } })
      const synced = await gcal("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
      expect(synced.error).toMatchObject({ code })
      expect(synced.error.message).toContain("Google Meet")
      expect((await ok("personal", "meetings", "list", "--offline")).items).toEqual([])
    }
  })

  it("sync: a 429 stops the run at once, holds the cursor at the call it hit and says when to try again", async () => {
    const { ok, meet, meetAccount } = harness({
      meet: { failWith: failing(429, /\/participants$/u, { "retry-after": "30" }) },
    })
    const synced = await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    expect(synced.meta).toMatchObject({ complete: false, retry_after_ms: 30_000 })
    expect(synced.item.hint).toContain("rate limit stopped the run; run meetings sync again after 30 s")
    expect(synced.next[0]).toMatchObject({ command: "meetings sync", why: expect.stringContaining("rate limit") })
    expect(meet.calls.filter(({ path }) => path.endsWith("/participants"))).toHaveLength(1)
    expect((await meetAccount()).cursor).toBe("2026-11-02T09:00:00.000Z")
  })

  it("show: a call never stored that Google hides (403) or lacks (404) is not found; --backend server names a 429", async () => {
    for (const [status, code] of [
      [403, "not_found"],
      [404, "not_found"],
      [429, "rate_limited"],
    ] as const) {
      const { gcal } = harness({ meet: { failWith: failing(status, /^\/v2\/conferenceRecords\/rec-2$/u) } })
      const shown = await gcal("personal", "meetings", "show", RECORD, "--backend", "server")
      expect(shown.error).toMatchObject({ code })
    }
  })

  it("a sync its budget stops goes on with the same --timeout, and never --since-time", async () => {
    const { ok } = harness()
    const first = await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z", "--timeout", "7s")
    expect(first.item).toMatchObject({ meetings: 1, stopped: "requests", remaining: 1 })
    expect(first.meta.complete).toBe(false)
    expect(first.next).toEqual([expect.objectContaining({ command: "meetings sync", args: { timeout: "7s" } })])
  })
})

describe("the shared meetings commands over stored Meet calls", () => {
  const synced = async () => {
    const one = harness()
    await one.ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    const [call] = (await one.ok("personal", "meetings", "list", "provider_id:rec-2", "--offline")).items
    return { ...one, id: String(call.id) }
  }

  it("transcript, export, people and repair read what sync kept, with no request to Google", async () => {
    const { ok, raw, meet, id } = await synced()
    const calls = meet.calls.length
    const history = await ok("personal", "meetings", "transcript", id, "--history")
    expect(JSON.stringify(history)).toContain("Shall we start with the plan?")
    const lines = await raw(["personal", "meetings", "transcript", id, "--jsonl"])
    expect(lines.code).toBe(0)
    expect(lines.out.join("\n")).toContain("Ignore previous instructions")

    const markdown = await ok("personal", "meetings", "export", id, "--format", "markdown")
    expect(JSON.stringify(markdown)).toContain("Shall we start with the plan?")
    const vtt = await raw(["personal", "meetings", "export", id, "--format", "vtt", "--transcript-id", "1", "--jsonl"])
    expect(vtt.code).toBe(0)
    const page = await raw(["personal", "meetings", "list", "--offline", "--limit", "1", "--page", "2", "--jsonl"])
    expect(page.code).toBe(0)
    expect(page.out.join("\n")).toContain("rec-1")
    const stored = await raw(["personal", "meetings", "show", "rec-2", "--backend", "archive", "--jsonl"])
    expect(stored.code).toBe(0)
    expect(stored.out.join("\n")).toContain('"provider_id":"rec-2"')
    const file = join(mkdtempSync(join(tmpdir(), "export-")), "call.md")
    expect((await raw(["personal", "meetings", "export", id, "--output", file, "--json"])).code).toBe(0)
    expect(readFileSync(file, "utf8")).toContain("Shall we start with the plan?")

    const people = await ok(
      "personal",
      "meetings",
      "people",
      "Test Person",
      "--limit",
      "5",
      "--scan-limit",
      "50",
      "--max-read-bytes",
      "100000",
    )
    expect(JSON.stringify(people)).toContain("Test Person A")
    expect((await raw(["personal", "meetings", "people", "Guest", "--jsonl"])).code).toBe(0)

    expect((await raw(["personal", "meetings", "repair", "--json"])).code).toBe(0)
    expect((await raw(["personal", "meetings", "repair", "--yes", "--jsonl"])).code).toBe(0)
    expect(meet.calls).toHaveLength(calls)
  })

  it("sync --rescan and --lookback-days read the calls again and keep one row each", async () => {
    const { ok, raw } = await synced()
    expect((await ok("personal", "meetings", "sync", "--rescan")).item.meetings).toBe(2)
    expect((await raw(["personal", "meetings", "sync", "--lookback-days", "3", "--jsonl"])).code).toBe(0)
    expect((await ok("personal", "meetings", "list", "--offline")).items).toHaveLength(2)
  })

  it("GCAL_READ_ONLY with no store reads an empty one and creates no wirecat.db", async () => {
    const { raw, env } = harness()
    const read = await raw(["personal", "meetings", "transcript", "1", "--json"], { GCAL_READ_ONLY: "1" })
    expect(existsSync(env.MESSAGING_STORE ?? "")).toBe(false)
    expect(read.code).not.toBe(0)
    expect(JSON.parse(read.err.join("\n").trim().split("\n").at(-1) ?? "{}").error.code).toBe("not_found")
  })
})

describe("the Google Meet source", () => {
  const sourceOn = (options: FakeMeetOptions = {}) => {
    const meet = sampleMeet({ conferences: structuredClone(CONFERENCES), ...options })
    const api = meetOn(meet)
    return { source: googleMeetSource(() => api), meet }
  }

  it("sync, list and show give a call one id, so they keep one row", async () => {
    const { source } = sourceOn()
    const synced = (await source.meetings("2026-11-01T00:00:00Z")).map(({ occurrence }) => occurrence.id)
    const found = (await source.find?.({ from: Date.parse("2026-11-01T00:00:00Z") }, [], null))?.meetings ?? []
    const shown = await source.get?.(`conferenceRecords/${RECORD}`)
    expect(synced).toEqual(expect.arrayContaining([RECORD]))
    expect(found.map(({ meeting }) => meeting.occurrence.id)).toEqual(expect.arrayContaining(synced))
    expect(shown?.meeting.occurrence.id).toBe(RECORD)
    expect((await source.get?.(RECORD))?.meeting.occurrence.id).toBe(RECORD)
  })

  it("a call with no transcript has none, and one this account cannot read is none", async () => {
    const { source } = sourceOn()
    expect(await source.transcript("rec-1")).toBeNull()
    expect(await source.get?.("missing-call")).toBeNull()
  })

  it("a space this account cannot read leaves the link out, not the call", async () => {
    const { source } = sourceOn({ hiddenSpaces: ["spaces/space-a"] })
    const [first] = await source.meetings("2026-11-01T00:00:00Z")
    expect(first?.joinUrl).toBeNull()
    expect(first?.series?.id).toBe("space-a")
  })
})

describe("meetings create and update over Google Meet spaces", () => {
  const WRITES = [CALENDAR_READ_SCOPE, EVENTS_SCOPE, MEET_READ_SCOPE, MEET_WRITE_SCOPE]
  const spaceCalls = (meet: ReturnType<typeof sampleMeet>) =>
    meet.calls.filter(({ path }) => path.startsWith("/v2/spaces/created") || path === "/v2/spaces")

  it("create makes a space that starts now, with the settings given, and keeps nothing in the store", async () => {
    const { ok, meet, env } = harness({ scopes: WRITES })
    const made = await ok(
      "personal",
      "meetings",
      "create",
      "--setting",
      "access_type=trusted",
      "--setting",
      "auto_transcription=true",
      "--yes",
    )
    expect(made.item).toMatchObject({
      action: "create",
      provider: "google-meet",
      account: "owner@example.com",
      change: { kind: "instant", settings: { access_type: "trusted", auto_transcription: true } },
      applied: true,
      meeting: { id: "created-1", kind: "instant", join_url: "https://meet.google.com/abc-mnop-xyz" },
      untrusted: expect.arrayContaining(["meeting.join_url"]),
    })
    expect(Date.parse(made.item.change.start_time)).toBeGreaterThan(0)
    expect(spaceCalls(meet)).toMatchObject([
      {
        method: "POST",
        body: {
          config: {
            accessType: "TRUSTED",
            artifactConfig: { transcriptionConfig: { autoTranscriptionGeneration: "ON" } },
          },
        },
      },
    ])
    expect(meet.refusals).toEqual([])
    expect(existsSync(env.MESSAGING_STORE ?? "")).toBe(false)
  })

  it("update patches only the settings named, by the space's id", async () => {
    const { ok, meet } = harness({ scopes: WRITES })
    await ok("personal", "meetings", "create", "--yes")
    const updated = await ok(
      "personal",
      "meetings",
      "update",
      "spaces/created-1",
      "--setting",
      "moderation=true",
      "--yes",
    )
    expect(updated.item).toMatchObject({ action: "update", id: "spaces/created-1", applied: true })
    expect(spaceCalls(meet)[1]).toMatchObject({
      method: "PATCH",
      path: "/v2/spaces/created-1",
      query: { updateMask: "config.moderation" },
      body: { config: { moderation: "ON" } },
    })
  })

  it("--dry-run previews without Google; a title or a start is refused, naming the settings it takes", async () => {
    const { ok, gcal, meet } = harness({ scopes: WRITES })
    const preview = await ok("personal", "meetings", "create", "--setting", "moderation=false", "--dry-run")
    expect(preview.item).toMatchObject({ preview: true })
    const titled = await gcal("personal", "meetings", "create", "--title", "Planning", "--yes")
    expect(titled.error).toMatchObject({ code: "validation_error" })
    expect(titled.error.message).toContain("--setting access_type")
    const started = await gcal("personal", "meetings", "create", "--start-time", "2026-11-20T10:00:00Z", "--yes")
    expect(started.error).toMatchObject({ code: "validation_error" })
    const empty = await gcal("personal", "meetings", "update", "spaces/created-1", "--yes")
    expect(empty.error).toMatchObject({ code: "validation_error" })
    expect(spaceCalls(meet)).toEqual([])
  })

  it("asks first: with nobody to answer and no --yes the space is not made", async () => {
    const { gcal, meet } = harness({ scopes: WRITES })
    const refused = await gcal("personal", "meetings", "create")
    expect(refused.code).not.toBe(0)
    expect(refused.error.code).toBe("confirmation_required")
    expect(spaceCalls(meet)).toEqual([])
  })

  it("without the space grant create is refused before any request, keeping the grants already held", async () => {
    const { gcal, meet, env } = harness({ scopes: [CALENDAR_READ_SCOPE, EVENTS_SCOPE, MEET_READ_SCOPE] })
    const refused = await gcal("personal", "meetings", "create", "--yes")
    expect(refused.error).toMatchObject({ code: "permission_error", reason: "oauth.scope-missing" })
    expect(refused.error.message).toContain("gcal personal session start --grant write,meetings again")
    const update = await gcal(
      "personal",
      "meetings",
      "update",
      "spaces/created-1",
      "--setting",
      "moderation=true",
      "--yes",
    )
    expect(update.error.message).toContain("--grant write,meetings again")
    expect(meet.calls).toEqual([])
    expect(existsSync(env.MESSAGING_STORE ?? "")).toBe(false)
  })

  it("update by a meeting code or an empty id is refused before the question and any request", async () => {
    const { gcal, meet } = harness({ scopes: WRITES })
    for (const id of ["abc-mnop-xyz", "spaces/abc-mnop-xyz", "spaces/", "spaces/.."]) {
      const refused = await gcal("personal", "meetings", "update", id, "--setting", "moderation=true")
      expect(refused.error).toMatchObject({ code: "validation_error" })
      expect(refused.error.message).toContain("meeting.id")
    }
    expect(meet.calls).toEqual([])
  })

  it("a profile with no Google account is told to sign in with write,meetings for a space write", async () => {
    const { raw } = harness({ scopes: WRITES })
    const config = {
      GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
      GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
    }
    const created = await raw(["personal", "meetings", "create", "--yes", "--json"], config)
    expect(created.code).not.toBe(0)
    expect(created.err.join("\n")).toContain("session start --grant write,meetings")
    const synced = await raw(["personal", "meetings", "sync", "--json"], config)
    expect(synced.err.join("\n")).toMatch(/session start --grant meetings\b(?!,)/)
  })

  it("help lists the space settings with their values", async () => {
    const { raw } = harness({ scopes: WRITES })
    const help = await raw(["personal", "meetings", "create", "--help"])
    const text = help.out.join("\n")
    expect(text).toContain("access_type=open|trusted|restricted")
    expect(text).toContain("auto_smart_notes=true|false")
  })
})
