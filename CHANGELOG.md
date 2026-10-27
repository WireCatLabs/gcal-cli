# Changelog

Notable changes to `@wirecat/gcal-cli`. One section per version, newest first.

## Unreleased

### Added

- Started from `@wirecat/cli-template` 0.6.0.
- `gcal <profile> session start | status | end`: sign in to Google in the browser with read-only Calendar access,
  through your own Google OAuth client (`--client-file` or `GCAL_GOOGLE_CLIENT_ID` / `GCAL_GOOGLE_CLIENT_SECRET`).
  `session status --check` asks Google whether the sign-in still works. Each run that opens the shared store
  registers the `google-calendar` provider, so other WireCat tools know its events.

### Fixed

- `session start`, `session status` and `session end` are now kept in the run log, with the Google account lookup as
  a request of the run: `gcal <profile> runs list` shows them. Before, a session run was never recorded.
