import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Client } from "@modelcontextprotocol/client"
import { memoryKeyring } from "@wirecat/cli-base"
import { rememberAccount } from "@wirecat/cli-core/cli"
import { afterEach, describe, expect, it } from "vitest"
import { CALENDAR_READ_SCOPE, sessionStorage } from "./google.js"
import { EVENTS_SCOPE } from "./grants.js"
import { IDENTITY } from "./identity.js"
import { run } from "./program.js"
import { fakeGoogleCalendar, SERIES } from "./testing/google-calendar.js"
import { fakeGoogleWrites, INVITATION } from "./testing/google-writes.js"
import { mcpClient } from "./testing/mcp.js"

const clients: Client[] = []
afterEach(async () => {
  for (const client of clients.splice(0)) await client.close()
})

const TEAM = "team@group.calendar.example.com"

const harness = (
  scopes: string[] = [CALENDAR_READ_SCOPE, EVENTS_SCOPE],
  held: Record<string, unknown>[] = [INVITATION],
  read = fakeGoogleCalendar([INVITATION]).fetch,
) => {
  const keyring = memoryKeyring()
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
    GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
    MESSAGING_STORE: join(mkdtempSync(join(tmpdir(), "store-")), "wirecat.db"),
  }
  sessionStorage(env, "personal", keyring).write({
    tokens: {
      accessToken: "fixture-access",
      refreshToken: "fixture-refresh",
      expiresAt: Date.now() + 3_600_000,
      scopes,
    },
    client: { clientId: "fixture-client.apps" },
  })
  rememberAccount(IDENTITY, "personal", "owner@example.com", env)
  const google = fakeGoogleWrites(held, read)
  const fetch = google.fetch as typeof globalThis.fetch
  const gcal = async (...argv: string[]) => {
    const out: string[] = []
    const err: string[] = []
    const code = await run(argv.includes("--jsonl") ? argv : [...argv, "--json"], {
      streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
      tty: false,
      env,
      keyring,
      fetch,
    })
    const last = err.join("\n").trim().split("\n").at(-1)
    const answer = code === 0 ? JSON.parse(out.join("\n").trim().split("\n")[0] ?? "") : undefined
    return {
      code,
      item: argv.includes("--jsonl") ? answer?.data : answer?.item,
      items: answer?.items,
      error: code ? JSON.parse(last ?? "{}").error : undefined,
    }
  }
  /** Runs at a terminal that answers yes, and keeps each question asked. */
  const atTerminal = async (...argv: string[]) => {
    const asked: string[] = []
    const code = await run(argv, {
      streams: { data: () => undefined, diagnostic: () => undefined },
      tty: false,
      env,
      keyring,
      fetch,
      answer: async (question: string) => {
        asked.push(question)
        return "y"
      },
    })
    return { code, asked }
  }
  return { gcal, google, env, keyring, fetch, atTerminal }
}

const eventRef = async (gcal: ReturnType<typeof harness>["gcal"]) => {
  await gcal("personal", "sync")
  const { items } = await gcal("personal", "events", "list", "from:2026-11-05", "to:2026-11-06")
  return `event:${items.find(({ title }: { title: string }) => title === "Example review").id}`
}

const create = ["personal", "events", "create", "owner@example.com", "--title", "Example planning"]
const at = ["--start-time", "2026-11-02T10:00+01:00", "--end-time", "2026-11-02T11:00+01:00"]
const posts = (google: ReturnType<typeof fakeGoogleWrites>) => google.requests.filter(({ method }) => method !== "GET")

