import { CliError, isCliError } from "@wirecat/cli-base"
import {
  type CalendarWriter,
  calendarConflict,
  type EventDraft,
  type EventPatch,
  type EventResponse,
  type IcsEvent,
  type StoredCalendar,
} from "@wirecat/cli-core/calendar"
import { entryOf } from "./calendar-source.js"
import * as schema from "./generated/schemas.js"
import type { CalendarEvent } from "./generated/types.js"
import { answerOf, type GoogleApi } from "./google-api.js"

// https://developers.google.com/workspace/calendar/api/v3/reference/events#id — base32hex, 5 to 1024 characters.
const GOOGLE_ID = /^[a-v0-9]{5,1024}$/u

const RESPONSE: Record<EventResponse, string> = { accepted: "accepted", tentative: "tentative", declined: "declined" }

const statusOf = (error: unknown) => (isCliError(error) ? error.details.status : undefined)

const isGone = (error: unknown) => {
  const status = statusOf(error)
  return status === 404 || status === 410
}

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
export type GoogleCalendarWriter = CalendarWriter & Required<Pick<CalendarWriter, "move" | "quickAdd" | "importEvent">>

export const googleCalendarWriter = (api: GoogleApi): GoogleCalendarWriter => {
  const where = (calendar: StoredCalendar, eventId: string, notify: boolean) => ({
    calendarId: calendar.externalId,
    eventId,
    sendUpdates: notify ? "all" : "none",
  })
  const get = async (calendar: StoredCalendar, eventId: string) =>
    answerOf(schema.CalendarEvent, await api.call("calendar.events.get", { calendarId: calendar.externalId, eventId }))
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
    guarded(async () =>
      answerOf(
        schema.CalendarEvent,
        await api.call("calendar.events.patch", where(calendar, eventId, notify), body, {
          headers: { "if-match": etag },
        }),
      ),
    )

  const replace = (calendar: StoredCalendar, eventId: string, event: CalendarEvent, etag: string, notify: boolean) =>
    guarded(async () =>
      answerOf(
        schema.CalendarEvent,
        await api.call(
          "calendar.events.update",
          // Without these Google ignores the event's Meet link and Drive files in the body it is given.
          { ...where(calendar, eventId, notify), conferenceDataVersion: 1, supportsAttachments: true },
          { ...event },
          { headers: { "if-match": etag } },
        ),
      ),
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
        return entryOf(answerOf(schema.CalendarEvent, made), calendar)
      } catch (error) {
        // Google holds an event with this id: the attempt whose answer was lost made it.
        if (statusOf(error) !== 409) throw error
        return entryOf(await get(calendar, id), calendar)
      }
    },

    async quickAdd(calendar, text, { notify }) {
      const made = await api.call("calendar.events.quickAdd", {
        calendarId: calendar.externalId,
        text,
        sendUpdates: notify ? "all" : "none",
      })
      return entryOf(answerOf(schema.CalendarEvent, made), calendar)
    },

    /** events.import takes no sendUpdates: Google mails nobody about an imported copy. */
    async importEvent(calendar, event: IcsEvent) {
      const imported = await api.call(
        "calendar.events.import",
        { calendarId: calendar.externalId },
        {
          iCalUID: event.uid,
          ...bodyOf(
            {
              ...(event.title ? { title: event.title } : {}),
              ...(event.startsAt === undefined ? {} : { startsAt: event.startsAt, endsAt: event.endsAt }),
              ...(event.startDate === undefined ? {} : { startDate: event.startDate, endDate: event.endDate }),
              // Google requires start.timeZone on every repeating event, an all-day one too, which iCalendar
              // leaves without a zone: the calendar's own zone stands in.
              ...(event.timezone || event.recurrence ? { timezone: event.timezone || calendar.timezone || "UTC" } : {}),
              ...(event.location ? { location: event.location } : {}),
              ...(event.description ? { description: event.description } : {}),
              ...(event.attendees?.length
                ? {
                    attendees: event.attendees.map(({ email, optional }) => ({
                      email,
                      ...(optional ? { optional } : {}),
                    })),
                  }
                : {}),
              ...(event.recurrence ? { recurrence: event.recurrence } : {}),
            },
            event.recurrence !== undefined,
          ),
          ...(event.status ? { status: event.status } : {}),
          ...(event.transparency ? { transparency: event.transparency } : {}),
          ...(event.organizer
            ? {
                organizer: {
                  email: event.organizer.email,
                  ...(event.organizer.name ? { displayName: event.organizer.name } : {}),
                },
              }
            : {}),
        },
      )
      return entryOf(answerOf(schema.CalendarEvent, imported), calendar)
    },

    async update(calendar, externalId, changes, { etag, notify }) {
      const dated = changes.startDate !== undefined
      if (dated || changes.startsAt !== undefined) {
        // The replace still carries the synced etag, so an event that moved on since is a 412, never overwritten.
        const event = await get(calendar, externalId)
        if (dated !== Boolean(event.start?.date)) {
          const recurring = changes.recurrence !== undefined || (event.recurrence?.length ?? 0) > 0
          const replaced = await replace(
            calendar,
            externalId,
            { ...event, ...bodyOf(changes, recurring) },
            etag,
            notify,
          )
          return entryOf(replaced, calendar)
        }
      }
      return entryOf(await patch(calendar, externalId, bodyOf(changes), etag, notify), calendar)
    },

    async remove(calendar, externalId, { etag, notify }) {
      try {
        await guarded(() =>
          api.call("calendar.events.delete", where(calendar, externalId, notify), undefined, {
            headers: { "if-match": etag },
          }),
        )
      } catch (error) {
        // 410 is an event deleted already, "no further action is necessary"; 404 is one Google no longer shows this
        // account. Either way nothing is left to delete, and cli-core removes the stored copy.
        // https://developers.google.com/workspace/calendar/api/guides/errors
        if (!isGone(error)) throw error
      }
    },

    /**
     * Google's move takes no If-Match (https://developers.google.com/workspace/calendar/api/v3/reference/events/move),
     * so the etag is checked on a read just before it. An event gone from `calendar` but held by `target` is the
     * move whose answer was lost.
     */
    async move(calendar, externalId, target, { etag, notify }) {
      let event: CalendarEvent | undefined
      try {
        event = await get(calendar, externalId)
      } catch (error) {
        if (!isGone(error)) throw error
      }
      if (!event || event.status === "cancelled") {
        const there = await get(target, externalId)
        if (there.status === "cancelled")
          throw new CliError("not_found", "the event is on neither calendar any more", { reason: "google.not-found" })
        return entryOf(there, target)
      }
      if (event.etag !== etag) throw calendarConflict()
      const moved = await api.call("calendar.events.move", {
        calendarId: calendar.externalId,
        eventId: externalId,
        destination: target.externalId,
        sendUpdates: notify ? "all" : "none",
      })
      return entryOf(answerOf(schema.CalendarEvent, moved), target)
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
