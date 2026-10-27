import { calendarText, joinUrlWithoutQuery } from "@wirecat/cli-core/meetings"

/** The entry-point fields that open a meeting by themselves (Calendar API `ConferenceData.entryPoints[]`). */
const SECRET_FIELDS = new Set(["passcode", "pin", "accessCode", "password"])

/**
 * A web link loses its query and fragment. A phone or SIP address loses its dial sequence: Google's reference puts the
 * PIN there, after a comma or a semicolon (`tel:+12345678900,,,123456789;1234`).
 */
export const entryPointUri = (uri: string): string | null => {
  if (/^https?:/iu.test(uri)) return joinUrlWithoutQuery(uri)
  return uri.split(/[,;?#]/u)[0] || null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const entryPoint = (point: unknown) => {
  if (!isRecord(point)) return point
  const kept = Object.fromEntries(Object.entries(point).filter(([key]) => !SECRET_FIELDS.has(key)))
  if (typeof kept.uri === "string") {
    const uri = entryPointUri(kept.uri)
    if (uri) kept.uri = uri
    else delete kept.uri
  }
  return kept
}

/** Any Google answer, with every event's conference entry points stripped of what lets a stranger join. */
export const withoutConferenceSecrets = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(withoutConferenceSecrets)
  if (!isRecord(value)) return value
  const copy = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withoutConferenceSecrets(item)]))
  const conference = copy.conferenceData
  if (isRecord(conference) && Array.isArray(conference.entryPoints))
    copy.conferenceData = { ...conference, entryPoints: conference.entryPoints.map(entryPoint) }
  return copy
}

/**
 * An event's own text loses the lines that name a passcode, PIN or password, and every link its query string, as the
 * store keeps them. Kept a string, since Google types both fields as one.
 */
const withoutTextSecrets = (event: unknown): unknown => {
  if (!isRecord(event)) return event
  const copy = { ...event }
  for (const field of ["description", "location"])
    if (typeof copy[field] === "string") copy[field] = calendarText(copy[field]) ?? ""
  return copy
}

/** Event fields whose text whoever sent the invitation wrote, as the answer prints them. */
const EVENT_UNTRUSTED = [
  "summary",
  "description",
  "location",
  "attendees.display_name",
  "attendees.comment",
  "organizer.display_name",
  "creator.display_name",
  "attachments.title",
]

/**
 * A Google answer by its response schema: an event or a page of events also loses the secrets in its text, and says
 * which of its fields are untrusted.
 */
export const safeAnswer = (value: unknown, schema: string | undefined): { value: unknown; untrusted?: string[] } => {
  const safe = withoutConferenceSecrets(value)
  if (!isRecord(safe)) return { value: safe }
  if (schema === "CalendarEvent") return { value: withoutTextSecrets(safe), untrusted: EVENT_UNTRUSTED }
  if (schema !== "CalendarEvents") return { value: safe }
  return {
    value: { ...safe, ...(Array.isArray(safe.items) ? { items: safe.items.map(withoutTextSecrets) } : {}) },
    untrusted: ["summary", "description", ...EVENT_UNTRUSTED.map((path) => `items.${path}`)],
  }
}

export const CONFERENCE_SECRETS_NOTE =
  "gcal removes passcode, pin, accessCode and password from every conference entry point, and the query string " +
  "or dial sequence from its uri; from each event's description and location it drops every line that names a " +
  "passcode, PIN or password, and the query string of every link"
