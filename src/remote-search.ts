import type { StoredCalendar } from "@wirecat/cli-core/calendar"
import { entryOf } from "./calendar-source.js"
import type { CalendarEvents } from "./generated/types.js"
import type { GoogleApi } from "./google-api.js"
import { PROVIDER } from "./store.js"

export interface RemoteSearchRequest {
  query: string
  limit: number
  newest: boolean
  account: string
}

const isoOf = (ms: number | null | undefined) => (ms == null ? null : new Date(ms).toISOString())

/**
 * Google's own text search (`events.list` with `q`) over the calendars the profile syncs, read only and stored
 * nowhere. Unlike the local search it also finds events outside the sync window; a calendar the owner does not sync
 * stays out, since he chose which calendars gcal reads.
 */
export const searchGoogle = async (
  api: GoogleApi,
  calendars: readonly StoredCalendar[],
  request: RemoteSearchRequest,
) => {
  const hits = []
  let more = false
  for (const calendar of calendars) {
    const page = (await api.call("calendar.events.list", {
      calendarId: calendar.externalId,
      q: request.query,
      maxResults: request.limit,
      singleEvents: false,
    })) as CalendarEvents
    more ||= Boolean(page.nextPageToken)
    for (const event of page.items ?? []) {
      if (!event.id || event.status === "cancelled") continue
      const entry = entryOf(event, calendar)
      hits.push({
        provider: PROVIDER.name,
        account: request.account,
        calendar: calendar.externalId,
        external_id: entry.externalId,
        title: entry.title ?? null,
        starts_at: isoOf(entry.startsAt),
        ends_at: isoOf(entry.endsAt),
        all_day: entry.allDay === true,
        status: entry.status,
        location: entry.location ?? null,
        ...(entry.url ? { url: entry.url } : {}),
        found_by: "google",
      })
    }
  }
  const order = request.newest ? -1 : 1
  hits.sort((a, b) => order * (a.starts_at ?? "").localeCompare(b.starts_at ?? ""))
  return {
    query: request.query,
    by: "google",
    hits: hits.slice(0, request.limit),
    has_more: more || hits.length > request.limit,
    // The marker names fields by their path in this answer, as cli-core's local `search` does.
    untrusted: ["hits.title", "hits.location"],
  }
}
