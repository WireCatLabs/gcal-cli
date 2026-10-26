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
  ["offline.refused", "permission_error", "this command needs Google; --offline was given"],
]

export const REASONS = defineReasons(ENTRIES.map(([reason, code, message]) => ({ reason, code, message, details: [] })))
