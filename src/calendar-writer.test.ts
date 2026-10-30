import { calendarWriterContract } from "@wirecat/cli-core/calendar/testing"
import { describe, expect, it } from "vitest"
import { entryOf } from "./calendar-source.js"
import { googleCalendarWriter } from "./calendar-writer.js"
import type { CalendarEvent } from "./generated/types.js"
import { CALENDAR_READ_SCOPE } from "./google.js"
import { googleApi } from "./google-api.js"
import { EVENTS_SCOPE } from "./grants.js"
import { fakeGoogleWrites, INVITATION } from "./testing/google-writes.js"

const CALENDAR = {
  id: 1,
  accountId: 1,
  externalId: "owner@example.com",
  title: "owner@example.com",
  timezone: "Europe/Madrid",
  accessRole: "owner" as const,
  primary: true,
  synced: true,
  seenAt: null,
  deletedAt: null,
}
const AT = Date.UTC(2026, 10, 2, 9)
const TIMED = { title: "Example standup", startsAt: AT, endsAt: AT + 900_000, timezone: "Europe/Madrid" }
const ETAG = INVITATION.etag

const adapter = (scopes: string[] = [CALENDAR_READ_SCOPE, EVENTS_SCOPE]) => {
  const google = fakeGoogleWrites()
  const api = googleApi({
    fetch: google.fetch as typeof fetch,
    scopes: () => scopes,
    accessToken: async () => "fixture-access-token",
  })
  return { google, writer: googleCalendarWriter(api) }
}

describe("calendarWriterContract over hand-written Google answers", () => {
  for (const { name, run } of calendarWriterContract(() => {
    const { google, writer } = adapter()
    return {
      writer,
      calendar: CALENDAR,
      existing: entryOf(INVITATION as CalendarEvent, CALENDAR),
      changeBehind: () => google.changeBehind("review1"),
      loseNextAnswer: google.loseNextAnswer,
      notified: google.notified,
      at: AT,
    }
  }))
    it(name, run)
})

