# gcal — Google Calendar CLI for AI agents

<p align="center">
  Your Google Calendar in the terminal, searchable on your computer, and ready for Claude Code, Codex, Gemini CLI or any
  agent — within limits you set.
</p>

<p align="center">
  <a href="https://wirecat.dev/en/docs/gcal">Docs</a> ·
  <a href="https://github.com/WireCatLabs/gcal-cli/blob/main/docs/usage.md">Use it</a> ·
  <a href="https://wirecat.dev">WireCat</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@wirecat/gcal-cli"><img src="https://img.shields.io/npm/v/@wirecat/gcal-cli" alt="npm"></a>
  <a href="https://github.com/WireCatLabs/gcal-cli/actions/workflows/main.yml"><img src="https://github.com/WireCatLabs/gcal-cli/actions/workflows/main.yml/badge.svg" alt="CI"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/node/v/@wirecat/gcal-cli" alt="Node"></a>
  <a href="https://bun.sh/"><img src="https://img.shields.io/badge/bun-tested-f9f1e1" alt="Bun"></a>
  <a href="https://www.npmjs.com/package/@wirecat/gcal-cli"><img src="https://img.shields.io/npm/dm/@wirecat/gcal-cli" alt="npm downloads"></a>
  <a href="https://github.com/WireCatLabs/gcal-cli/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="License: Apache 2.0"></a>
</p>

