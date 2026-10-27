import { joinUrlWithoutQuery } from "@wirecat/cli-core/meetings"

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

export const CONFERENCE_SECRETS_NOTE =
  "gcal removes passcode, pin, accessCode and password from every conference entry point, and the query string " +
  "or dial sequence from its uri"
