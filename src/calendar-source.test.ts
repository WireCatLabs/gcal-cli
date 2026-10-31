import { calendarSourceContract } from "@wirecat/cli-core/calendar/testing"
import { describe, expect, it } from "vitest"
import { entryOf, googleCalendarSource } from "./calendar-source.js"
import { CALENDAR_READ_SCOPE } from "./google.js"
import { googleApi } from "./google-api.js"
import { CANCELLED_SLOT, DEAD_TOKEN, fakeGoogleCalendar, WINDOW } from "./testing/google-calendar.js"

const adapter = () => {
  const google = fakeGoogleCalendar()
  const api = googleApi({
    fetch: google.fetch as typeof fetch,
    scopes: () => [CALENDAR_READ_SCOPE],
    accessToken: async () => "fixture-access-token",
  })
  return { source: googleCalendarSource(api), requests: google.requests }
}

const MADRID = {
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

const fullList = async () => {
  const { source, requests } = adapter()
  const first = await source.changes(MADRID, { cursor: null, window: WINDOW })
  if ("reset" in first || !first.nextPage) throw new Error("expected a first page")
  const second = await source.changes(MADRID, { cursor: null, page: first.nextPage, window: WINDOW })
  if ("reset" in second) throw new Error("expected a second page")
  return { source, requests, first, second, entries: [...first.entries, ...second.entries] }
}

describe("calendarSourceContract over hand-written Google answers", () => {
  for (const { name, run } of calendarSourceContract(() => ({
    source: adapter().source,
    window: WINDOW,
    deadCursor: DEAD_TOKEN,
    changed: ["focus1", "gone2"],
    cancelledSlot: CANCELLED_SLOT,
  })))
    it(name, run)
})

describe("Google words to neutral ones", () => {
  it("lists every calendar page; only the owner's own calendars sync by default", async () => {
    expect(await adapter().source.calendars()).toEqual([
      {
        externalId: "owner@example.com",
        title: "owner@example.com",
        timezone: "Europe/Madrid",
        accessRole: "owner",
        primary: true,
        syncByDefault: true,
      },
      {
        externalId: "team@group.calendar.example.com",
        title: "Team (shared)",
        timezone: "Europe/Madrid",
        accessRole: "reader",
        primary: false,
        syncByDefault: false,
      },
      {
        externalId: "busy@group.calendar.example.com",
        title: "Busy only",
        timezone: null,
        accessRole: "free-busy",
        primary: false,
        syncByDefault: false,
      },
    ])
  })

  it("maps a series: attendees, own answer, UID, recurrence, join link without its query, no secret", async () => {
    const { entries } = await fullList()
    const series = entries.find(({ externalId }) => externalId === "weekly1")
    expect(series).toMatchObject({
      kind: "series",
      icalUid: "weekly1@google.com",
      status: "confirmed",
      eventType: "default",
      ownResponse: "accepted",
      recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO", "EXDATE;TZID=Europe/Madrid:20261109T100000"],
      startsAt: Date.parse("2026-11-02T09:00:00Z"),
      timezone: "Europe/Madrid",
      joinUrl: "https://meet.google.com/abc-defg-hij",
      conference: "Google Meet",
      organizer: { email: "owner@example.com", name: null },
      metadata: { guestsCanModify: false, hangoutLink: "https://meet.google.com/abc-defg-hij" },
      attachments: [],
    })
    expect(series?.participants).toEqual([
      { email: "owner@example.com", name: null, response: "accepted", organizer: true, self: true },
      { email: "ana@example.com", name: "Ana Example", response: "needs-action" },
      { email: "bob@example.com", name: null, response: "tentative", optional: true },
      { email: "room-1@resource.calendar.example.com", name: "Room 1", response: "accepted", resource: true },
    ])
    const text = JSON.stringify(series)
    for (const secret of ["998877", "fixturepwd", "123456789", "authuser"]) expect(text).not.toContain(secret)
    expect(series?.description).toContain("https://example.zoom.us/j/123")
  })

  it("maps event types, visibility, transparency and Drive files", async () => {
    const { entries } = await fullList()
    const byId = Object.fromEntries(entries.map((entry) => [entry.externalId, entry]))
    expect(byId.holiday1).toMatchObject({
      allDay: true,
      startDate: "2026-12-24",
      endDate: "2026-12-26",
      startsAt: Date.parse("2026-12-23T23:00:00Z"),
      eventType: "out-of-office",
      transparency: "transparent",
    })
    expect(byId.focus1).toMatchObject({
      eventType: "focus",
      visibility: "private",
      joinUrl: "https://teams.example.com/l/meetup-join/19%3a1",
      attachments: [{ fileId: "drivefixture1", title: "Writing notes" }],
    })
    expect(byId.office1).toMatchObject({ status: "tentative", eventType: "working-location", visibility: "public" })
    expect(byId.flight1).toMatchObject({ eventType: "from-mail", ownResponse: "declined", timezone: "UTC" })
  })

  it("a deleted event is a removal by id; a cancelled slot stays an occurrence of its series", async () => {
    const { second } = await fullList()
    expect(second.removed).toEqual(["gone1"])
    expect(second.entries.find(({ externalId }) => externalId === "weekly1_20261123T090000Z")).toMatchObject({
      kind: "occurrence",
      status: "cancelled",
      seriesExternalId: "weekly1",
      originalStartsAt: CANCELLED_SLOT.originalStartsAt,
      exception: true,
    })
    expect(second.cursor).toBe("sync-fixture-1")
  })

  it("asks for a full list with a window and deleted entries, and for changes with the token alone", async () => {
    const { source, requests } = await fullList()
    await source.changes(MADRID, { cursor: "sync-fixture-1", window: WINDOW })
    const lists = requests.filter(({ path }) => path.endsWith("/events"))
    expect(lists.map(({ query }) => Object.fromEntries(query))).toEqual([
      expect.objectContaining({ timeMin: "2026-01-01T00:00:00.000Z", showDeleted: "true", singleEvents: "false" }),
      expect.objectContaining({ timeMin: "2026-01-01T00:00:00.000Z", pageToken: "events-page-2" }),
      expect.not.objectContaining({ timeMin: expect.anything(), timeMax: expect.anything() }),
    ])
    expect(lists[2]?.query.get("syncToken")).toBe("sync-fixture-1")
  })

  it("asks for a series' slots with deleted ones, so a cancelled slot is not lost", async () => {
    const { source, requests } = adapter()
    const slots = await source.occurrences?.(MADRID, "weekly1", WINDOW)
    expect(slots?.map(({ externalId, status, exception }) => [externalId, status, exception])).toEqual([
      ["weekly1_20261102T090000Z", "confirmed", false],
      ["weekly1_20261116T090000Z", "confirmed", true],
      ["weekly1_20261123T090000Z", "cancelled", true],
      ["weekly1_20261130T090000Z", "confirmed", false],
    ])
    expect(requests.at(-1)?.query.get("showDeleted")).toBe("true")
  })

  it("a sync token Google refuses with 410 is a reset; other failures are not", async () => {
    const { source } = adapter()
    expect(await source.changes(MADRID, { cursor: DEAD_TOKEN, window: WINDOW })).toEqual({ reset: true })
    await expect(source.occurrences?.(MADRID, "missing", WINDOW)).rejects.toMatchObject({ code: "not_found" })
  })

  it("a page token Google refuses on resume is a reset, so the engine starts that round over", async () => {
    const { source } = adapter()
    expect(await source.changes(MADRID, { cursor: null, page: "events-page-held-too-long", window: WINDOW })).toEqual({
      reset: true,
    })
  })
})

describe("an event's zone", () => {
  it("falls back to the calendar's zone, then the zone in use, for a zone it does not know, every time it is asked", () => {
    const event = {
      id: "zoned1",
      start: { dateTime: "2026-11-02T10:00:00+01:00", timeZone: "Not/AZone" },
      end: { dateTime: "2026-11-02T11:00:00+01:00", timeZone: "Not/AZone" },
    }
    for (let round = 0; round < 2; round++) {
      expect(entryOf(event, { timezone: "Europe/Madrid" }).timezone).toBeNull()
      const allDay = { ...event, start: { date: "2026-11-02" }, end: { date: "2026-11-03" } }
      expect(entryOf(allDay, { timezone: "Not/AZone" }, "Europe/Madrid")).toMatchObject({
        startsAt: Date.parse("2026-11-01T23:00:00Z"),
        timezone: "Europe/Madrid",
      })
      expect(entryOf(allDay, { timezone: null }, "Asia/Tokyo")).toMatchObject({
        startsAt: Date.parse("2026-11-01T15:00:00Z"),
        timezone: "Asia/Tokyo",
      })
      expect(entryOf(allDay, MADRID, "Asia/Tokyo").timezone).toBeNull()
      expect(entryOf({ ...event, start: { ...event.start, timeZone: "Asia/Tokyo" } }, MADRID).timezone).toBe(
        "Asia/Tokyo",
      )
    }
  })
})
