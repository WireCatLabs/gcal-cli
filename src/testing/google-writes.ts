// Shapes and refusals from the Calendar API reference (Events: insert, get, patch, delete; "Handle API errors" for
// 409 and 412; "Resource versions" for If-Match); every value is made up.

const PREFIX = "/calendar/v3/"
// https://developers.google.com/workspace/calendar/api/v3/reference/events#id
const GOOGLE_ID = /^[a-v0-9]{5,1024}$/u

type Event = Record<string, unknown> & { id: string; etag: string }

/** An invitation the owner has not answered yet, on the primary calendar of the read fake. */
export const INVITATION: Event = {
  kind: "calendar#event",
  id: "review1",
  etag: '"3100000000000000"',
  status: "confirmed",
  htmlLink: "https://calendar.google.com/calendar/event?eid=cmV2aWV3MQ",
  updated: "2026-10-21T08:00:00.000Z",
  summary: "Example review",
  location: "Room 2",
  organizer: { email: "ana@example.com", displayName: "Ana Example" },
  start: { dateTime: "2026-11-05T10:00:00+01:00", timeZone: "Europe/Madrid" },
  end: { dateTime: "2026-11-05T11:00:00+01:00", timeZone: "Europe/Madrid" },
  iCalUID: "review1@google.com",
  sequence: 0,
  attendees: [
    { email: "ana@example.com", displayName: "Ana Example", organizer: true, responseStatus: "accepted" },
    { email: "owner@example.com", self: true, responseStatus: "needsAction" },
  ],
  eventType: "default",
}

const DUPLICATE = {
  error: {
    errors: [{ domain: "global", reason: "duplicate", message: "The requested identifier already exists." }],
    code: 409,
    message: "The requested identifier already exists.",
  },
}
const CONDITION_NOT_MET = {
  error: {
    errors: [
      {
        domain: "global",
        reason: "conditionNotMet",
        message: "Precondition Failed",
        locationType: "header",
        location: "If-Match",
      },
    ],
    code: 412,
    message: "Precondition Failed",
  },
}
const INVALID_ID = {
  error: { errors: [{ domain: "global", reason: "invalid", message: "Invalid resource id value." }], code: 400 },
}
const NOT_FOUND = { error: { errors: [{ domain: "global", reason: "notFound" }], code: 404, message: "Not Found" } }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export interface WriteRequest {
  method: string
  path: string
  query: URLSearchParams
  ifMatch: string | undefined
  body: Record<string, unknown> | undefined
}

/**
 * Google Calendar's event writes over held events. It refuses what Google refuses: an id outside base32hex, a second
 * event with the same id (409), and an If-Match that is not the event's etag (412). A patch replaces arrays and merges
 * objects, as Google's patch does. Anything else goes to `fallback`, the read fake.
 */
export const fakeGoogleWrites = (
  held: Record<string, unknown>[] = [INVITATION],
  fallback?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>,
) => {
  const events = new Map<string, Event>()
  let version = 4_000_000_000_000_000
  const etag = () => `"${version++}"`
  for (const event of held) events.set(event.id as string, structuredClone(event) as Event)
  const requests: WriteRequest[] = []
  const notified: boolean[] = []
  let loseNext = false

  const answered = (response: Response) => {
    if (!loseNext) return response
    loseNext = false
    throw new TypeError("fetch failed")
  }
  const changed = (event: Event) => {
    event.etag = etag()
    event.updated = "2026-10-27T12:00:00.000Z"
    event.sequence = Number(event.sequence ?? 0) + 1
    return event
  }
  const patched = (event: Event, body: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(body)) {
      if (key === "attendeesOmitted") continue
      if (key === "attendees" && body.attendeesOmitted === true && Array.isArray(value)) {
        const attendees = (event.attendees ?? []) as Record<string, unknown>[]
        for (const answer of value as Record<string, unknown>[]) {
          const one = attendees.find(({ email }) => email === answer.email)
          if (one) Object.assign(one, answer)
        }
        continue
      }
      event[key] = isObject(value) && isObject(event[key]) ? { ...event[key], ...value } : value
    }
    return changed(event)
  }

  const fetch = async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(String(input))
    const path = decodeURIComponent(url.pathname.slice(PREFIX.length))
    const method = init.method ?? "GET"
    const headers = (init.headers ?? {}) as Record<string, string>
    const body = typeof init.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : undefined
    const one = path.match(/^calendars\/([^/]+)\/events\/([^/]+)$/u)
    const all = path.match(/^calendars\/([^/]+)\/events$/u)
    const write = method !== "GET"
    if (!(write && (one || all)) && !(method === "GET" && one && events.has(one[2] as string))) {
      if (fallback) return fallback(input, init)
      return json(NOT_FOUND, 404)
    }
    requests.push({ method, path, query: url.searchParams, ifMatch: headers["if-match"], body })
    if (write) notified.push(url.searchParams.get("sendUpdates") === "all")
    if (all && method === "POST") {
      const id = typeof body?.id === "string" ? body.id : `generated${events.size}`
      if (!GOOGLE_ID.test(id)) return json(INVALID_ID, 400)
      if (events.has(id)) return json(DUPLICATE, 409)
      const event: Event = {
        kind: "calendar#event",
        status: "confirmed",
        htmlLink: `https://calendar.google.com/calendar/event?eid=${id}`,
        created: "2026-10-27T12:00:00.000Z",
        iCalUID: `${id}@google.com`,
        sequence: 0,
        organizer: { email: all[1], self: true },
        creator: { email: "owner@example.com", self: true },
        eventType: "default",
        ...body,
        id,
        etag: etag(),
        updated: "2026-10-27T12:00:00.000Z",
      }
      events.set(id, event)
      return answered(json(event))
    }
    const event = events.get(one?.[2] ?? "")
    if (!event) return json(NOT_FOUND, 404)
    if (method === "GET") return json(event)
    if (headers["if-match"] === undefined)
      return json({ error: { code: 400, message: "the fake expects If-Match" } }, 400)
    if (headers["if-match"] !== event.etag) return json(CONDITION_NOT_MET, 412)
    if (method === "DELETE") {
      changed(event).status = "cancelled"
      return answered(new Response(null, { status: 204 }))
    }
    return answered(json(patched(event, body ?? {})))
  }

  return {
    fetch,
    requests,
    notified: () => [...notified],
    event: (id: string) => events.get(id),
    /** Another client changes the event, so the etag a caller holds is old. */
    changeBehind: (id: string) => {
      const event = events.get(id)
      if (event) changed(event)
    },
    /** The next write takes effect, and its answer never arrives. */
    loseNextAnswer: () => {
      loseNext = true
    },
  }
}
