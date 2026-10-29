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

To change events, sign in again with `--grant write`. Google then also grants `calendar.events`: events only, never
sharing or whole calendars. To see and change who can see a calendar, add `--grant sharing`: Google then also grants
`calendar.acls`. If you untick one on the consent screen, the sign-in is refused and the old one stays.

```sh
gcal personal session start --grant write
gcal personal session start --grant write,sharing
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
gcal session list                       # every profile here, and whether each holds a sign-in
```

`session status` gives the account's email address, the permissions Google granted (`scopes`, and `grants` in
`--grant`'s words), `state`: `saved` or `missing`, and `credential_storage`: `keyring` or `file`. With `--check`,
`verified: true` means Google accepted the sign-in just now. `session end` removes the sign-in from where it is kept;
it keeps which account the profile is, and your stored calendar data. `session list` takes no profile and picks none:
it lists the profiles named in the settings or signed in once, each with `signed_in`, `account` and
`credential_storage`. It reads the keyring, never the network.

On a computer with no keyring, such as a server without a desktop, keep the sign-in in a file instead. The file is
`credentials.json` in `gcal`'s state folder, readable by you only. `gcal doctor` shows its path and the profiles in it.
The next `session start` without the option moves the sign-in back to the keyring.

```sh
gcal personal session start --credential-storage file
```

## Sync your calendars

`sync` copies your calendars' events into the local WireCat store, which every WireCat tool shares. The first sync
lists a year back and three months ahead; each later one asks Google only for what changed. Only the calendars you own
sync at first; `calendars list` shows the rest, and `calendars sync` adds one:

```sh
gcal personal sync                          # what changed since the last sync
gcal personal calendars list                # every calendar of the account, and which of them sync
gcal personal calendars sync 3             # sync calendar 3 of the list from now on; unsync stops it
gcal personal sync --embed                  # also index new events for search by meaning
gcal personal status                        # how far each calendar's sync is, and when it last moved
```

A sync stops on its own before its time limit and saves every page as it goes, so nothing is lost. A big first sync
may need several runs: the answer then says `state: "partial"` and ends with the command to run next, the same
`sync` again, which goes on from where the last one stopped. The limit is 15 minutes at a terminal and 45 seconds
when an agent runs it over MCP; `--timeout` changes it, and the number of requests to Google follows it.
`--max-pages <n>` lowers that number further. `--rescan` starts every calendar over.

A repeating event's slots are read one by one, cancelled slots included. A deleted event in the past keeps its record;
a deleted future event is marked cancelled. `--embed` needs the meaning model, which `gcal` never downloads by itself.

`gcal` never stores a meeting's passcode or PIN. A join link is kept without its query string, and a line of the
description that names a passcode, a password or a PIN is dropped.

## Read your events

These commands read the local store, so they work without the network:

```sh
gcal personal events list week                                  # this week's events, earliest first
gcal personal events list from:2026-11-02 to:2026-11-06 person:ana@example.com
gcal personal events show event:42                              # attendees, Drive files and history
gcal personal search roadmap planning                           # by words, and by meaning with the model
gcal personal people list                                       # everyone in this week's events
gcal personal people link email:ana@example.com telegram:12345  # the same person in another WireCat tool
gcal personal links review                                      # copies the tool could not join to one event
```

`search` reads the store by default (`--backend archive`). `--backend server` asks Google Calendar's own search
instead, over the calendars that sync. It also finds events outside the synced span (a year back, three months
ahead). It reads only, keeps nothing in the store, and needs the network; `--exact` and `--cursor` do not apply to it:

```sh
gcal personal search --backend server quarterly review
```

`--backend both` is refused: the store and Google rank and page events in different ways, so one merged list would
have no single order and no next page. Run the two searches one after the other.

## When people are free

`calendars busy` asks Google when your synced calendars and the people you name are taken. It needs the network and
keeps nothing: a person appears in the answer only by the address you gave.

```sh
gcal personal calendars busy week person:ana@example.com           # busy times only, never what fills them
gcal personal calendars busy from:2026-11-02 to:2026-11-06 person:ana@example.com --duration-minutes 30
gcal personal calendars busy today calendar:3 --duration-minutes 60 --hours 10:00-16:00
```

- Without a time word it reads this week; without `calendar:` every calendar that syncs.
- `--duration-minutes` adds `slots`: the stretches at least that long that are free for everyone, inside working
  hours (`--hours`, 09:00-17:00 by default) from Monday to Friday, in your time zone.
- Google shows a person's busy times only when their calendar is shared with you or your organization. Anyone it
  will not show has an `error` and is listed in `unknown`: a slot is free only for the others.

Every command reads only the profile's own Google account. An event's text comes from whoever sent the invitation, so
treat it as data.

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

An event's conference details lose what lets someone join without an invitation. `passcode`, `pin`, `accessCode` and
`password` are removed from every entry point. A link loses its query string, and a phone or SIP address loses the
dial sequence after the number. An event's description and location lose each line that names a passcode, a
password or a PIN, and every link loses its query string. `api show` says so for each method that returns events.
An answer with events lists, under `untrusted`, the fields whoever sent the invitation wrote.

