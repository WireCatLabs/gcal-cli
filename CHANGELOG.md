# Changelog

Notable changes to `@wirecat/gcal-cli`. One section per version, newest first.

## Unreleased

### Added

- Started from `@wirecat/cli-template` 0.6.0.
- `gcal <profile> session start | status | end`: sign in to Google in the browser with read-only Calendar access,
  through your own Google OAuth client (`--client-file` or `GCAL_GOOGLE_CLIENT_ID` / `GCAL_GOOGLE_CLIENT_SECRET`).
  `session status --check` asks Google whether the sign-in still works. Each run that opens the shared store
  registers the `google-calendar` provider, so other WireCat tools know its events.
- `gcal api list | show | call`, and one `gcal <profile> api <method>` command per method: every Google Calendar API
  v3 method gcal can serve, generated from Google's description of the API. The answers are checked against it.
  The methods that change Calendar fail with `permission_error` until a later `session start --grant write`.
  Google's change notifications (`watch`, `channels.stop`) are left out. `api call`, sharing (`acl`),
  `calendars.clear` and `calendars.transferOwnership` are never offered over MCP.
- Each Google Calendar method has a permission key, `api.<method>`, for `config set permissions.<key>` and
  `mcp --permission`. A method that changes Calendar asks first (`--yes` in a script); sharing, `calendars.clear` and
  `calendars.transferOwnership` are denied until the owner allows that method. A key that names no method is refused,
  and `gcal doctor` lists any saved in the file.

### Fixed

- `session start`, `session status` and `session end` are now kept in the run log, with the Google account lookup as
  a request of the run: `gcal <profile> runs list` shows them. Before, a session run was never recorded.
