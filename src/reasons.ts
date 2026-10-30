import { defineReasons } from "@wirecat/cli-base/standards"

const ENTRIES: [reason: string, code: string, message: string][] = [
  [
    "sign-in.no-client",
    "configuration_error",
    "no Google OAuth client is set up; pass --client-file or set GCAL_GOOGLE_CLIENT_ID",
  ],
  [
    "sign-in.client-file-open",
    "configuration_error",
    "the OAuth client file can be read by other users of this computer",
  ],
  ["sign-in.client-file-invalid", "configuration_error", "the OAuth client file is not a Desktop app client JSON"],
  ["sign-in.scope-missing", "permission_error", "Google did not grant a permission the sign-in asked for"],
  ["sign-in.lookup-unavailable", "provider_unavailable", "Google did not answer the account lookup"],
  ["sign-in.lookup-refused", "authentication_error", "Google refused the account lookup"],
  ["sign-in.no-email", "authentication_error", "Google did not share a verified email address for this account"],
  ["profile.same-account", "validation_error", "this Google account is already signed in as another profile"],
  ["profile.not-signed-in", "authentication_error", "this profile has no Google sign-in yet"],
  ["calendars.none-synced", "validation_error", "no calendar of this profile syncs yet"],
  ["search.backend-both", "validation_error", "search answers from one backend at a time: archive or server"],
  ["offline.refused", "permission_error", "this command needs Google; --offline was given"],
  ["sign-in.expired", "authentication_error", "Google no longer accepts this profile's sign-in"],
  ["api.unknown-method", "validation_error", "no Google Calendar method has this name"],
  ["api.scope-missing", "permission_error", "the sign-in lacks the Google permission this method needs"],
  ["api.bad-path-id", "validation_error", 'an id in the request\'s address is empty, "." or ".."'],
  [
    "event.not-invited",
    "validation_error",
    "the calendar is not an attendee of the event, so it has no answer to give",
  ],
  ["api.disabled", "configuration_error", "the Google Calendar API is turned off for this OAuth project"],
  ["google.denied", "permission_error", "Google denied the operation to this account"],
  ["google.not-found", "not_found", "Google Calendar has no such item, or this account cannot see it"],
]

export const REASONS = defineReasons(ENTRIES.map(([reason, code, message]) => ({ reason, code, message, details: [] })))
