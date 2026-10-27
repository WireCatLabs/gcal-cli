import { CliError, isCliError } from "@wirecat/cli-base"
import {
  type CalendarWriter,
  calendarConflict,
  type EventDraft,
  type EventPatch,
  type EventResponse,
  type StoredCalendar,
} from "@wirecat/cli-core/calendar"
import { entryOf } from "./calendar-source.js"
import type { CalendarEvent } from "./generated/types.js"
import type { GoogleApi } from "./google-api.js"

// https://developers.google.com/workspace/calendar/api/v3/reference/events#id — base32hex, 5 to 1024 characters.
const GOOGLE_ID = /^[a-v0-9]{5,1024}$/u

const RESPONSE: Record<EventResponse, string> = { accepted: "accepted", tentative: "tentative", declined: "declined" }

const statusOf = (error: unknown) => (isCliError(error) ? error.details.status : undefined)

const iso = (ms: number) => new Date(ms).toISOString()

/**
 * `start.timeZone` is required for a recurring event, the zone its rule is expanded in
 * (https://developers.google.com/workspace/calendar/api/v3/reference/events#start.timeZone), so a repeating all-day
 * event carries it too.
 */
const timesOf = ({ startsAt, endsAt, startDate, endDate, timezone }: EventPatch, recurring = false) => {
  const zone = timezone ? { timeZone: timezone } : {}
  if (startDate !== undefined && endDate !== undefined)
    return {
      start: { date: startDate, ...(recurring ? zone : {}) },
      end: { date: endDate, ...(recurring ? zone : {}) },
    }
  if (startsAt === undefined || endsAt === undefined) return {}
  return { start: { dateTime: iso(startsAt), ...zone }, end: { dateTime: iso(endsAt), ...zone } }
}

/**
 * An empty text, not `null`, clears a field: the generated request check, like Google's discovery document, types
 * them as strings.
 */
const bodyOf = (patch: EventPatch, recurring = patch.recurrence !== undefined): Record<string, unknown> => ({
  ...(patch.title === undefined ? {} : { summary: patch.title }),
  ...timesOf(patch, recurring),
  ...(patch.recurrence === undefined ? {} : { recurrence: patch.recurrence }),
  ...(patch.location === undefined ? {} : { location: patch.location ?? "" }),
  ...(patch.description === undefined ? {} : { description: patch.description ?? "" }),
  ...(patch.attendees === undefined
    ? {}
    : { attendees: patch.attendees.map(({ email, optional }) => ({ email, ...(optional ? { optional } : {}) })) }),
})

/**
 * Google Calendar as a `CalendarWriter`, through the generated API layer. A change sends the stored `etag` as
 * `If-Match`, so Google answers 412 when the event moved on. Scope needs no call of its own: an occurrence and its
 * series have different ids, and cli-core names the one to change.
 *
 * A switch between timed and all-day is a full `events.update` of the event as fetched: `events.patch` merges
 * `start`, and clearing its `dateTime` would need a `null` the generated request check refuses. Google documents get
 * then update with etags for a partial change (https://developers.google.com/workspace/calendar/api/v3/reference/events/update).
 */
export const googleCalendarWriter = (api: GoogleApi): CalendarWriter => {
  const where = (calendar: StoredCalendar, eventId: string, notify: boolean) => ({
    calendarId: calendar.externalId,
    eventId,
    sendUpdates: notify ? "all" : "none",
  })
  const get = async (calendar: StoredCalendar, eventId: string) =>
    (await api.call("calendar.events.get", { calendarId: calendar.externalId, eventId })) as CalendarEvent
  const guarded = async <T>(write: () => Promise<T>): Promise<T> => {
    try {
      return await write()
    } catch (error) {
      if (statusOf(error) === 412) throw calendarConflict()
      throw error
    }
  }
  const patch = (
    calendar: StoredCalendar,
    eventId: string,
    body: Record<string, unknown>,
    etag: string,
    notify: boolean,
  ) =>
    guarded(
      async () =>
        (await api.call("calendar.events.patch", where(calendar, eventId, notify), body, {
          headers: { "if-match": etag },
        })) as CalendarEvent,
    )

  /** The event as Google holds it, only if that is the version the store holds: else the change would overwrite. */
  const current = async (calendar: StoredCalendar, eventId: string, etag: string) => {
    const event = await get(calendar, eventId)
    if (event.etag !== etag) throw calendarConflict()
    return event
  }
  const replace = (calendar: StoredCalendar, event: CalendarEvent, etag: string, notify: boolean) =>
    guarded(
      async () =>
        (await api.call(
          "calendar.events.update",
          // Without these Google ignores the event's Meet link and Drive files in the body it is given.
          { ...where(calendar, event.id as string, notify), conferenceDataVersion: 1, supportsAttachments: true },
          event as Record<string, unknown>,
          { headers: { "if-match": etag } },
        )) as CalendarEvent,
    )

  return {
    provider: "google-calendar",

    async create(calendar, draft: EventDraft, { id, notify }) {
      if (!GOOGLE_ID.test(id))
        throw new CliError("validation_error", "Google takes an event id of 5 to 1024 letters a-v and digits", {
          sent: false,
        })
      try {
        const made = await api.call(
          "calendar.events.insert",
          { calendarId: calendar.externalId, sendUpdates: notify ? "all" : "none" },
          { id, ...bodyOf(draft) },
        )
        return entryOf(made as CalendarEvent, calendar)
      } catch (error) {
        // Google holds an event with this id: the attempt whose answer was lost made it.
        if (statusOf(error) !== 409) throw error
        return entryOf(await get(calendar, id), calendar)
      }
    },

    async update(calendar, externalId, changes, { etag, notify }) {
      const dated = changes.startDate !== undefined
      if (dated || changes.startsAt !== undefined) {
        const event = await current(calendar, externalId, etag)
        if (dated !== Boolean(event.start?.date)) {
          const recurring = changes.recurrence !== undefined || (event.recurrence?.length ?? 0) > 0
          return entryOf(await replace(calendar, { ...event, ...bodyOf(changes, recurring) }, etag, notify), calendar)
        }
      }
      return entryOf(await patch(calendar, externalId, bodyOf(changes), etag, notify), calendar)
    },

    async remove(calendar, externalId, { etag, notify }) {
      await guarded(() =>
        api.call("calendar.events.delete", where(calendar, externalId, notify), undefined, {
          headers: { "if-match": etag },
        }),
      )
    },

    async respond(calendar, externalId, response, { etag, notify }) {
      const self = (await get(calendar, externalId)).attendees?.find((attendee) => attendee.self)
      if (!self?.email)
        throw new CliError(
          "validation_error",
          "this calendar is not invited to the event; there is nothing to answer",
          {
            reason: "event.not-invited",
            sent: false,
          },
        )
      // Documented for this purpose: with attendeesOmitted Google changes this one answer and keeps the guest list.
      const body = { attendeesOmitted: true, attendees: [{ email: self.email, responseStatus: RESPONSE[response] }] }
      return entryOf(await patch(calendar, externalId, body, etag, notify), calendar)
    },
  }
}
