import { isCliError } from "@wirecat/cli-base"
import { timezoneOf, zonedMoment } from "@wirecat/cli-base/query"
import type {
  BusyTimes,
  CalendarAccessRole,
  CalendarInput,
  CalendarSource,
  ChangeResult,
  EntryEventType,
  EntryInput,
  EntryParticipantInput,
  EntryStatus,
  EntryTransparency,
  EntryVisibility,
  ParticipantResponse,
  StoredCalendar,
  SyncWindow,
} from "@wirecat/cli-core/calendar"
import { calendarText, ENTRY_METADATA_KEYS, joinUrlWithoutQuery } from "@wirecat/cli-core/meetings"
import type {
  CalendarCalendarList,
  CalendarCalendarListEntry,
  CalendarEvent,
  CalendarEventDateTime,
  CalendarEvents,
  CalendarFreeBusyResponse,
} from "./generated/types.js"
import type { GoogleApi } from "./google-api.js"

const PAGE_SIZE = 2500
const SPAN = { start: 0, end: 0 }

const ROLE: Record<string, CalendarAccessRole> = {
  owner: "owner",
  writer: "writer",
  reader: "reader",
  freeBusyReader: "free-busy",
}
const RESPONSE: Record<string, ParticipantResponse> = {
  needsAction: "needs-action",
  accepted: "accepted",
  tentative: "tentative",
  declined: "declined",
}
const EVENT_TYPE: Record<string, EntryEventType> = {
  default: "default",
  outOfOffice: "out-of-office",
  focusTime: "focus",
  workingLocation: "working-location",
  birthday: "birthday",
  fromGmail: "from-mail",
}
const STATUS: Record<string, EntryStatus> = { confirmed: "confirmed", tentative: "tentative", cancelled: "cancelled" }
const TRANSPARENCY: Record<string, EntryTransparency> = { opaque: "opaque", transparent: "transparent" }
const VISIBILITY: Record<string, EntryVisibility> = {
  default: "default",
  public: "public",
  private: "private",
  confidential: "confidential",
}
const RECURRENCE_LINE = /^(RRULE|RDATE|EXDATE|EXRULE)[:;]/u

const word = <T>(table: Record<string, T>, value: string | undefined): T | null =>
  value !== undefined && Object.hasOwn(table, value) ? (table[value] as T) : null

const iso = (ms: number) => new Date(ms).toISOString()

// A sync maps thousands of events in a handful of zones; building a formatter for each is most of the mapping's time.
const checkedZones = new Map<string, boolean>()

const zoneOk = (zone: string | undefined): zone is string => {
  if (!zone) return false
  let ok = checkedZones.get(zone)
  if (ok === undefined) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: zone })
      ok = true
    } catch {
      ok = false
    }
    checkedZones.set(zone, ok)
  }
  return ok
}

const momentOf = (time: CalendarEventDateTime | undefined, zone: string): number | null => {
  if (time?.dateTime) return Date.parse(time.dateTime)
  if (time?.date) return zonedMoment(time.date, zone, SPAN)
  return null
}

/** An all-day slot is midnight UTC of its date, whatever the calendar's zone, so it matches across calendars. */
const slotOf = (time: CalendarEventDateTime | undefined): number | null =>
  time?.dateTime ? Date.parse(time.dateTime) : time?.date ? Date.parse(`${time.date}T00:00:00Z`) : null

