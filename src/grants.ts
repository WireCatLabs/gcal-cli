import { CliError } from "@wirecat/cli-base"

/** What `session start --grant write` adds: events only, never sharing or whole calendars. */
export const EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events"
/** `--grant sharing`: who can see and change a calendar. Not `calendar.calendars`, which also empties and deletes them. */
export const ACLS_SCOPE = "https://www.googleapis.com/auth/calendar.acls"
/** `--grant meetings`: the Google Meet calls, their people, transcripts and Drive files; sensitive, so asked for apart. */
export const MEET_READ_SCOPE = "https://www.googleapis.com/auth/meetings.space.readonly"

export const GRANTS = ["write", "sharing", "meetings"] as const
export type Grant = (typeof GRANTS)[number]
/** The read scope stays beside it: listing calendars needs it, and `calendar.events` does not cover that. */
export const GRANT_SCOPES: Record<Grant, string> = {
  write: EVENTS_SCOPE,
  sharing: ACLS_SCOPE,
  meetings: MEET_READ_SCOPE,
}

/** What saved scopes allow, in `--grant`'s words. */
export const grantsOf = (scopes: readonly string[]): Grant[] =>
  GRANTS.filter((grant) => scopes.includes(GRANT_SCOPES[grant]))

/**
 * A grant the sign-in lacks. A new sign-in replaces every scope the profile held, so `grants` names those too: signing
 * in with the missing one alone would take the others away.
 */
export const grantMissing = (grant: Grant, message: string, held: readonly Grant[] = []) =>
  new CliError("permission_error", message, {
    reason: "oauth.scope-missing",
    grant,
    grants: GRANTS.filter((one) => one === grant || held.includes(one)).join(","),
    sent: false,
  })
