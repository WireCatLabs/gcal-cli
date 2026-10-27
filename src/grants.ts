/** What `session start --grant write` adds: events only, never sharing or whole calendars. */
export const EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events"

export const GRANTS = ["write"] as const
export type Grant = (typeof GRANTS)[number]
/** The read scope stays beside it: listing calendars needs it, and `calendar.events` does not cover that. */
export const GRANT_SCOPES: Record<Grant, string> = { write: EVENTS_SCOPE }

/** What saved scopes allow, in `--grant`'s words. */
export const grantsOf = (scopes: readonly string[]): Grant[] =>
  GRANTS.filter((grant) => scopes.includes(GRANT_SCOPES[grant]))