const firstLink = (text: string | undefined) => text?.match(/https?:\/\/[^\s<>"')\]]+/iu)?.[0]

/** The meeting's address without its query, where Google, Zoom and Teams put a passcode. */
const joinUrlOf = (event: CalendarEvent): string | null => {
  const video = event.conferenceData?.entryPoints?.find((point) => point.entryPointType === "video")?.uri
  return joinUrlWithoutQuery(video ?? event.hangoutLink ?? firstLink(event.location)) ?? null
}

const participantOf = (attendee: NonNullable<CalendarEvent["attendees"]>[number]): EntryParticipantInput | null =>
  attendee.email
    ? {
        email: attendee.email,
        name: attendee.displayName ?? null,
        response: word(RESPONSE, attendee.responseStatus),
        ...(attendee.optional ? { optional: true } : {}),
        ...(attendee.organizer ? { organizer: true } : {}),
        ...(attendee.self ? { self: true } : {}),
        ...(attendee.resource ? { resource: true } : {}),
      }
    : null

const metadataOf = (event: CalendarEvent) => {
  const kept = Object.fromEntries(
    ENTRY_METADATA_KEYS.filter((key) => (event as Record<string, unknown>)[key] !== undefined).map((key) => [
      key,
      (event as Record<string, unknown>)[key],
    ]),
  )
  return Object.keys(kept).length ? kept : null
}

/**
 * One Google event in the neutral words (cli-core `src/meetings/event-store.ts`). An all-day date with no zone of its
 * own or of its calendar is read in the zone in use, as cli-core's calendar commands read one (WC-TIME-3).
 */
export const entryOf = (
  event: CalendarEvent,
  calendar: Pick<StoredCalendar, "timezone">,
  zoneInUse?: string,
): EntryInput => {
  const zone = [event.start?.timeZone, calendar.timezone ?? undefined].find(zoneOk) ?? zoneInUse ?? timezoneOf()
  const status = word(STATUS, event.status) ?? "confirmed"
  const recurrence = (event.recurrence ?? []).filter((line) => RECURRENCE_LINE.test(line))
  const kind = event.recurringEventId ? "occurrence" : recurrence.length ? "series" : "single"
  const allDay = Boolean(event.start?.date)
  const startsAt = momentOf(event.start, zone)
  const originalStartsAt = slotOf(event.originalStartTime)
  const attendees = (event.attendees ?? []).map(participantOf).filter((one) => one !== null)
  const self = event.attendees?.find((attendee) => attendee.self)
  return {
    externalId: event.id ?? "",
    kind,
    ...(kind === "occurrence"
      ? {
          seriesExternalId: event.recurringEventId ?? null,
          originalStartsAt,
          exception: status === "cancelled" || slotOf(event.start) !== originalStartsAt,
        }
      : {}),
    icalUid: event.iCalUID ?? null,
    status,
    title: calendarText(event.summary, { dropSecretLines: false }),
    description: calendarText(event.description),
    location: calendarText(event.location),
    startsAt,
    endsAt: momentOf(event.end, zone),
    allDay,
    startDate: event.start?.date ?? null,
    endDate: event.end?.date ?? null,
    timezone: zoneOk(event.start?.timeZone) ? event.start.timeZone : null,
    recurrence: kind === "series" ? recurrence : null,
    eventType: word(EVENT_TYPE, event.eventType),
    transparency: word(TRANSPARENCY, event.transparency),
    visibility: word(VISIBILITY, event.visibility),
    ownResponse: self ? word(RESPONSE, self.responseStatus) : null,
    organizer: event.organizer?.email
      ? { email: event.organizer.email, name: event.organizer.displayName ?? null }
      : null,
    participants: attendees,
    joinUrl: joinUrlOf(event),
    conference: event.conferenceData?.conferenceSolution?.name ?? (event.hangoutLink ? "Google Meet" : null),
    url: event.htmlLink ?? null,
    sequence: event.sequence ?? null,
    etag: event.etag ?? null,
    externalUpdatedAt: event.updated ? Date.parse(event.updated) : null,
    metadata: metadataOf(event),
    // Google leaves `attachments` out of an event that has none; a full event says so, or a removed file stays linked.
    attachments: (event.attachments ?? [])
      .filter((file) => file.fileId)
      .map((file) => ({ fileId: file.fileId as string, title: file.title ?? null })),
  }
}

/**
 * A deleted event comes with little more than its id. A cancelled slot of a series still names its series and its
 * slot; the store cancels it. Anything else cancelled is a removal by id, so its stored fields are not blanked.
 */
const isRemoval = (event: CalendarEvent) => event.status === "cancelled" && !event.recurringEventId

const calendarOf = (entry: CalendarCalendarListEntry): CalendarInput | null => {
  if (!entry.id || entry.deleted) return null
  const accessRole = word(ROLE, entry.accessRole)
  return {
    externalId: entry.id,
    title: entry.summaryOverride ?? entry.summary ?? null,
    timezone: zoneOk(entry.timeZone) ? entry.timeZone : null,
    accessRole,
    primary: entry.primary === true,
    syncByDefault: accessRole === "owner",
  }
}

const statusOf = (error: unknown) => (isCliError(error) ? error.details.status : undefined)

/**
 * Google Calendar as a `CalendarSource`, read only, through the generated API layer. A series' slots come from
 * `events.instances` on request; a sync token holds no window, so a full round lists the window again.
 */
export const googleCalendarSource = (api: GoogleApi): CalendarSource => {
  const list = async (method: string, params: Record<string, unknown>) =>
    (await api.call(method, params)) as CalendarEvents

  return {
    provider: "google-calendar",
    traits: { expands: "on-request", cursorHoldsWindow: false, fullListOnly: false },

    async calendars() {
      const found: CalendarInput[] = []
      let pageToken: string | undefined
      do {
        const page = (await api.call("calendar.calendarList.list", {
          maxResults: 250,
          ...(pageToken ? { pageToken } : {}),
        })) as CalendarCalendarList
        for (const entry of page.items ?? []) {
          const calendar = calendarOf(entry)
          if (calendar) found.push(calendar)
        }
        pageToken = page.nextPageToken
      } while (pageToken)
      return found
    },

    async changes(calendar, { cursor, page, window }): Promise<ChangeResult> {
      // Google refuses timeMin and timeMax beside a sync token; the other parameters must stay as the full list had them.
      const params = {
        calendarId: calendar.externalId,
        maxResults: PAGE_SIZE,
        showDeleted: true,
        singleEvents: false,
        ...(cursor === null ? { timeMin: iso(window.from), timeMax: iso(window.to) } : { syncToken: cursor }),
        ...(page ? { pageToken: page } : {}),
      }
      let answer: CalendarEvents
      try {
        answer = await list("calendar.events.list", params)
      } catch (error) {
        // Google states no lifetime for a page token, and a run may resume one held since an earlier run: a refused
        // one asks the engine to start that round over.
        // https://developers.google.com/workspace/calendar/api/v3/reference/events/list
        const status = statusOf(error)
        if (page ? status === 400 || status === 410 : cursor !== null && status === 410) return { reset: true }
        throw error
      }
      const items = answer.items ?? []
      return {
        entries: items.filter((event) => event.id && !isRemoval(event)).map((event) => entryOf(event, calendar)),
        removed: items.filter((event) => event.id && isRemoval(event)).map((event) => event.id as string),
        ...(answer.nextPageToken ? { nextPage: answer.nextPageToken } : { cursor: answer.nextSyncToken ?? null }),
      }
    },

    async occurrences(calendar, seriesExternalId, window: SyncWindow) {
      const slots: EntryInput[] = []
      let pageToken: string | undefined
      do {
        // Without showDeleted Google leaves a cancelled slot out, and the store would keep it as scheduled.
        const page = await list("calendar.events.instances", {
          calendarId: calendar.externalId,
          eventId: seriesExternalId,
          timeMin: iso(window.from),
          timeMax: iso(window.to),
          showDeleted: true,
          maxResults: PAGE_SIZE,
          ...(pageToken ? { pageToken } : {}),
        })
        for (const event of page.items ?? []) if (event.id) slots.push(entryOf(event, calendar))
        pageToken = page.nextPageToken
      } while (pageToken)
      return slots
    },

    // Google's own text search also finds events outside the sync window; read only and stored nowhere.
    async search(calendar, { query, limit }) {
      const page = await list("calendar.events.list", {
        calendarId: calendar.externalId,
        q: query,
        maxResults: limit,
        singleEvents: false,
      })
      return {
        entries: (page.items ?? []).filter((event) => event.id).map((event) => entryOf(event, calendar)),
        more: Boolean(page.nextPageToken),
      }
    },

    // https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query — calendar.readonly suffices.
    async freeBusy({ calendars, people, window }) {
      const ids = [...calendars, ...people]
      const answer = (await api.call(
        "calendar.freebusy.query",
        {},
        { timeMin: iso(window.from), timeMax: iso(window.to), items: ids.map((id) => ({ id })) },
      )) as CalendarFreeBusyResponse
      return ids.map((id): BusyTimes => {
        const one = answer.calendars?.[id]
        const error = one ? one.errors?.[0]?.reason : "notAnswered"
        const busy = (one?.busy ?? []).flatMap(({ start, end }) => {
          const from = Math.max(Date.parse(start ?? ""), window.from)
          const to = Math.min(Date.parse(end ?? ""), window.to)
          return Number.isFinite(from) && Number.isFinite(to) && from < to ? [{ from, to }] : []
        })
        return { id, busy: error ? [] : busy, ...(error ? { error } : {}) }
      })
    },
  }
}
