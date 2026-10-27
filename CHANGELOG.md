# Changelog

Notable changes to `@wirecat/gcal-cli`. One section per version, newest first.

## Unreleased

### Changed — may break callers

- **`gcal <profile> mcp` is now `gcal <profile> mcp serve`**, cli-core's shared `mcp` for a CLI that is not a messenger
  (WC-MCP-9). An agent entry that runs `gcal personal mcp` stops working: add it again with
  `gcal personal mcp add claude-code --allow-writes`, or print a new one with `gcal personal mcp config`. The group
  also has `mcp revoke`, `mcp server start|stop|status`, `mcp add` and `mcp check`, and `mcp serve` takes `--profiles
  <names|all>`, `--http`, `--port` and `--public-url`. No profile is ever picked: `gcal mcp serve` alone exits 2 and
  lists the profiles. The server's instructions now name the text other people wrote: event titles, descriptions,
  locations, attendee and organizer names, shared calendar names. `api call` and `calendars.clear` are still never
  offered to an agent; sharing is still offered at `ask`; `events.notify` and `sharing.notify` still apply.
- **`doctor` answers with cli-core's shared fields**: `store` (path, and whether it exists), `oauth_client` (`own`
  when `GCAL_GOOGLE_CLIENT_ID` is set, otherwise `null` with the reason; a profile signed in with `--client-file` keeps
  its own client) and `profile_lock`, besides `credential_file` as before.

### Added

- `gcal session list` lists the profiles on this computer, each with `signed_in`, `account` and `credential_storage`.
  It takes no profile and picks none (WC-ACCT-12).
- `gcal guide` lists scenarios — setting up, giving an agent access, finding a time — and `gcal guide <name>` gives
  one, step by step. `gcal --help` shows what gcal can do and where to start.
- `contracts/mcp-catalogue.json` pins every command an agent can find, and whether it reads or writes.
- `sync` stops on its own before its time limit and goes on from there next run, so a big first sync no longer dies at
  the deadline and loses the round. It saves after every page, and a partial answer says `state: "partial"`, how far
  it got (`progress`), the command to run next (`next`: `gcal <profile> sync`, the same flags) and where to watch it
  (`gcal <profile> status`). The limit is 5 minutes at a terminal and 45 s over MCP; the requests to Google are the
  limit, less a margin, divided by 1.5 s (`requestMs`); `--max-pages <n>` lowers them. A page token Google refuses on
  resume (it states no lifetime for one) starts that calendar's round over. cli-core's budgeted calendar sync.
- `gcal <profile> status`: each synced calendar's sync — entries done, `partial` or `complete`, and
  `cursor_age_ms`, which grows while nothing moves it.
- `bin/gcal-live-check` runs `sync` until every calendar is complete, printing progress, at most 40 runs
  (`GCAL_LIVE_SYNC_RUNS`).
- `gcal <profile> calendars busy [today|week|from: to:] [calendar:<id>] [person:<email>]`: Google's free/busy for the
  synced calendars and the people named (`freebusy.query`, which `calendar.readonly` allows). `--duration-minutes`
  adds the stretches free for all of them inside `--hours` (09:00-17:00 by default), Monday to Friday, in the
  computer's time zone; whoever Google will not show is listed in `unknown`. Nothing is stored. cli-core's shared
  command over gcal's `freeBusy`.
- `events create --repeat <rule>` makes a repeating event, and `events update --series --repeat <rule>` changes its
  rule, keeping its excluded dates. The rule is checked before Google sees it; a repeating event's start and end carry
  its time zone, which Google requires.
- `events update` switches an event between timed and all-day: new dates on a timed event, or times on an all-day
  one. gcal reads the event, checks it is the version the last sync saw, and sends it whole with `events.update`,
  keeping its Meet link and Drive files. An event update now also checks `api.calendar.events.update`.
- `gcal <profile> session start --grant write` also asks Google for `calendar.events`; `session status` lists the
  grants. Without it, a write still fails with `permission_error` and names the flag. `--grant sharing` asks for
  `calendar.acls`, which the sharing methods (`calendar.acl.*`) need.
