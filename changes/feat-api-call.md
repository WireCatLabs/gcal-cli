### Changed — may break callers

- **`gcal events list` and `gcal search events` show the configured `defaults.limit` without `--limit`** (20 unless
  set), as the MCP tools `events_list` and `search_events` do (cli-core 0.664.0, was 0.662.0; cli-base 0.102.0). A
  time option that cannot be read now says `--x takes an ISO 8601 time, today, yesterday, or 30m, 2h, 1d ago`.

### Fixed

- **A generated API command's `--fields` reaches Google beside `--json`.**
  `gcal <profile> api calendar-events-list --calendar-id primary --fields 'items(id,attachments)' --json` failed
  with "--json takes comma-separated field paths". It now sends Google's partial-response mask, as
  `gcal <profile> api call calendar.events.list --params '{"calendarId":"primary","fields":"items(id)"}' --json`
  already did. Neither reads or opens the local store.
