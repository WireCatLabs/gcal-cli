# Changelog

Notable changes to `@wirecat/gcal-cli`. One section per version, newest first.

## 0.1.0 — 29.10.2026

The first release of `gcal`, a Google Calendar CLI for the terminal, scripts and AI agents.

### Added

- **`gcal <profile> session start | status | end` signs in to Google in the browser, with read-only Calendar access.**
  It uses your own Google OAuth client for now (`--client-file`, or `GCAL_GOOGLE_CLIENT_ID` and
  `GCAL_GOOGLE_CLIENT_SECRET`); [settings](docs/configuration.md#your-own-google-client) says how to make one. The
  sign-in is kept in the system keyring, or with `--credential-storage file` in a private file (mode 600) where no
  keyring works. `session status --check` asks Google whether the sign-in still works. `--grant write` also asks for
  `calendar.events`, which the event writes need, and `--grant sharing` for `calendar.acls`, which sharing needs.
  `gcal session list` lists the profiles on this computer, each with `signed_in`, `account` and `credential_storage`;
  no command ever picks a profile for you.
- **`gcal <profile> sync` copies your calendars into the local WireCat store, and the read commands work offline.**
  `calendars list | sync | unsync`, `events list | show`, `search`, `people list | link` and `links review | resolve`
  are the WireCat shared calendar commands, so other WireCat tools see the same events and people. The first sync
  reads the calendars you own from a year back to three months ahead; each later one asks Google only for what
  changed. A repeating event's slots are stored one by one, cancelled slots included. `sync --embed` also indexes
  events for search by meaning. Each answer names, under `untrusted`, the fields an invitation's sender wrote, so an
  agent reads them as data.
- **A big sync goes on over several runs.** `sync` stops on its own before its time limit (15 minutes at a terminal,
  45 seconds over MCP; `--timeout` changes it, `--max-pages <n>` lowers the requests to Google further) and saves after
  every page. A partial answer says `state: "partial"`, how far it got, and the command to run next. `--rescan`
  starts every calendar over. `gcal <profile> status` shows each synced calendar's progress, `partial` or `complete`,
  and how long since it last moved.
- **`gcal <profile> calendars busy` shows when calendars and people are taken**, from Google's free/busy answer,
  which says when and never what. `--duration-minutes` lists the stretches free for all of them inside `--hours`
  (09:00-17:00 by default), Monday to Friday; whoever Google will not show is listed in `unknown`. Nothing is stored.
- **`gcal <profile> search --backend server <words>` asks Google Calendar's own search** over the synced calendars.
  It reads only, keeps nothing, and also finds events outside the synced span. `--backend archive`, the local store,
  is the default.
- **`gcal <profile> events create | update | delete | respond` change Google Calendar after
  `session start --grant write`.** Without that grant a write fails with `permission_error` and names the flag. A
  change sends the synced version, so an event changed in Google since is an `event.conflict`, never overwritten. A
  create whose answer was lost ends in `outcome_unknown` with an id; retried with that id, it finds the event.
  `events create --repeat <rule>` makes a repeating event, and `events update --series --repeat <rule>` changes its
  rule. New dates on a timed event make it all-day, and new times make an all-day event timed, keeping its Meet link
  and Drive files. `respond` changes only your own answer. The writes are MCP tools too, with the same options as the
  command line.
- **`gcal api list | show | call`, and one `gcal <profile> api <method>` command per method, reach every Google
  Calendar API v3 method** gcal can serve. They are generated from Google's description of the API, and each answer is
  checked against it. Google's change notifications (`watch`, `channels.stop`) are not offered: they need a public web
  address.
- **Every command and every Google Calendar method has a permission key**, such as `events.create` or
  `api.calendar.events.insert`. A change asks first (`--yes` in a script), sharing a calendar and giving it to another
  account included; over MCP no one answers, so `ask` lets an agent run it. Three keys are `deny` until you allow
  them: `events.notify` (Google mails the attendees), `events.delete.series` (deleting every occurrence of a repeating
  event) and `sharing.notify` (Google mails the person a calendar is shared with). The `api` commands check the same
  keys as the event writes, and an event write also checks its Google method's key, so `permissions.api readonly`
  stops both. Emptying a calendar (`calendars.clear`) is denied, and it is never offered over MCP, nor is `api call`.
  `--dry-run` lists every key a call checks, with its level. A key that names no method is refused, and `gcal doctor`
  lists any saved in the file.
- **A meeting's passcode, PIN, access code and password never leave Google.** They are never stored: a join link is
  kept without its query string, and a line of an event's description or location that names a passcode, a password
  or a PIN is dropped. The `api` commands remove them too, from every answer that holds an event, in the terminal and
  over MCP.
- **`gcal <profile> mcp serve` serves the profile's commands to an agent**, and `mcp add claude-code | codex`,
  `mcp config`, `mcp check`, `mcp revoke` and `mcp server start | stop | status` set it up. `--profiles <names|all>`
  serves several profiles; no profile is ever picked, so `gcal mcp serve` alone lists them and stops. The server
  tells the agent which text other people wrote, and control characters in an answer are shown visibly, so an
  invitation's text cannot hide anything from the agent.
- **`gcal --help` shows what gcal can do and where to start, and `gcal guide` gives step-by-step scenarios**: setting
  up, giving an agent access, finding a time. `gcal skill install` adds the tool's skill for Claude Code, Codex,
  Gemini CLI, OpenClaw and Hermes Agent.
- **`gcal doctor` shows what is set up, with no network and no keyring**: the version, the paths, the store, the OAuth
  client, the profile lock and the sign-in files.
- **`gcal <profile> runs list | show` shows the runs gcal kept**, sign-in and sign-out included: successes for 7 days,
  failures for 30. Secrets are masked; `config set record_input false` keeps none of the words you type.
