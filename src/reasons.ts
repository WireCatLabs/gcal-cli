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
  ["sign-in.scope-missing", "permission_error", "Google did not grant read access to Calendar"],
  ["sign-in.lookup-unavailable", "provider_unavailable", "Google did not answer the account lookup"],
  ["sign-in.lookup-refused", "authentication_error", "Google refused the account lookup"],
  ["sign-in.no-email", "authentication_error", "Google did not share a verified email address for this account"],
  ["profile.same-account", "validation_error", "this Google account is already signed in as another profile"],
  ["profile.not-signed-in", "authentication_error", "this profile has no Google account yet; run session start"],
  ["calendars.none-synced", "validation_error", "no calendar of this profile syncs yet"],
  ["offline.refused", "permission_error", "this command needs Google; --offline was given"],
  ["sign-in.expired", "authentication_error", "Google no longer accepts this profile's sign-in"],
  ["api.unknown-method", "validation_error", "no Google Calendar method has this name"],
  ["api.scope-missing", "permission_error", "the sign-in lacks the Google permission this method needs"],
  ["api.disabled", "configuration_error", "the Google Calendar API is turned off for this OAuth project"],
]

export const REASONS = defineReasons(ENTRIES.map(([reason, code, message]) => ({ reason, code, message, details: [] })))
