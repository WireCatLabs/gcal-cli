import { existsSync, mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring } from "@wirecat/cli-base"
import { rememberAccount } from "@wirecat/cli-core/cli"
import { describe, expect, it } from "vitest"
import { CALENDAR_READ_SCOPE, sessionStorage } from "./google.js"
import { MEET_READ_SCOPE } from "./grants.js"
import { IDENTITY } from "./identity.js"
import { meetApi } from "./meet/api.js"
import { googleMeetSource } from "./meet/source.js"
import { run } from "./program.js"
import { MEET_PROVIDER, openGcalStore } from "./store.js"
import { type FakeMeetOptions, MEET_ACCESS } from "./testing/fake-meet.js"
import { fakeGoogleCalendar } from "./testing/google-calendar.js"
import { CONFERENCES, RECORD, sampleMeet } from "./testing/meet-sample.js"

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
  return { gcal, ok, raw, env, meet, meetAccount }
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
      url: "https://meet.google.com/abc-mnop-xyz",
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

  it("doctor warns when the last Google Meet sync is older than 25 days", async () => {
    const { ok, gcal, env, meetAccount } = harness()
    await ok("personal", "meetings", "sync", "--since-time", "2026-11-01T00:00:00Z")
    expect((await ok("doctor")).item.meet_sync).toMatchObject([{ profile: "personal", stale: false }])
    const store = await openGcalStore(env)
    try {
      const { id } = await meetAccount()
      await store.meetings.setCursor(id, new Date(Date.now() - 26 * 86_400_000).toISOString(), Date.now())
    } finally {
      await store.close()
    }
    const doctor = await gcal("doctor")
    expect(doctor.answer.item.meet_sync).toMatchObject([{ profile: "personal", days_ago: 26, stale: true }])
    expect(doctor.err).toContain("run gcal personal meetings sync")
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
    expect((await ok("personal", "meetings", "sync", "--rescan")).item.meetings).toBeGreaterThanOrEqual(0)
    expect((await raw(["personal", "meetings", "sync", "--lookback-days", "3", "--jsonl"])).code).toBe(0)
    expect((await ok("personal", "meetings", "list", "--offline")).items).toHaveLength(2)
  })

  it("GCAL_READ_ONLY with no store reads an empty one and creates no wirecat.db", async () => {
    const { raw, env } = harness()
    const read = await raw(["personal", "meetings", "transcript", "1", "--json"], { GCAL_READ_ONLY: "1" })
    expect(existsSync(env.MESSAGING_STORE ?? "")).toBe(false)
    expect(read.code).not.toBe(0)
  })
})

describe("the Google Meet source", () => {
  const sourceOn = (options: FakeMeetOptions = {}) => {
    const meet = sampleMeet({ conferences: structuredClone(CONFERENCES), ...options })
    const api = meetApi({ fetch: meet.fetch, accessToken: async () => MEET_ACCESS })
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
