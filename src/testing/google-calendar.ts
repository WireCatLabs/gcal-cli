// Shapes from the Calendar API reference (CalendarList: list, Events: list, Events: instances, Freebusy: query);
// every value is made up.

export const WINDOW = { from: Date.UTC(2026, 0, 1), to: Date.UTC(2027, 0, 1) }
export const DEAD_TOKEN = "sync-fixture-dead"
export const CANCELLED_SLOT = { seriesExternalId: "weekly1", originalStartsAt: Date.parse("2026-11-23T09:00:00Z") }

const PREFIX = "/calendar/v3/"

const CALENDARS = {
  kind: "calendar#calendarList",
  items: [
    {
      kind: "calendar#calendarListEntry",
      id: "owner@example.com",
      summary: "owner@example.com",
      timeZone: "Europe/Madrid",
      accessRole: "owner",
      primary: true,
    },
    {
      kind: "calendar#calendarListEntry",
      id: "team@group.calendar.example.com",
      summary: "Team",
      summaryOverride: "Team (shared)",
      timeZone: "Europe/Madrid",
      accessRole: "reader",
    },
  ],
  nextPageToken: "calendars-page-2",
}
const CALENDARS_2 = {
  kind: "calendar#calendarList",
  items: [
    {
      kind: "calendar#calendarListEntry",
      id: "busy@group.calendar.example.com",
      summary: "Busy only",
      accessRole: "freeBusyReader",
    },
  ],
}

const madrid = (dateTime: string) => ({ dateTime, timeZone: "Europe/Madrid" })

export const SERIES = {
  kind: "calendar#event",
  id: "weekly1",
  etag: '"3000000000000000"',
  status: "confirmed",
  htmlLink: "https://calendar.google.com/calendar/event?eid=d2Vla2x5MQ",
  updated: "2026-10-20T08:00:00.000Z",
  summary: "Weekly planning",
  description: "Agenda: <b>roadmap</b><br>Passcode: 998877<br>https://example.zoom.us/j/123?pwd=fixturepwd",
  organizer: { email: "owner@example.com", self: true },
  start: madrid("2026-11-02T10:00:00+01:00"),
  end: madrid("2026-11-02T11:00:00+01:00"),
  recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO", "EXDATE;TZID=Europe/Madrid:20261109T100000"],
  iCalUID: "weekly1@google.com",
  sequence: 2,
  attendees: [
    { email: "owner@example.com", organizer: true, self: true, responseStatus: "accepted" },
    { email: "ana@example.com", displayName: "Ana Example", responseStatus: "needsAction" },
    { email: "bob@example.com", optional: true, responseStatus: "tentative" },
    {
      email: "room-1@resource.calendar.example.com",
      displayName: "Room 1",
      resource: true,
      responseStatus: "accepted",
    },
  ],
  hangoutLink: "https://meet.google.com/abc-defg-hij",
  conferenceData: {
    entryPoints: [
      {
        entryPointType: "video",
        uri: "https://meet.google.com/abc-defg-hij?authuser=0",
        label: "meet.google.com/abc-defg-hij",
      },
      { entryPointType: "phone", uri: "tel:+34-900-000-000", label: "+34 900 000 000", pin: "123456789" },
    ],
    conferenceSolution: { key: { type: "hangoutsMeet" }, name: "Google Meet" },
    conferenceId: "abc-defg-hij",
  },
  guestsCanModify: false,
  eventType: "default",
}