describe("event writes over Google", () => {
  it("create goes ahead without a question, inserts with a client id, and stores the event", async () => {
    const { gcal, google } = harness()
    await gcal("personal", "sync")
    const made = await gcal(...create, ...at)
    expect(made.code).toBe(0)
    const [insert] = posts(google)
    expect(insert).toMatchObject({ method: "POST", body: { id: made.item.operation_id, summary: "Example planning" } })
    expect(insert?.query.get("sendUpdates")).toBe("none")
    expect(made.item.entry).toMatchObject({
      external_id: made.item.operation_id,
      starts_at: "2026-11-02T09:00:00.000Z",
    })
  })

  it("a delete still asks; an api key the owner set to ask makes the shared write ask too", async () => {
    const { gcal, google, atTerminal } = harness()
    const event = await eventRef(gcal)
    const unasked = await gcal("personal", "events", "delete", event, "--no-notify")
    expect(unasked.error).toMatchObject({ code: "confirmation_required" })
    expect(posts(google)).toEqual([])
    const plain = await atTerminal(...create, ...at)
    expect(plain.code).toBe(0)
    expect(plain.asked).toEqual([])
    expect((await gcal("personal", "config", "set", "permissions.api.calendar.events.insert", "ask")).code).toBe(0)
    expect((await gcal("personal", "config", "set", "permissions.events.notify", "ask")).code).toBe(0)
    const mailing = await atTerminal(...create, ...at, "--attendee", "ana@example.com", "--notify")
    expect(mailing.code).toBe(0)
    expect(mailing.asked).toHaveLength(1)
    expect(mailing.asked[0]).toContain("api.calendar.events.insert")
    expect(mailing.asked[0]).toContain("events.notify")
    expect(posts(google)).toHaveLength(2)
  })

  it("events move takes the event, with its id, to another calendar of the account", async () => {
    const writable = async (input: string | URL | Request, init?: RequestInit) => {
      const answer = await fakeGoogleCalendar([INVITATION]).fetch(input, init)
      if (!String(input).includes("calendarList")) return answer
      const list = (await answer.json()) as { items: { id: string; accessRole: string }[] }
      for (const one of list.items) if (one.id === TEAM) one.accessRole = "writer"
      return new Response(JSON.stringify(list), { headers: { "content-type": "application/json" } })
    }
    const { gcal, google } = harness(undefined, [INVITATION, SERIES], writable)
    const event = await eventRef(gcal)
    const mailed = await gcal("personal", "events", "move", event, "--to-calendar", TEAM, "--notify")
    expect(mailed.error).toMatchObject({ code: "permission_error", details: { permission: "events.notify" } })
    const moved = await gcal(
      ...["personal", "events", "move", event, "--to-calendar", TEAM, "--calendar", "owner@example.com"],
      ...["--no-notify", "--jsonl"],
    )
    expect(moved.error).toBeUndefined()
    expect(posts(google).at(-1)).toMatchObject({
      method: "POST",
      path: "calendars/owner@example.com/events/review1/move",
    })
    expect(posts(google).at(-1)?.query.get("destination")).toBe(TEAM)
    expect(moved.item).toMatchObject({ from_calendar: "1", calendar: "2", entry: { external_id: "review1" } })
  })

  it("an occurrence moves to another calendar only with --series, the whole repeating event", async () => {
    const writable = async (input: string | URL | Request, init?: RequestInit) => {
      const answer = await fakeGoogleCalendar([INVITATION]).fetch(input, init)
      if (!String(input).includes("calendarList")) return answer
      const list = (await answer.json()) as { items: { id: string; accessRole: string }[] }
      for (const one of list.items) if (one.id === TEAM) one.accessRole = "writer"
      return new Response(JSON.stringify(list), { headers: { "content-type": "application/json" } })
    }
    const { gcal, google } = harness(undefined, [INVITATION, SERIES], writable)
    await gcal("personal", "sync")
    const { items } = await gcal("personal", "events", "list", "from:2026-11-02", "to:2026-11-03")
    const slot = `event:${items.find(({ title }: { title: string }) => title === "Weekly planning").id}`
    const alone = await gcal("personal", "events", "move", slot, "--to-calendar", TEAM, "--no-notify")
    expect(alone.error).toMatchObject({ code: "validation_error" })
    const whole = await gcal("personal", "events", "move", slot, "--to-calendar", TEAM, "--series", "--no-notify")
    expect(whole.error).toBeUndefined()
    expect(posts(google).at(-1)).toMatchObject({ path: "calendars/owner@example.com/events/weekly1/move" })
  })

  it("update --following whose answer was lost names the new series, and --id finds it instead of a second", async () => {
    const { gcal, google } = harness(undefined, [INVITATION, SERIES])
    await gcal("personal", "sync")
    const { items } = await gcal("personal", "events", "list", "from:2026-11-16", "to:2026-11-17")
    const slot = `event:${items.find(({ title }: { title: string }) => title === "Weekly planning").id}`
    const update = ["personal", "events", "update", slot, "--following", "--title", "Weekly sync", "--no-notify"]
    google.loseNextAnswer()
    const lost = await gcal(...update)
    expect(lost.error).toMatchObject({ code: "outcome_unknown" })
    const id = String(lost.error.details.operation_id)
    const again = await gcal(...update, "--id", id)
    expect(again.error).toBeUndefined()
    const inserts = posts(google).filter(({ method, body }) => method === "POST" && body?.summary === "Weekly sync")
    expect(inserts.map(({ body }) => body?.id)).toEqual([id, id])
    expect(google.event(id)?.summary).toBe("Weekly sync")
  })

  it("update --following ends the series before the occurrence and starts a new one there", async () => {
    const { gcal, google } = harness(undefined, [INVITATION, SERIES])
    await gcal("personal", "sync")
    const { items } = await gcal("personal", "events", "list", "from:2026-11-16", "to:2026-11-17")
    const slot = items.find(({ title }: { title: string }) => title === "Weekly planning")
    const changed = await gcal(
      ...["personal", "events", "update", `event:${slot.id}`, "--following", "--title", "Weekly sync"],
      "--no-notify",
    )
    expect(changed.error).toBeUndefined()
    const [insert, end] = posts(google).slice(-2)
    expect(insert).toMatchObject({ method: "POST", body: { summary: "Weekly sync" } })
    expect(insert?.body?.recurrence).toEqual(expect.arrayContaining([expect.stringMatching(/^RRULE:FREQ=WEEKLY/u)]))
    expect(end).toMatchObject({ method: "PATCH", path: "calendars/owner@example.com/events/weekly1" })
    expect(JSON.stringify(end?.body?.recurrence)).toContain("UNTIL=")
  })

  it("delete --following only ends the series, and asks first", async () => {
    const { gcal, google } = harness(undefined, [INVITATION, SERIES])
    await gcal("personal", "sync")
    const { items } = await gcal("personal", "events", "list", "from:2026-11-16", "to:2026-11-17")
    const slot = items.find(({ title }: { title: string }) => title === "Weekly planning")
    const remove = ["personal", "events", "delete", `event:${slot.id}`, "--following", "--no-notify"]
    expect((await gcal(...remove)).error).toMatchObject({ code: "confirmation_required" })
    const ended = await gcal(...remove, "--yes")
    expect(ended.error).toBeUndefined()
    expect(posts(google).at(-1)).toMatchObject({ method: "PATCH", path: "calendars/owner@example.com/events/weekly1" })
    expect(JSON.stringify(posts(google).at(-1)?.body?.recurrence)).toContain("UNTIL=")
    expect(google.event("weekly1")?.status).toBe("confirmed")
  })

  it("a series update whose new rule ends it sooner needs events.delete.series", async () => {
    const { gcal, google } = harness(undefined, [INVITATION, SERIES])
    await gcal("personal", "sync")
    const { items } = await gcal("personal", "events", "list", "from:2026-11-02", "to:2026-11-03")
    const slot = items.find(({ title }: { title: string }) => title === "Weekly planning")
    const shorter = await gcal(
      ...["personal", "events", "update", `event:${slot.id}`, "--series", "--repeat", "FREQ=WEEKLY;BYDAY=MO;COUNT=2"],
      "--no-notify",
    )
    expect(shorter.error).toMatchObject({ code: "permission_error", details: { permission: "events.delete.series" } })
    expect(posts(google)).toEqual([])
  })

  it("denying api stops the shared writes before Google is asked", async () => {
    const { gcal, google } = harness()
    await gcal("personal", "sync")
    expect((await gcal("personal", "config", "set", "permissions.api", "deny")).code).toBe(0)
    const refused = await gcal(...create, ...at, "--yes")
    expect(refused.error).toMatchObject({
      code: "permission_error",
      details: { permission: "api.calendar.events.insert" },
    })
    expect(posts(google)).toEqual([])
  })

  it("mailing attendees is refused by default; --no-notify sends with sendUpdates=none", async () => {
    const { gcal, google } = harness()
    await gcal("personal", "sync")
    const mailed = await gcal(...create, ...at, "--attendee", "ana@example.com", "--notify", "--yes")
    expect(mailed.error).toMatchObject({ code: "permission_error", details: { permission: "events.notify" } })
    expect(posts(google)).toEqual([])
    const quiet = await gcal(...create, ...at, "--attendee", "ana@example.com", "--no-notify", "--yes")
    expect(quiet.code).toBe(0)
    expect(posts(google)[0]?.query.get("sendUpdates")).toBe("none")
  })

  it("respond, update and delete carry the synced etag as If-Match", async () => {
    const { gcal, google } = harness()
    const event = await eventRef(gcal)
    const answered = await gcal("personal", "events", "respond", event, "accepted", "--no-notify", "--yes")
    expect(answered.code).toBe(0)
    expect(posts(google).at(-1)).toMatchObject({ method: "PATCH", ifMatch: INVITATION.etag })
    const answeredEtag = google.event("review1")?.etag
    const moved = await gcal("personal", "events", "update", event, "--title", "Moved", "--no-notify", "--yes")
    expect(moved.error).toBeUndefined()
    expect(posts(google).at(-1)?.ifMatch).toBe(answeredEtag)
    const deleted = await gcal("personal", "events", "delete", event, "--no-notify", "--yes")
    expect(deleted.code).toBe(0)
    expect(posts(google).at(-1)).toMatchObject({ method: "DELETE" })
    expect(google.event("review1")?.status).toBe("cancelled")
  })

  it("delete of an event someone already deleted at Google succeeds and removes the stored copy", async () => {
    const { gcal, google } = harness()
    const event = await eventRef(gcal)
    const held = google.event("review1")
    if (held) held.status = "cancelled"
    const deleted = await gcal("personal", "events", "delete", event, "--no-notify", "--yes")
    expect(deleted.error).toBeUndefined()
    expect(deleted.item).toMatchObject({ removed: 1 })
  })

  it("a timed event becomes all-day and back, each a full update with If-Match", async () => {
    const { gcal, google } = harness()
    const event = await eventRef(gcal)
    const update = ["personal", "events", "update", event, "--no-notify", "--yes"]
    const allDay = await gcal(...update, "--start-date", "2026-11-06", "--end-date", "2026-11-06")
    expect(allDay.error).toBeUndefined()
    expect(posts(google).at(-1)).toMatchObject({ method: "PUT", ifMatch: INVITATION.etag })
    expect(google.event("review1")?.start).toEqual({ date: "2026-11-06" })
    const timed = await gcal(...update, ...at)
    expect(timed.error).toBeUndefined()
    expect(posts(google).at(-1)).toMatchObject({ method: "PUT" })
    expect(google.event("review1")?.start).toMatchObject({ dateTime: "2026-11-02T09:00:00.000Z" })
  })

  it("the switch checks api.calendar.events.update, so denying it in the API stops it", async () => {
    const { gcal, google } = harness()
    const event = await eventRef(gcal)
    const switched = ["personal", "events", "update", event, "--start-date", "2026-11-06", "--end-date", "2026-11-06"]
    expect((await gcal("personal", "config", "set", "permissions.api.calendar.events.update", "deny")).code).toBe(0)
    const denied = await gcal(...switched, "--no-notify", "--yes")
    expect(denied.error).toMatchObject({ code: "permission_error" })
    expect(posts(google)).toEqual([])
  })

  it("update --series --repeat patches the series' rule and keeps its EXDATE", async () => {
    const { gcal, google } = harness(undefined, [INVITATION, SERIES])
    await gcal("personal", "sync")
    const { items } = await gcal("personal", "events", "list", "from:2026-11-02", "to:2026-11-03")
    const slot = items.find(({ title }: { title: string }) => title === "Weekly planning")
    const changed = await gcal(
      ...["personal", "events", "update", `event:${slot.id}`, "--series", "--repeat", "FREQ=WEEKLY;BYDAY=MO,TH"],
      ...["--no-notify", "--yes"],
    )
    expect(changed.error).toBeUndefined()
    expect(posts(google).at(-1)).toMatchObject({
      method: "PATCH",
      path: "calendars/owner@example.com/events/weekly1",
      ifMatch: SERIES.etag,
      body: { recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO,TH", "EXDATE;TZID=Europe/Madrid:20261109T100000"] },
    })
  })

  it("--repeat inserts a repeating event with its rule and zone, and says to sync", async () => {
    const { gcal, google } = harness()
    await gcal("personal", "sync")
    const made = await gcal(...create, ...at, "--repeat", "FREQ=WEEKLY;BYDAY=MO;COUNT=4", "--yes")
    expect(made.error).toBeUndefined()
    expect(posts(google).at(-1)?.body).toMatchObject({
      recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4"],
      start: { timeZone: expect.any(String) },
    })
    expect(made.item.hint).toBe("sync to store its occurrences")
  })

  it("an event changed at Google since the sync is a conflict", async () => {
    const { gcal, google } = harness()
    const event = await eventRef(gcal)
    google.changeBehind("review1")
    const stale = await gcal("personal", "events", "update", event, "--title", "Moved", "--no-notify", "--yes")
    expect(stale.error).toMatchObject({ code: "validation_error", reason: "event.conflict" })
  })

  it("a profile signed in read-only is told to sign in with --grant write", async () => {
    const { gcal, google } = harness([CALENDAR_READ_SCOPE])
    await gcal("personal", "sync")
    const refused = await gcal(...create, ...at, "--yes")
    expect(refused.error).toMatchObject({ code: "permission_error", reason: "api.scope-missing" })
    expect(refused.error.message).toContain("session start --grant write")
    expect(posts(google)).toEqual([])
  })

  it("an agent writes through gcal_write as the command line does; mailing attendees stays refused", async () => {
    const { gcal, google, env, keyring, fetch } = harness()
    await gcal("personal", "sync")
    const { client } = await mcpClient({ env, keyring, fetch })
    clients.push(client)
    const fields = {
      calendar: "owner@example.com",
      title: "Example planning",
      start_time: "2026-11-02T10:00+01:00",
      end_time: "2026-11-02T11:00+01:00",
    }
    const made = (await client.callTool({
      name: "gcal_write",
      arguments: { command: "events create", arguments: fields },
    })) as { isError?: boolean; structuredContent: { item: { entry: Record<string, unknown> } } }
    expect(made.isError).toBeFalsy()
    expect(made.structuredContent.item.entry).toMatchObject({
      title: "Example planning",
      starts_at: "2026-11-02T09:00:00.000Z",
    })
    const attendee = ["ana@example.com", "bob@example.com"]
    const mailed = (await client.callTool({
      name: "gcal_write",
      arguments: { command: "events create", arguments: { ...fields, attendee, notify: true } },
    })) as { isError?: boolean; content: { text: string }[] }
    expect(mailed.isError).toBe(true)
    expect(mailed.content[0]?.text).toContain("permission_error")
    expect(mailed.content[0]?.text).toContain("events.notify")
    expect(posts(google)).toHaveLength(1)
    const quiet = (await client.callTool({
      name: "gcal_write",
      arguments: { command: "events create", arguments: { ...fields, location: "Room 2", attendee, notify: false } },
    })) as { isError?: boolean; structuredContent: { item: { event: string } } }
    expect(quiet.isError).toBeFalsy()
    expect(posts(google).at(-1)?.body).toMatchObject({
      attendees: [{ email: "ana@example.com" }, { email: "bob@example.com" }],
    })
    expect(posts(google).at(-1)?.query.get("sendUpdates")).toBe("none")
    const cleared = (await client.callTool({
      name: "gcal_write",
      arguments: {
        command: "events update",
        arguments: { event: quiet.structuredContent.item.event, location: "", notify: false },
      },
    })) as { isError?: boolean }
    expect(cleared.isError).toBeFalsy()
    expect(posts(google).at(-1)?.body).toEqual({ location: "" })
    const both = (await client.callTool({
      name: "gcal_write",
      arguments: { command: "events create", arguments: { ...fields, no_notify: true } },
    })) as { isError?: boolean; content: { text: string }[] }
    expect(both.isError).toBe(true)
    expect(both.content[0]?.text).toContain("no_notify")
  })

  it("every field and choice of the write commands reaches Google in its own words", async () => {
    const { gcal, google } = harness()
    const event = await eventRef(gcal)
    expect((await gcal("personal", "config", "set", "permissions.events.notify", "allow")).code).toBe(0)
    const id = "0123456789abcdef0123456789abcdef"
    const allDay = await gcal(
      ...["personal", "events", "create", "owner@example.com", "--title", "Example offsite"],
      ...["--start-date", "2026-11-03", "--end-date", "2026-11-03", "--location", "Room 2"],
      ...["--description", "Agenda", "--id", id, "--yes", "--jsonl"],
    )
    expect(allDay.error).toBeUndefined()
    expect(posts(google).at(-1)?.body).toEqual({
      id,
      summary: "Example offsite",
      start: { date: "2026-11-03" },
      end: { date: "2026-11-04" },
      location: "Room 2",
      description: "Agenda",
    })
    const respond = ["personal", "events", "respond", event, "declined", "--calendar", "owner@example.com"]
    expect((await gcal(...respond, "--notify", "--yes", "--jsonl")).code).toBe(0)
    expect(posts(google).at(-1)?.query.get("sendUpdates")).toBe("all")
    const moved = await gcal(
      ...["personal", "events", "update", allDay.item.event, "--start-date", "2026-11-06", "--end-date", "2026-11-06"],
      ...["--location", "", "--description", "", "--attendee", "bob@example.com", "--calendar", "owner@example.com"],
      ...["--notify", "--yes", "--jsonl"],
    )
    expect(moved.error).toBeUndefined()
    const patch = posts(google).at(-1)
    expect(patch?.body).toEqual({
      start: { date: "2026-11-06" },
      end: { date: "2026-11-07" },
      location: "",
      description: "",
      attendees: [{ email: "bob@example.com" }],
    })
    expect(patch?.query.get("sendUpdates")).toBe("all")
    const timed = await gcal(
      ...[
        "personal",
        "events",
        "update",
        event,
        "--start-time",
        "2026-11-06T09:00+01:00",
        "--end-time",
        "2026-11-06T10:00+01:00",
      ],
      ...["--no-notify", "--yes"],
    )
    expect(timed.code).toBe(0)
    expect(posts(google).at(-1)?.body).toMatchObject({ start: { dateTime: "2026-11-06T08:00:00.000Z" } })
    for (const write of [["delete"], ["update", "--title", "Moved"]]) {
      const series = await gcal(
        "personal",
        "events",
        ...write.slice(0, 1),
        event,
        ...write.slice(1),
        "--series",
        "--no-notify",
        "--yes",
      )
      expect(series.error).toMatchObject({
        code: "validation_error",
        message: expect.stringContaining("does not repeat"),
      })
    }
    const deleted = await gcal(
      ...["personal", "events", "delete", event, "--calendar", "owner@example.com", "--notify", "--yes", "--jsonl"],
    )
    expect(deleted.code).toBe(0)
    expect(posts(google).at(-1)).toMatchObject({ method: "DELETE" })
    expect(posts(google).at(-1)?.query.get("sendUpdates")).toBe("all")
  })
})
