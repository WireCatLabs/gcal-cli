/** What `session start --grant write` adds: events only, never sharing or whole calendars. */
export const EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events"
/** `--grant sharing`: who can see and change a calendar. Not `calendar.calendars`, which also empties and deletes them. */
export const ACLS_SCOPE = "https://www.googleapis.com/auth/calendar.acls"
/** `--grant meetings`: the Google Meet calls, their people, transcripts and Drive files; sensitive, so asked for apart. */
export const MEET_READ_SCOPE = "https://www.googleapis.com/auth/meetings.space.readonly"
/**
 * `--grant write` with `--grant meetings`: create meeting rooms and change the ones gcal made. Not
 * `meetings.space.settings`, which changes the settings of every call of the account.
 */
export const MEET_WRITE_SCOPE = "https://www.googleapis.com/auth/meetings.space.created"

export const GRANTS = ["write", "sharing", "meetings"] as const
export type Grant = (typeof GRANTS)[number]
/** The read scope stays beside it: listing calendars needs it, and `calendar.events` does not cover that. */
export const GRANT_SCOPES: Record<Grant, string> = {
  write: EVENTS_SCOPE,
  sharing: ACLS_SCOPE,
  meetings: MEET_READ_SCOPE,
}

/**
 * Every scope the grants ask for. Meet writes need both words: `write` alone must not reach a second Google service,
 * and `meetings` alone stays read-only.
 */
export const scopesFor = (grants: readonly Grant[]): string[] => [
  ...grants.map((grant) => GRANT_SCOPES[grant]),
  ...(grants.includes("write") && grants.includes("meetings") ? [MEET_WRITE_SCOPE] : []),
]

/** What saved scopes allow, in `--grant`'s words. */
export const grantsOf = (scopes: readonly string[]): Grant[] =>
  GRANTS.filter((grant) => scopes.includes(GRANT_SCOPES[grant]))
