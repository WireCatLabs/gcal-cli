import { defineReasons } from "@wirecat/cli-base/standards"

/** gcal's own reasons; the shared ones (`oauth.*`, `api.*`, `file.*`, `offline.refused`) are cli-core's. */
const ENTRIES: [reason: string, code: string, message: string][] = [
  [
    "sign-in.no-client",
    "configuration_error",
    "no Google OAuth client is set up; pass --client-file or set GCAL_GOOGLE_CLIENT_ID",
  ],
  ["sign-in.bundled-client-invalid", "configuration_error", "the WireCat Google client in this package is damaged"],
  ["sign-in.lookup-unavailable", "provider_unavailable", "Google did not answer the account lookup"],
  ["sign-in.lookup-refused", "authentication_error", "Google refused the account lookup"],
  ["sign-in.no-email", "authentication_error", "Google did not share a verified email address for this account"],
  ["profile.same-account", "validation_error", "this Google account is already signed in as another profile"],
  ["api.bad-path-id", "validation_error", 'an id in the request\'s address is empty, "." or ".."'],
  [
    "event.not-invited",
    "validation_error",
    "the calendar is not an attendee of the event, so it has no answer to give",
  ],
  ["event.organizer-only", "permission_error", "only the event's organizer can change these fields"],
]

export const REASONS = defineReasons(ENTRIES.map(([reason, code, message]) => ({ reason, code, message, details: [] })))