- `gcal <profile> events create | update | delete | respond`: cli-core's shared calendar writes over Google Calendar
  (`events.insert`, `events.patch` and `events.delete` through the generated API). A change sends the synced version
  as `If-Match`, so an event changed in Google since is a conflict, never overwritten. A create retried with the id
  its `outcome_unknown` named finds the event. `--notify` maps to `sendUpdates=all`, `--no-notify` to `none`.
  `respond` changes only the owner's own answer. The writes are MCP tools too.
- Permission keys `events.create | update | delete | respond` (`ask`), `events.notify` and `events.delete.series`
  (`deny`). An event write also checks its Google method's key, `api.calendar.events.insert | patch | delete`, so
  denying `api` stops it.
- `bin/gcal-write-check <profile> <calendar-id>`: the owner's live check of create, update and delete on a test
  calendar.
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
  Google's change notifications (`watch`, `channels.stop`) are left out. `api call` and `calendars.clear` are never
  offered over MCP; sharing (`acl`) and `calendars.transferOwnership` are, so an agent can change who sees a calendar
  without a question.
- Each Google Calendar method has a permission key, `api.<method>`, for `config set permissions.<key>` and
  `mcp --permission`. A method that changes Calendar asks first (`--yes` in a script), sharing and
  `calendars.transferOwnership` included; `calendars.clear` is denied until the owner allows it. A key that names no method is refused,
  and `gcal doctor` lists any saved in the file. `gcal <profile> mcp` refuses to start while the file holds one.
- `gcal <profile> sync [--rescan] [--max-pages <n>] [--embed]`, `calendars list | sync | unsync`, `events list | show`, `search`,
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

- Sharing a calendar through `api calendar-acl-insert | patch | update` or `api call calendar.acl.*` no longer mails
  the person it is shared with unless the new key `sharing.notify` allows it. Google mails them unless
  `sendNotifications` is `false`, and over MCP the sharing methods run without a question. `sharing.notify` is `deny`
  by default: such a call is refused before anything reaches Google, and the refusal says to pass
  `--send-notifications false` or allow the key. gcal never changes the request itself. Removing access
  (`calendar-acl-delete`) mails nobody and needs no new key. `--dry-run` lists `sharing.notify` with its level.
- `gcal config set | unset` lists only the settings gcal uses: the messenger settings (`sends_per_hour`,
  `transcribe_with`, `phone_countries`, `task_*` and the others) are gone, and `gcal skill show` takes no skill name.
  Over MCP, `sync` and `calendars list` run through `gcal_read`, since they only save what they read from Google.
  cli-core 0.468.0.
- Every run is kept in the run log, not only those `--record` asked for: successes for 7 days, failures for 30
  (`keep_successful_runs_for_days`, `keep_runs_for_days`, `runs_size_limit_mb`); `record: false` keeps only failures.
  cli-core 0.467.0.
- `gcal_write` takes the event writes as the command line does (cli-core 0.459.0): `attendee` is a list, so one create
  invites several people; `location` and `description` take `""` to clear them; `notify` is one boolean (`false`
  sends `--no-notify`), and `no_notify` is gone. A write's `entry` names the event's `title`.
- An event id is checked as Google's base32hex (`a-v`, `0-9`) by cli-core too, before the write is journaled.
- `gcal <profile> api …` no longer prints a meeting's passcode, PIN, access code or password. Every event's
  `conferenceData.entryPoints[]` loses those fields; its links lose their query string, and phone and SIP addresses
  lose the dial sequence that carries the PIN. This covers `events.list`, `events.get`, `events.instances` and every
  other answer that holds an event, in the terminal and over MCP. `api show` says so for those methods.
- A calendar command for a profile that never signed in now fails with the registered reason
  `profile.not-signed-in`; it had no entry in the error reasons.
- `session start`, `session status` and `session end` are now kept in the run log, with the Google account lookup as
  a request of the run: `gcal <profile> runs list` shows them. Before, a session run was never recorded.
