# Use it

This page explains how a command is built, and how an agent uses the tool. Read it before your first command.

## The profile comes first

A profile is a name you choose for one account. It is the first word of every command that uses an account:

```sh
gcal personal config show
```

`GCAL_PROFILE=personal` does the same for one shell session. No profile is ever assumed, not even the only one: a
command without one stops with exit code 2 and lists the profiles on this computer.

## Sign in to Google

`session start` opens Google's sign-in page in your browser. Choose the account and allow read access to Calendar:

```sh
gcal personal session start --client-file ~/client_secret.json
```

For now, `gcal` has no Google app of its own, so it needs yours: see
[your own Google client](configuration.md#your-own-google-client). Add `--no-browser` to get the sign-in address on
stderr instead, and open it in any browser on this computer.

One Google account belongs to one profile. Signing in to a profile with another account is refused, and so is a second
profile for the same account.

```sh
gcal personal session status            # what is saved on this computer; no network
gcal personal session status --check    # ask Google whether the sign-in still works
gcal personal session end               # forget the sign-in on this computer
```

`session status` gives the account's email address, the permissions Google granted and `state`: `saved` or
`missing`. With `--check`, `verified: true` means Google accepted the sign-in just now. `session end` removes the
sign-in from the keyring; it keeps which account the profile is, and your stored calendar data.

## Call the Google Calendar API

`gcal api` reaches every method of the Google Calendar API v3 by name, and you need no other command for it. The list
of methods is generated from Google's own description of the API, so `gcal` knows each parameter and each answer:

```sh
gcal api list                                   # every method, whether it changes data, the permission it needs
gcal api show calendar.events.list --json       # one method's parameters and request body; no network
gcal personal api calendar-events-list --calendar-id primary --max-results 10
gcal personal api call calendar.freebusy.query --body '{"timeMin":"2026-11-02T00:00:00Z","timeMax":"2026-11-03T00:00:00Z","items":[{"id":"primary"}]}'
```

`api call` takes the method's name and JSON: `--params` for the parameters in the address, `--body` for the request
body. Each method also has its own command, such as `api calendar-events-list`, with one option per parameter.
`gcal` checks the parameters and Google's answer against that description.

For now, `gcal` reads only. Google gives it read access to Calendar, and nothing more:

- A method that changes Calendar fails with `permission_error`. The permission to write will come later, with
  `session start --grant write`.
- The access-control methods (`calendar.acl.*`) need a permission `gcal` does not ask for, so `acl.list` fails too.
- A method that changes data asks first, and `--yes` answers for a script. Sharing a calendar (`acl`),
  `calendars.clear` (all events of the main calendar) and `calendars.transferOwnership` are refused until you allow
  that method in the profile's [permissions](configuration.md#permissions).
- Google's change notifications (`watch` and `channels.stop`) are not offered. They need a public web address, and
  a program on your computer does not have one.

## Output for scripts

Every command except `mcp` takes `--json`, and prints one JSON value on stdout. Errors are JSON on stderr, with a code to branch
on. The [command reference](commands.md) lists the codes.

## Agents

`gcal skill install` puts the tool's skill where Claude Code, Codex, Gemini CLI and OpenClaw look for it.
`gcal skill install --for hermes` also adds that folder to Hermes Agent's own settings, so a bare `skill install`
leaves Hermes out. `gcal personal mcp` serves the profile's commands over MCP, on stdin and stdout:

```sh
claude mcp add gcal -- gcal personal mcp
```

The server offers every command, the ones that write included. The profile's permissions decide what runs; see
[settings](configuration.md#permissions). Some commands are never offered to an agent: `api call`, and the API
methods that share a calendar (`acl`), empty it (`calendars.clear`) or give it to another account
(`calendars.transferOwnership`). You run those yourself, in a terminal.
