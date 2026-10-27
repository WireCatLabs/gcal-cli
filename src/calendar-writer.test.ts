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
    expect(google.requests[0]).toMatchObject({
      method: "PATCH",
      path: "calendars/owner@example.com/events/review1",
      ifMatch: ETAG,
      body: {
        start: { dateTime: "2026-11-02T09:00:00.000Z", timeZone: "Europe/Madrid" },
        end: { dateTime: "2026-11-02T10:00:00.000Z", timeZone: "Europe/Madrid" },
        location: "",
      },
    })
    expect(google.requests[0]?.query.get("sendUpdates")).toBe("none")
    expect(changed).toMatchObject({ location: null, startsAt: AT })
  })

  it("delete sends If-Match and returns nothing", async () => {
    const { google, writer } = adapter()
    await writer.remove(CALENDAR, "review1", { scope: "series", etag: ETAG, notify: true })
    expect(google.requests[0]).toMatchObject({ method: "DELETE", ifMatch: ETAG })
    expect(google.event("review1")?.status).toBe("cancelled")
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

  it("without the write grant nothing is sent, and the error names session start --grant write", async () => {
    const { google, writer } = adapter([CALENDAR_READ_SCOPE])
    await expect(
      writer.create(CALENDAR, { title: "x", startsAt: AT, endsAt: AT + 1 }, { id: "abcde", notify: false }),
    ).rejects.toMatchObject({ code: "permission_error", message: expect.stringContaining("--grant write") })
    expect(google.requests).toEqual([])
  })
})
