# Changelog

Notable changes to `@wirecat/gcal-cli`. One section per version, newest first.

## 0.1.0 — 27.10.2026

The first release of `gcal`, a Google Calendar CLI for the terminal, scripts and AI agents.

### Added

- **`gcal <profile> session start | status | end` signs in to Google in the browser, with read-only Calendar access.**
  It uses your own Google OAuth client for now (`--client-file`, or `GCAL_GOOGLE_CLIENT_ID` and
  `GCAL_GOOGLE_CLIENT_SECRET`); [settings](docs/configuration.md#your-own-google-client) says how to make one. The
  sign-in is kept in the system keyring. `session status --check` asks Google whether it still works. One Google
  account belongs to one profile.
- **`gcal <profile> sync` copies your calendars into the local WireCat store, and the read commands work offline.**
  `calendars list | sync | unsync`, `events list | show`, `search`, `people list | link` and `links review | resolve`
  are cli-core's shared calendar commands, so other WireCat tools see the same events and people. The first sync
  reads the calendars you own from a year back to three months ahead; each later one asks Google only for what
  changed. `sync --embed` also indexes events for search by meaning. A join link is stored without its query
  string, and a meeting's passcode or PIN is never stored.
- **`gcal <profile> search --remote <words>` asks Google Calendar's own search.** It reads only, keeps nothing, and
  also finds events outside the synced span. The answer names, under `untrusted`, the fields an invitation's sender
  wrote.
- **`gcal api list | show | call`, and one `gcal <profile> api <method>` command per method, reach every Google
  Calendar API v3 method.** They are generated from Google's description of the API, and each answer is checked
  against it. A meeting's passcode, PIN, access code and password never leave Google through them: every event's
  conference entry points lose those fields, links lose their query string, and phone and SIP addresses lose the
  dial sequence. Google's change notifications (`watch`, `channels.stop`) are not offered: they need a public web
  address.
- **Each Google Calendar method has its own permission key, `api.<method>`.** A method that changes Calendar asks
  first (`--yes` in a script), sharing a calendar (`acl`) and `calendars.transferOwnership` included; over MCP no
  one answers, so an agent can change who sees a calendar without a question. `calendars.clear` is denied until you
  allow it and, like `api call`, is never offered over MCP. A key that names no method
  is refused; `gcal doctor` lists any saved in the file, and `gcal <profile> mcp` will not start while one is there.
- **`gcal <profile> events create | update | delete | respond` change Google Calendar after
  `session start --grant write`.** That sign-in also asks Google for `calendar.events`; without it a write fails with
  `permission_error` and names the flag. `--grant sharing` asks for `calendar.acls`, which sharing needs. Each write asks first (`events.create | update | delete | respond` are
  `ask`) and also checks its Google method's key, so `permissions.api readonly` stops it. A change sends the synced
  version, so an event changed in Google since is an `event.conflict`, never overwritten. `--notify` and
  `--no-notify` say whether Google mails the attendees; `events.notify` is `deny` until you allow it, and so is
  deleting a whole series (`events.delete.series`). The writes are MCP tools too, with the same options as the
  command line.
- **`gcal <profile> mcp` serves the profile's commands to an agent.** Control characters in an answer are shown
  visibly, so an invitation's text cannot hide anything from the agent. `gcal skill install` adds the tool's skill for
  Claude Code, Codex, Gemini CLI, OpenClaw and Hermes Agent.
- **`gcal <profile> runs list | show` shows the runs gcal kept, sign-in and sign-out included.** Secrets are masked;
  `config set record_input false` keeps none of the words you type.
