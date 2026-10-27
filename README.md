# gcal

`gcal` reads your Google Calendar from the terminal, from scripts and from AI agents. It syncs the calendars you own
into the local WireCat store, and then lists, shows and searches their events, the people in them and their Drive
files, without the network. After `session start --grant write` it also creates, changes and deletes events and
answers invitations; each write asks first, and mailing other people is off until you allow it.

## Quick start

```sh
npm install -g @wirecat/gcal-cli
gcal doctor
gcal personal session start --client-file ~/client_secret.json
gcal personal sync
gcal personal events list week
```

You need Node.js 22.16 or a later 22.x, or 24 or later. `personal` is a profile: a name you choose for one Google
account. Sign-in needs your own Google OAuth client for now; [settings](docs/configuration.md#your-own-google-client)
says how to make one in a few minutes.

## What you can do

- Sync your calendars, then list and show events by time, person or calendar, offline.
- Search events by words, and by meaning with the embedding model; `search --remote` asks Google's own search.
- See who was in a meeting, and link a person to the same person in Telegram, WhatsApp or MAX.
- Create, move and delete events, and accept or decline invitations.
- Call any Google Calendar API v3 method by name with `gcal api`.

## For AI agents

```sh
gcal skill install
claude mcp add gcal -- gcal personal mcp
```

`skill install` teaches Claude Code, Codex, Gemini CLI, OpenClaw or Hermes Agent how to use `gcal`. `mcp` serves the
profile's commands over MCP; the profile's permissions decide what an agent may change. Text from an invitation is
data to the agent, never instructions.

## Why this tool

- Your calendar is on your computer, in the same store as your messages, documents and meetings from the other WireCat
  tools, so an agent can answer "what did we agree with Ana" across all of them.
- Reads need no network after a sync, and a meeting's passcode or PIN is never stored or printed.
- Every write is guarded: it asks first, never overwrites a change made in Google since the last sync, and never
  mails attendees unless you allow it.

## Main features

- Incremental sync: after the first one, `sync` asks Google only for what changed.
- A repeating event's occurrences are stored one by one, cancelled ones included.
- JSON output on every command (`--json`), and errors as JSON with a code to branch on.
- One permission key per command and per Google Calendar method.

## Sign-in and profiles

Each profile is one Google account, and no command ever picks a profile for you. `session start` signs in through the
browser with read-only Calendar access; `session start --grant write` adds access to events. The sign-in is kept in
the system keyring. See [use it](docs/usage.md#sign-in-to-google).

## Settings and permissions

Settings live in one `config.json`; `gcal personal config show` lists them. Permissions decide what each command may
do: event writes ask first, mailing attendees and sharing a calendar are denied until you allow them. See
[settings](docs/configuration.md).

## Limits

- Only the calendars you own sync at first; add others with `calendars sync`.
- A new event never repeats, and an event cannot switch between timed and all-day in one update.
- Google's change notifications (`watch`) are not offered: they need a public web address.
- What is planned is on the [roadmap](docs/roadmap.md).

## Security

`gcal` talks only to Google. Tokens and your OAuth client's secret stay in the system keyring and never appear in
output, logs or run records. See [security](docs/security.md), and report a vulnerability as
[SECURITY.md](SECURITY.md) says.

## When it does not work

Run `gcal doctor` first: it needs no network and shows what is set up. Then see
[when something goes wrong](docs/troubleshooting.md).

## Documentation

- [Install](docs/installation.md), [use it](docs/usage.md) and the [command reference](docs/commands.md)
- [Settings and permissions](docs/configuration.md), [security](docs/security.md) and
  [when something goes wrong](docs/troubleshooting.md)
- [Roadmap](docs/roadmap.md) and [changelog](CHANGELOG.md)

## Development

```sh
pnpm install
pnpm build
pnpm test
pnpm release:check
```

The design is in [docs/dev/DESIGN.md](docs/dev/DESIGN.md), the tests in [docs/dev/TESTING.md](docs/dev/TESTING.md), and
the rules for agents in [AGENTS.md](AGENTS.md).
