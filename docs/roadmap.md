# Roadmap

This page lists what is planned for `gcal` and is not in it yet. Read it before you build a workaround for a missing
feature: it may already be on the way. The order is approximate and can change. To suggest something, open an
[issue on GitHub](https://github.com/WireCatLabs/gcal-cli/issues).

## What works today

`gcal` signs in to your Google account and syncs the calendars you own into the local WireCat store, from a year back
to three months ahead, then only what changed; a big sync goes on over several runs. You can list, show and search
events by words and by meaning, see the people in them and their Drive files, all without the network, and search
Google Calendar itself with `search events --backend server`. `calendars busy` shows when people are taken and the stretches
free for all of them, and `events list changed_at>=<date>` what changed since a date. After `session start --grant write` it creates, changes, moves and deletes events, repeating ones
included, one occurrence, the whole series or "this and all following", moves an event to another calendar, switches
an event between timed and all-day, and answers invitations; a delete asks first. `events remind`, run by cron or a timer, tells you once
about each meeting that starts soon, or runs your own program for it, and `schedule` installs that timer for you.
`events list --source all` lists the events of every signed-in account as one list, and `overlapping:true` finds
meetings that clash. `events prepare` gathers what you need for the next meeting, `events create --text` adds one from
a line of text, and `events export` and `events import` read and write `.ics` files. `calendars add <url>` follows a
calendar published as an `.ics` address, read-only. `search all` searches stored meetings, chats and notes together.
`gcal api` reaches every Google
Calendar API method by name. Every command is in the [command reference](commands.md).

What each released version changed is in the [changelog](../CHANGELOG.md).
