# Changelog

Notable changes to `@wirecat/gcal-cli`. One section per version, newest first.

## Unreleased

### Added

- `gcal <profile> search --remote <words>`: Google Calendar's own text search over the profile's synced calendars,
  read only and kept nowhere. It finds events outside the synced span, too. The answer names the fields an
  invitation's sender wrote under `untrusted`.
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
  and `gcal doctor` lists any saved in the file. `gcal <profile> mcp` refuses to start while the file holds one.
- `gcal <profile> sync [--full] [--embed]`, `calendars list | sync | unsync`, `events list | show`, `search`,
  `people list | link` and `links review | resolve`: cli-core's shared calendar commands over Google Calendar, read
  only. `sync` stores the calendars the owner owns from a year back to three months ahead, then asks Google only for
  what changed; a repeating event's slots come one by one, cancelled slots included. Join links lose their query
  string, and passcodes and PINs are never stored. Google's words are stored in cli-core's neutral ones
  (`needs-action`, `out-of-office`, `focus`, `free-busy`). Each command has its own permission key, its path.
- `bin/gcal-live-check <profile> <word>`: the owner's first run against real Google, step by step — sign-in,
  calendars, a sync and a second one that must read only the changes, embedding, search — printing counts only.
  `--dry-run` lists the steps.
- `gcal mcp` shows control characters in an answer visibly, so an invitation's text cannot hide anything from the
  agent.

### Fixed

- `gcal <profile> api …` no longer prints a meeting's passcode, PIN, access code or password. Every event's
  `conferenceData.entryPoints[]` loses those fields; its links lose their query string, and phone and SIP addresses
  lose the dial sequence that carries the PIN. This covers `events.list`, `events.get`, `events.instances` and every
  other answer that holds an event, in the terminal and over MCP. `api show` says so for those methods.
- A calendar command for a profile that never signed in now fails with the registered reason
  `profile.not-signed-in`; it had no entry in the error reasons.
- `session start`, `session status` and `session end` are now kept in the run log, with the Google account lookup as
  a request of the run: `gcal <profile> runs list` shows them. Before, a session run was never recorded.