`gcal` copies the calendars you own into the local [WireCat](https://wirecat.dev) store. Then you list, show and search
events, the people in them and their Drive files, with no network. With write access it also creates, changes, moves
and deletes events and answers invitations. A delete asks first. Mailing other people is off until you allow it.

An example conversation (invented people and events, illustrative output):

```text
You:    Use gcal. When can I meet Ana for 30 minutes this week?
Agent:  (runs gcal personal calendars busy person:ana@example.com --duration-minutes 30)
        You both are free on Tuesday 10:00–10:30, Wednesday 14:00–15:00 and Thursday 10:00–12:00.
You:    Book Tuesday, 30 minutes, "Example planning". Do not email her.
Agent:  Draft: "Example planning", Tuesday 10:00–10:30, with ana@example.com, no email sent. Create it?
You:    Yes.
```

## Quick start

You need a Google sign-in client of your own for now. [Make one](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/configuration.md#your-own-google-client)
in Google Cloud Console, as a Desktop app, and save its JSON file as `~/client_secret.json` with `chmod 600`.

```sh
npm install -g @wirecat/gcal-cli
gcal skill install                                            # the agent skill, for Claude Code, Codex and Gemini CLI
gcal personal session start --client-file ~/client_secret.json   # sign in to Google in the browser, read-only
gcal personal sync                                            # copy the calendars you own, then only what changed
gcal personal events list                                     # your events from today on, earliest first
```

`personal` is a profile: a name you choose for one Google account. It is the first word of every command that uses an
account. A first sync lists a year back and three months ahead. A big one goes on over several runs: run `sync` again
when it says `partial`.

You need Node.js 22.16 or a later 22.x, or Node.js 24 or later, on macOS, Linux or Windows. Bun also works. Try it
without installing: `npx @wirecat/gcal-cli --help`. If `gcal` is not found, run `gcal doctor`. It needs no network and
shows what is set up. `gcal guide` gives step-by-step scenarios.

More: [installation](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/installation.md)
([wirecat.dev](https://wirecat.dev/en/docs/gcal/installation)).

## What you can do

**See what is coming.** "Use gcal. What is on my calendar this week?"

```sh
gcal personal events list
```

**Find an event.** "When did we plan the roadmap review?" Search runs on the local copy. It matches words, and meaning
too once you download a model.

```sh
gcal personal search events roadmap planning
```

**Find a time for everyone.** Ask Google when people are busy, and get the stretches free for all of them. Nothing is
stored.

```sh
gcal personal calendars busy person:ana@example.com --duration-minutes 30 --hours 10:00-16:00
```

More:

- Show one event with its attendees, Drive files and history: `gcal personal events show event:42`.
- Link a person to the same person in Telegram, WhatsApp or MAX: `gcal personal people link email:ana@example.com telegram:12345`.
- Create, change and delete events, repeating ones included, and answer invitations. Sign in again with
  `session start --grant write` first.
- Call any Google Calendar API v3 method by name with `gcal api`.

More: [use it](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/usage.md)
([wirecat.dev](https://wirecat.dev/en/docs/gcal/usage)).

## For AI agents

Your agent. Your calendar. Your rules.

- **An agent with a terminal** — Claude Code, Codex, Gemini CLI, OpenClaw or Hermes Agent. It runs `gcal` itself. The
  skill is the agent's instruction sheet: it explains the commands and the limits. `gcal skill install` writes it.
- **An app with no terminal** — Claude Desktop, Cursor and other MCP clients. Connect the profile's MCP server,
  `gcal personal mcp serve`. `gcal personal mcp config` prints the entry to paste.
- **ChatGPT or Claude in a browser** — through your own HTTPS tunnel: `gcal personal mcp serve --http`.

```sh
gcal skill install                               # for Claude Code, Codex, Gemini CLI and OpenClaw
gcal personal mcp add claude-code --allow-writes   # or: codex
gcal personal mcp check                          # start the server once, as the agent will
```

The server offers writing tools, so `mcp add` stops until you pass `--allow-writes`. The profile's permissions decide
what an agent may change; `gcal personal config set permissions.api readonly` keeps it to reads. Text from an invitation
is marked `untrusted`: it is data for the agent, never instructions. Commands that set up the sign-in or the agent link,
`api call` and emptying a calendar are never offered to an agent.

With `--json`, every command prints one JSON value, and an error comes as JSON with a code to branch on.

More: [agents](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/usage.md#agents)
([wirecat.dev](https://wirecat.dev/en/docs/gcal/usage)), [settings and permissions](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/configuration.md#permissions)
([wirecat.dev](https://wirecat.dev/en/docs/gcal/configuration)).

## Why this tool

- **Your calendar is on your computer.** It sits in the same store as the messages, documents and meetings of the other
  WireCat tools. An agent can answer "what did we agree with Ana" across all of them.
- **Reads need no network after a sync.** A meeting's passcode or PIN is never stored or printed.
- **Every write is guarded.** It never overwrites a change made in Google since the last sync. A delete asks first. It
  never mails attendees unless you allow it.
- **Built for agents.** A skill, an MCP server, one JSON form and exit codes a script can branch on.

## Main features

- **Incremental sync.** After the first sync, `sync` asks Google only for what changed. `gcal personal store status`
  shows how far each calendar is.
- **Repeating events.** Each occurrence is stored one by one, cancelled ones included.
- **What changed.** `events list changed_at>=2026-10-25` lists the events that are new, moved or cancelled since a date.
- **Search by meaning.** `gcal models download e5-small` fetches a small model once. `sync --embed` then indexes new
  events with it.
- **Search in Google.** `search events --backend server` asks Google's own search. It also finds events outside the
  synced span. `--backend both` asks the store and Google together.
- **Every Google Calendar method.** `gcal api` reaches each one, under its own permission key.

## Sign-in and profiles

Each profile is one Google account. No command ever picks a profile for you; `gcal session list` lists them.

```sh
gcal personal session start --client-file ~/client_secret.json   # read-only
gcal personal session start --grant write                         # also create, change and delete events
gcal personal session start --grant write,sharing                 # also see and change who can see a calendar
gcal personal session status --check                              # ask Google whether the sign-in still works
```

`GCAL_PROFILE=personal` names the profile for a whole shell session. The sign-in is kept in the system keyring. Where
the keyring fails, `gcal` uses a private file and says so once. It never asks.

More: [sign in](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/usage.md#sign-in-to-google)
([wirecat.dev](https://wirecat.dev/en/docs/gcal/usage)).

## Settings and permissions

Settings live in one `config.json`; `gcal personal config show` lists them. Permissions say what each command may do:
`allow`, `ask`, `readonly` or `deny`.

| Permission | What it covers | Default |
|---|---|---|
| `events.create`, `update`, `move`, `respond` | the event writes that are easy to undo | `allow` |
| `events.delete` | deleting an event | `ask` |
| `events.notify` | Google mails the other attendees | `deny` |
| `events.delete.series` | deleting every occurrence of a repeating event | `deny` |
| `sharing.notify` | Google mails the person a calendar is shared with | `deny` |

Sharing a calendar asks first. Over MCP nobody can answer a question, so `ask` lets a command run. An agent can then
share a calendar without asking you. To stop it, run `gcal personal config set permissions.api.calendar.acl deny`.

```sh
gcal personal config set permissions.api readonly                    # reads only, every method
gcal personal config set permissions.events.create ask               # ask before each new event
gcal personal events create 3 --title 'Example planning' --start-time 2026-11-02T10:00 --end-time 2026-11-02T10:30 --dry-run
```

`--dry-run` shows the permission a command needs and does nothing. `GCAL_READ_ONLY=1` refuses every write.

More: [settings](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/configuration.md)
([wirecat.dev](https://wirecat.dev/en/docs/gcal/configuration)).

## Limits

- Only the calendars you own sync at first. `gcal personal calendars list` shows the rest, and
  `gcal personal calendars sync 3` adds calendar 3.
- `gcal` has no Google app of its own yet. Sign-in needs your own client.
- A Google app in Testing mode ends sign-ins after seven days. Sign in again, or publish the app.
- `calendars busy` shows a person's busy times only when their calendar is shared with you or your organization.
- Google's change notifications (`watch`) are not offered: they need a public web address.

What is planned is on the [roadmap](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/roadmap.md)
([wirecat.dev](https://wirecat.dev/en/docs/gcal/roadmap)).

## Security

- Your event data goes only to Google. The sign-in is kept in the system keyring, or in a file only you can read.
- No command, error, log or run record shows a token or the client secret.
- A meeting's passcode or PIN is never stored. A join link is kept without its query string.
- A write never mails attendees, and a delete never runs unasked, unless you allow it.
- `gcal` refuses an OAuth client file that other users of the computer can read.
- Permissions guard against an agent that a message talked into a change. They do not stop an agent that wants to get
  around them: for that, use a sandbox or a separate user.

More: [security](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/security.md)
([wirecat.dev](https://wirecat.dev/en/docs/gcal/security)). Report a vulnerability as
[SECURITY.md](https://github.com/WireCatLabs/gcal-cli/blob/main/SECURITY.md) says.

## When it does not work

```sh
gcal doctor                        # what is set up; no network, no keyring
gcal personal session status --check   # does Google still accept the sign-in
gcal personal sync --trace         # the connection log, never content
gcal personal runs list            # failed runs are kept
```

More: [when something goes wrong](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/troubleshooting.md)
([wirecat.dev](https://wirecat.dev/en/docs/gcal/troubleshooting)).

## Documentation

Each page is also on [wirecat.dev/en/docs/gcal](https://wirecat.dev/en/docs/gcal). Below are the sources in this
repository.

| Section | Pages |
|---|---|
| Start | [overview](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/index.md) · [installation](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/installation.md) · [use it](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/usage.md) |
| Reference | [all commands](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/commands.md) · [settings and permissions](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/configuration.md) |
| If something is wrong | [when something goes wrong](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/troubleshooting.md) · [security](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/security.md) |
| Project | [roadmap](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/roadmap.md) · [comparison with other tools](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/compare.md) |
| Changes | [CHANGELOG.md](https://github.com/WireCatLabs/gcal-cli/blob/main/CHANGELOG.md) |

For developers: [design](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/dev/DESIGN.md),
[tests](https://github.com/WireCatLabs/gcal-cli/blob/main/docs/dev/TESTING.md) and the rules for agents in
[AGENTS.md](https://github.com/WireCatLabs/gcal-cli/blob/main/AGENTS.md).

## Development

```sh
pnpm install
pnpm lint && pnpm typecheck && pnpm test
pnpm build && pnpm smoke:node          # the built command: the bundle users install
pnpm build && pnpm smoke:bun           # the same under Bun
pnpm generate                          # rewrite the generated files
pnpm release:check                     # every check CI runs
```

The shared part — output streams, error codes, the keyring, the store, search and MCP — lives in
[`@wirecat/cli-base`](https://github.com/WireCatLabs/cli-base) and its sibling library cli-core.

## Part of WireCat

gcal is part of [WireCat](https://wirecat.dev), an open-source, local-first context layer for AI agents.
[tg-cli](https://github.com/WireCatLabs/tg-cli) and [max-cli](https://github.com/WireCatLabs/max-cli) bring Telegram and
MAX into the same local store. Start with one tool. Add more context when you need it. Your context. Any agent.

Questions and setup help: join the [WireCat Discord](https://discord.gg/DebENqbRrJ). Bugs go to this
repository's issues.

## Contributing and license

Pull requests, bug reports and ideas go to [issues](https://github.com/WireCatLabs/gcal-cli/issues).

Apache License 2.0 — [LICENSE](https://github.com/WireCatLabs/gcal-cli/blob/main/LICENSE).