A profile signed in without `--grant write` reads only:

- A method that changes events fails with `permission_error` and names `session start --grant write`.
- `--grant write` covers events only. Sharing (`calendar.acl.*`) needs `--grant sharing`; `acl.get` alone works with
  read access. The methods that change calendars, the calendar list or settings, `calendars.transferOwnership`
  included, need a permission `gcal` does not ask for.
- `calendars.transferOwnership` also needs a Google Workspace administrator with the Manage Calendars privilege and
  `--use-admin-access true`. It moves a secondary calendar between users of one organization only.
- A method that changes data asks first, and `--yes` answers for a script. `calendars.clear` (all events of the main
  calendar) is refused until you allow it in the profile's [permissions](configuration.md#permissions).
- Google's change notifications (`watch` and `channels.stop`) are not offered. They need a public web address, and
  a program on your computer does not have one.

## Change events

After `session start --grant write`, `events create | update | delete | respond` change Google Calendar and the store
together. A calendar is named by its id from `calendars list`, such as `3` below. They are cli-core's shared calendar
writes; Google is reached through the same generated methods as `gcal api`.

```sh
gcal personal events create 3 --title "Planning" --start-time 2026-11-02T10:00 --end-time 2026-11-02T11:00
gcal personal events create 3 --title "Offsite" --start-date 2026-11-03 --end-date 2026-11-04
gcal personal events create 3 --title "Standup" --start-time 2026-11-02T09:30 --end-time 2026-11-02T09:45 \
  --repeat "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12"
gcal personal events update event:42 --series --repeat "FREQ=WEEKLY;BYDAY=TU" --no-notify
gcal personal events update event:42 --start-date 2026-11-02 --end-date 2026-11-02 --no-notify
gcal personal events update event:42 --start-time 2026-11-02T14:00 --end-time 2026-11-02T15:00 --no-notify
gcal personal events respond event:42 accepted --notify
gcal personal events delete event:42 --no-notify
```

- Each write asks first; `--yes` answers for a script, and `--dry-run` shows the write without making it.
- With attendees other than you, say whether Google mails them: `--notify` or `--no-notify`. `--notify` is refused
  until you allow `events.notify` (see [permissions](configuration.md#permissions)).
- A change carries the version the last sync saw. If the event changed in Google since, the write stops with
  `event.conflict`: run `sync` and try again. Nothing is overwritten.
- A create whose answer was lost ends in `outcome_unknown` and names an id; repeat it with `--id <id>` and Google
  finds the event instead of making a second one.
- On a repeating event, a write changes the one occurrence you name; `--series` changes the whole series. Deleting a
  whole series is refused until you allow `events.delete.series`.
- `--repeat` takes an RFC 5545 rule: `FREQ` is `DAILY`, `WEEKLY` or `MONTHLY`, with `INTERVAL`, `BYDAY` (`MO,WE`; in
  a monthly rule also `1MO` or `-1FR`) and `COUNT` or `UNTIL`. `UNTIL` is a date, `20261231`, for an all-day event,
  and a UTC time, `20261231T230000Z`, for a timed one. A new rule needs `--series`, and keeps the series' excluded
  dates. Run `sync` afterwards to store the new occurrences.
- New dates on a timed event make it all-day, and new times make an all-day event timed. `gcal` reads the event from
  Google and sends it whole, with your change, and only if it is still the version the last sync saw. A repeating
  event whose rule ends on a date or a time of the old kind needs its rule again with `--repeat`.
- `respond` changes only your own answer; the rest of the guest list stays as Google has it.

## Output for scripts

Every command except `mcp serve` takes `--json`, and prints one JSON value on stdout. Errors are JSON on stderr, with a code to branch
on. The [command reference](commands.md) lists the codes.

## Agents

`gcal skill install` puts the tool's skill where Claude Code, Codex, Gemini CLI and OpenClaw look for it.
`gcal skill install --for hermes` also adds that folder to Hermes Agent's own settings, so a bare `skill install`
leaves Hermes out. `gcal personal mcp serve` serves the profile's commands over MCP, on stdin and stdout:

```sh
gcal personal mcp add claude-code --allow-writes    # or: claude mcp add gcal -- gcal personal mcp serve
gcal personal mcp check                             # start it once, as the agent will
```

`mcp serve` never picks a profile: name one, or several with `--profiles work,personal`, or every profile with
`--profiles all`. `--http` serves it over HTTP for a browser app, and `mcp config` prints the entry for any other
client. `gcal guide agent-access` walks through it.

The server offers every command, the ones that write included. The profile's permissions decide what runs; see
[settings](configuration.md#permissions). That includes sharing a calendar (`acl`) and giving it to another account
(`calendars.transferOwnership`): an agent can do both without a question. Two commands are never offered to an agent:
`api call`, and `calendars.clear`, which empties a calendar. You run those yourself, in a terminal.