describe("the Google calls behind each write", () => {
  it("create inserts with the client's id and sendUpdates, and reads Google's answer", async () => {
    const { google, writer } = adapter()
    const made = await writer.create(
      CALENDAR,
      {
        title: "Example planning",
        startDate: "2026-11-03",
        endDate: "2026-11-04",
        attendees: [{ email: "ana@example.com", optional: true }],
      },
      { id: "0123456789abcdefuv", notify: true },
    )
    expect(google.requests).toEqual([
      expect.objectContaining({
        method: "POST",
        path: "calendars/owner@example.com/events",
        body: {
          id: "0123456789abcdefuv",
          summary: "Example planning",
          start: { date: "2026-11-03" },
          end: { date: "2026-11-04" },
          attendees: [{ email: "ana@example.com", optional: true }],
        },
      }),
    ])
    expect(google.requests[0]?.query.get("sendUpdates")).toBe("all")
    expect(made).toMatchObject({ externalId: "0123456789abcdefuv", allDay: true, startDate: "2026-11-03" })
  })

  it("refuses an id Google would refuse, before calling it", async () => {
    const { google, writer } = adapter()
    await expect(
      writer.create(CALENDAR, { title: "x", startsAt: AT, endsAt: AT + 1 }, { id: "wxyz0", notify: false }),
    ).rejects.toMatchObject({ code: "validation_error", details: { sent: false } })
    expect(google.requests).toEqual([])
  })

  it("update patches with If-Match; an emptied field is sent as empty text", async () => {
    const { google, writer } = adapter()
    const changed = await writer.update(
      CALENDAR,
      "review1",
      { startsAt: AT, endsAt: AT + 3_600_000, timezone: "Europe/Madrid", location: null },
      { scope: "this", etag: ETAG, notify: false },
    )
    expect(google.requests.map(({ method }) => method)).toEqual(["GET", "PATCH"])
    expect(google.requests[1]).toMatchObject({
      method: "PATCH",
      path: "calendars/owner@example.com/events/review1",
      ifMatch: ETAG,
      body: {
        start: { dateTime: "2026-11-02T09:00:00.000Z", timeZone: "Europe/Madrid" },
        end: { dateTime: "2026-11-02T10:00:00.000Z", timeZone: "Europe/Madrid" },
        location: "",
      },
    })
    expect(google.requests[1]?.query.get("sendUpdates")).toBe("none")
    expect(changed).toMatchObject({ location: null, startsAt: AT })
  })

  it("a repeating event is inserted with its rule, and its all-day start and end carry the zone", async () => {
    const { google, writer } = adapter()
    const made = await writer.create(
      CALENDAR,
      {
        title: "Example retro",
        startDate: "2026-11-06",
        endDate: "2026-11-07",
        timezone: "Europe/Madrid",
        recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=FR;COUNT=4"],
      },
      { id: "retro01", notify: false },
    )
    expect(google.requests[0]?.body).toMatchObject({
      start: { date: "2026-11-06", timeZone: "Europe/Madrid" },
      end: { date: "2026-11-07", timeZone: "Europe/Madrid" },
      recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=FR;COUNT=4"],
    })
    expect(made).toMatchObject({ kind: "series", recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=FR;COUNT=4"] })
  })

  it("a series' new rule is patched in, replacing the old one", async () => {
    const { google, writer } = adapter()
    const made = await writer.create(
      CALENDAR,
      { ...TIMED, recurrence: ["RRULE:FREQ=DAILY;COUNT=5"] },
      { id: "rule0001", notify: false },
    )
    const changed = await writer.update(
      CALENDAR,
      "rule0001",
      { recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO"] },
      { scope: "series", etag: made.etag as string, notify: false },
    )
    expect(google.requests.at(-1)).toMatchObject({
      method: "PATCH",
      body: { recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO"] },
    })
    expect(changed.recurrence).toEqual(["RRULE:FREQ=WEEKLY;BYDAY=MO"])
  })

  it("switching to all-day replaces the fetched event, keeping its guests, Meet link and files", async () => {
    const { google, writer } = adapter()
    const changed = await writer.update(
      CALENDAR,
      "review1",
      { startDate: "2026-11-05", endDate: "2026-11-06", timezone: "Europe/Madrid" },
      { scope: "this", etag: ETAG, notify: false },
    )
    const put = google.requests.at(-1)
    expect(google.requests.map(({ method }) => method)).toEqual(["GET", "PUT"])
    expect(put).toMatchObject({ ifMatch: ETAG, body: { summary: "Example review", attendees: INVITATION.attendees } })
    expect(put?.body?.start).toEqual({ date: "2026-11-05" })
    expect(put?.query.get("conferenceDataVersion")).toBe("1")
    expect(put?.query.get("supportsAttachments")).toBe("true")
    expect(changed).toMatchObject({ allDay: true, startDate: "2026-11-05" })

    const back = await writer.update(
      CALENDAR,
      "review1",
      { startsAt: AT, endsAt: AT + 3_600_000, timezone: "Europe/Madrid" },
      { scope: "this", etag: changed.etag as string, notify: false },
    )
    expect(google.requests.at(-1)?.body?.start).toEqual({
      dateTime: "2026-11-02T09:00:00.000Z",
      timeZone: "Europe/Madrid",
    })
    expect(back).toMatchObject({ allDay: false, startsAt: AT, startDate: null })
  })

  it("a switch over an event that moved on since the sync is a conflict, and nothing is replaced", async () => {
    const { google, writer } = adapter()
    google.changeBehind("review1")
    const before = structuredClone(google.event("review1"))
    await expect(
      writer.update(
        CALENDAR,
        "review1",
        { startDate: "2026-11-05", endDate: "2026-11-06", timezone: "Europe/Madrid" },
        { scope: "this", etag: ETAG, notify: false },
      ),
    ).rejects.toMatchObject({ details: { reason: "event.conflict" } })
    expect(google.event("review1")).toEqual(before)
  })

  it("a switch sends back the conference details, Drive files and description exactly as Google holds them", async () => {
    const meeting = {
      ...INVITATION,
      id: "meeting1",
      description: "Agenda\nPasscode: 123456",
      conferenceData: {
        conferenceSolution: { key: { type: "addOn" }, name: "Example Meet" },
        entryPoints: [
          { entryPointType: "video", uri: "https://meet.example.com/j/123?pwd=abc", passcode: "123456" },
          { entryPointType: "phone", uri: "tel:+12345678900,,,123456789;1234", pin: "1234" },
        ],
      },
      attachments: [{ fileUrl: "https://drive.google.com/file/d/1abc/view", title: "Agenda.pdf" }],
    }
    const google = fakeGoogleWrites([meeting])
    const api = googleApi({
      fetch: google.fetch as typeof fetch,
      scopes: () => [CALENDAR_READ_SCOPE, EVENTS_SCOPE],
      accessToken: async () => "fixture-access-token",
    })
    await googleCalendarWriter(api).update(
      CALENDAR,
      "meeting1",
      { startDate: "2026-11-05", endDate: "2026-11-06", timezone: "Europe/Madrid" },
      { scope: "this", etag: ETAG, notify: false },
    )
    const { start, end, ...sent } = google.requests.at(-1)?.body ?? {}
    const { start: _start, end: _end, ...held } = meeting as Record<string, unknown>
    expect(sent).toEqual(held)
    expect([start, end]).toEqual([{ date: "2026-11-05" }, { date: "2026-11-06" }])
  })

  it("delete sends If-Match and returns nothing", async () => {
    const { google, writer } = adapter()
    await writer.remove(CALENDAR, "review1", { scope: "series", etag: ETAG, notify: true })
    expect(google.requests[0]).toMatchObject({ method: "DELETE", ifMatch: ETAG })
    expect(google.event("review1")?.status).toBe("cancelled")
  })

  it("delete of an event Google already deleted (410) or no longer shows (404) is done", async () => {
    const { google, writer } = adapter()
    await writer.remove(CALENDAR, "review1", { scope: "series", etag: ETAG, notify: false })
    const deletedEtag = google.event("review1")?.etag as string
    await expect(
      writer.remove(CALENDAR, "review1", { scope: "series", etag: deletedEtag, notify: false }),
    ).resolves.toBeUndefined()
    await expect(
      writer.remove(CALENDAR, "unknown1", { scope: "series", etag: ETAG, notify: false }),
    ).resolves.toBeUndefined()
  })

  it("respond changes only the owner's answer and keeps every other attendee", async () => {
    const { google, writer } = adapter()
    const answered = await writer.respond(CALENDAR, "review1", "tentative", { etag: ETAG, notify: true })
    expect(google.requests.at(-1)).toMatchObject({
      method: "PATCH",
      ifMatch: ETAG,
      body: { attendeesOmitted: true, attendees: [{ email: "owner@example.com", responseStatus: "tentative" }] },
    })
    expect(answered.ownResponse).toBe("tentative")
    expect(answered.participants).toHaveLength(2)
  })

  it("an event Google does not have fails with a registered reason", async () => {
    const { writer } = adapter()
    await expect(writer.respond(CALENDAR, "unknown1", "accepted", { etag: ETAG, notify: false })).rejects.toMatchObject(
      { code: "not_found", details: { reason: "google.not-found", status: 404 } },
    )
  })

  it("respond refuses an event the calendar is not invited to", async () => {
    const { google, writer } = adapter()
    const made = await writer.create(
      CALENDAR,
      { title: "Solo", startsAt: AT, endsAt: AT + 1 },
      { id: "solo1", notify: false },
    )
    await expect(
      writer.respond(CALENDAR, "solo1", "accepted", { etag: made.etag as string, notify: false }),
    ).rejects.toMatchObject({ details: { reason: "event.not-invited" } })
    expect(google.requests.filter(({ method }) => method === "PATCH")).toEqual([])
  })

  it("without the write grant nothing is sent, and the error names the grant, not a command", async () => {
    const { google, writer } = adapter([CALENDAR_READ_SCOPE])
    await expect(
      writer.create(CALENDAR, { title: "x", startsAt: AT, endsAt: AT + 1 }, { id: "abcde", notify: false }),
    ).rejects.toMatchObject({
      code: "permission_error",
      message: expect.not.stringContaining("session start"),
      details: { reason: "api.scope-missing", grant: "write" },
    })
    expect(google.requests).toEqual([])
  })
})