const instance = (day: string, extra: Record<string, unknown> = {}) => ({
  kind: "calendar#event",
  id: `weekly1_${day}T090000Z`,
  status: "confirmed",
  summary: "Weekly planning",
  start: madrid(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6)}T10:00:00+01:00`),
  end: madrid(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6)}T11:00:00+01:00`),
  recurringEventId: "weekly1",
  originalStartTime: madrid(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6)}T10:00:00+01:00`),
  iCalUID: "weekly1@google.com",
  attendees: SERIES.attendees,
  hangoutLink: SERIES.hangoutLink,
  eventType: "default",
  ...extra,
})

const MOVED = instance("20261116", {
  start: madrid("2026-11-16T12:00:00+01:00"),
  end: madrid("2026-11-16T13:00:00+01:00"),
})
/** A cancelled slot: Google lists it only with showDeleted. */
const CANCELLED = {
  kind: "calendar#event",
  id: "weekly1_20261123T090000Z",
  status: "cancelled",
  recurringEventId: "weekly1",
  originalStartTime: madrid("2026-11-23T10:00:00+01:00"),
}

const HOLIDAY = {
  kind: "calendar#event",
  id: "holiday1",
  status: "confirmed",
  summary: "Away",
  start: { date: "2026-12-24" },
  end: { date: "2026-12-26" },
  transparency: "transparent",
  eventType: "outOfOffice",
  iCalUID: "holiday1@google.com",
  organizer: { email: "owner@example.com", self: true },
}

const FOCUS = {
  kind: "calendar#event",
  id: "focus1",
  status: "confirmed",
  summary: "Writing",
  location: "https://teams.example.com/l/meetup-join/19%3a1?pin=4321 Room 2",
  start: { dateTime: "2026-11-03T08:00:00Z" },
  end: { dateTime: "2026-11-03T10:00:00Z" },
  visibility: "private",
  eventType: "focusTime",
  attachments: [
    {
      fileUrl: "https://drive.google.com/open?id=drivefixture1",
      title: "Writing notes",
      mimeType: "application/vnd.google-apps.document",
      fileId: "drivefixture1",
    },
  ],
}

const OFFICE = {
  kind: "calendar#event",
  id: "office1",
  status: "tentative",
  summary: "Home",
  start: { date: "2026-11-04" },
  end: { date: "2026-11-05" },
  transparency: "transparent",
  visibility: "public",
  eventType: "workingLocation",
  workingLocationProperties: { type: "homeOffice", homeOffice: {} },
}

const FROM_MAIL = {
  kind: "calendar#event",
  id: "flight1",
  status: "confirmed",
  summary: "Flight to Madrid",
  start: { dateTime: "2026-11-20T07:00:00Z", timeZone: "UTC" },
  end: { dateTime: "2026-11-20T09:00:00Z", timeZone: "UTC" },
  eventType: "fromGmail",
  attendees: [{ email: "owner@example.com", self: true, responseStatus: "declined" }],
}

/** A deleted event: Google guarantees only its id. */
const GONE = { kind: "calendar#event", id: "gone1", status: "cancelled" }

const FULL_1 = { kind: "calendar#events", items: [SERIES, HOLIDAY, FOCUS], nextPageToken: "events-page-2" }
const FULL_2 = {
  kind: "calendar#events",
  items: [MOVED, CANCELLED, OFFICE, FROM_MAIL, GONE],
  nextSyncToken: "sync-fixture-1",
}
const CHANGES = {
  kind: "calendar#events",
  items: [
    { ...FOCUS, summary: "Writing, moved", updated: "2026-10-28T08:00:00.000Z" },
    { ...GONE, id: "gone2" },
  ],
  nextSyncToken: "sync-fixture-2",
}
const INSTANCES = [instance("20261102"), MOVED, CANCELLED, instance("20261130")]

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })

const GONE_ERROR = {
  error: {
    code: 410,
    message: "Sync token is no longer valid, a full sync is required.",
    errors: [{ reason: "fullSyncRequired" }],
  },
}

export interface FakeRequest {
  path: string
  query: URLSearchParams
}

/** Busy times Google would show, by calendar or address; any other id is one Google cannot see. */
export const BUSY: Record<string, { start: string; end: string }[]> = {
  "owner@example.com": [{ start: "2026-11-02T09:00:00Z", end: "2026-11-02T10:00:00Z" }],
  "ana@example.com": [
    { start: "2026-11-01T23:00:00Z", end: "2026-11-02T08:30:00Z" },
    { start: "2026-11-02T11:00:00Z", end: "2026-11-02T12:00:00Z" },
  ],
}

const freeBusyOf = (body: { timeMin: string; timeMax: string; items: { id: string }[] }) => ({
  kind: "calendar#freeBusy",
  timeMin: body.timeMin,
  timeMax: body.timeMax,
  calendars: Object.fromEntries(
    body.items.map(({ id }) => [
      id,
      BUSY[id]
        ? {
            busy: BUSY[id].filter(
              ({ start, end }) =>
                Date.parse(start) < Date.parse(body.timeMax) && Date.parse(end) > Date.parse(body.timeMin),
            ),
          }
        : { errors: [{ domain: "global", reason: "notFound" }], busy: [] },
    ]),
  ),
})

/**
 * Google Calendar over hand-written answers. It refuses what Google refuses: a sync token beside a time bound, and a
 * full list that would leave deleted entries out. A cancelled slot is answered only with showDeleted, as Google does.
 */
/** Google's error body for a parameter it does not accept, here a page token held too long. */
const INVALID_ERROR = {
  error: {
    code: 400,
    message: "Invalid Value",
    errors: [{ domain: "global", reason: "invalid", message: "Invalid Value" }],
  },
}

export const fakeGoogleCalendar = (extra: Record<string, unknown>[] = []) => {
  const requests: FakeRequest[] = []
  const fetch = async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(String(input))
    const path = decodeURIComponent(url.pathname.slice(PREFIX.length))
    const query = url.searchParams
    requests.push({ path, query })
    if (path === "freeBusy" && init.method === "POST") return json(freeBusyOf(JSON.parse(String(init.body))))
    if (path === "users/me/calendarList")
      return json(query.get("pageToken") === "calendars-page-2" ? CALENDARS_2 : CALENDARS)
    const events = path.match(/^calendars\/([^/]+)\/events$/u)
    if (events) {
      const words = query.get("q")
      if (words !== null)
        return json({
          kind: "calendar#events",
          items: [...FULL_1.items, ...FULL_2.items, ...extra].filter(
            (one) =>
              one.status !== "cancelled" &&
              String((one as Record<string, unknown>).summary ?? "")
                .toLowerCase()
                .includes(words.toLowerCase()),
          ),
        })
      const token = query.get("syncToken")
      if (token && (query.has("timeMin") || query.has("timeMax")))
        return json({ error: { code: 400, message: "syncToken with a time bound" } }, 400)
      if (query.get("showDeleted") !== "true" || query.get("singleEvents") !== "false")
        return json({ error: { code: 400, message: "the fake expects showDeleted and no expansion" } }, 400)
      if (token === DEAD_TOKEN) return json(GONE_ERROR, 410)
      if (token === "sync-fixture-1") return json(CHANGES)
      if (token) return json({ kind: "calendar#events", items: [], nextSyncToken: token })
      if (!query.has("timeMin") || !query.has("timeMax"))
        return json({ error: { code: 400, message: "the fake expects a window" } }, 400)
      const page = query.get("pageToken")
      if (page !== null && page !== "events-page-2") return json(INVALID_ERROR, 400)
      return json(page === "events-page-2" ? { ...FULL_2, items: [...FULL_2.items, ...extra] } : FULL_1)
    }
    const instances = path.match(/^calendars\/([^/]+)\/events\/([^/]+)\/instances$/u)
    if (instances?.[2] === "weekly1")
      return json({
        kind: "calendar#events",
        items: INSTANCES.filter((one) => one.status !== "cancelled" || query.get("showDeleted") === "true"),
      })
    return json({ error: { code: 404, message: "Not Found" } }, 404)
  }
  return { fetch, requests }
}
