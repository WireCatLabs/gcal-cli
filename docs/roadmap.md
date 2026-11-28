# Roadmap

Before you build a workaround for something `gcal` lacks, check whether it already works or is on the way. To ask
for something, open an [issue on GitHub](https://github.com/WireCatLabs/gcal-cli/issues).

## What works today

- **Sync.** `gcal` signs in to your Google account and copies the calendars you own, and the others you add, into the local WireCat store,
  from a year back to three months ahead, then only what changed. A big sync goes on over several runs.
  `calendars add` follows a calendar published as an `.ics` address, read-only.
- **Read and search without the network.** List, show and search events by words and by meaning, with the people in
  them and their Drive files. `events list --source all` lists every signed-in account as one list,
  `overlapping:true` finds meetings that clash, and `changed_at>=2026-11-01` shows what changed since a date.
  `search events --backend server` searches Google Calendar itself, and `search all` searches meetings, chats and
  notes together.
- **Find a time.** `calendars busy` shows when people are taken and the stretches free for all of them.
- **Change events.** After `session start --grant write`, create, change, move and delete events, repeating ones
  included: one occurrence, the whole series, or this one and all that follow. Switch an event between timed and
  all-day, answer invitations, add a Meet link, and add an event from a line of text. At a terminal a delete asks
  first.
- **Prepare and get reminded.** `events prepare` gathers what you need for the next meeting. `events remind`, on a
  timer that `schedule` installs, tells you once about each meeting that starts soon, or runs your own program for it.
- **Google Meet.** After `session start --grant meetings`, keep and read your Meet calls with who joined, the
  transcript and its Drive files, linked to the calendar event. `meetings create` makes a Meet room.
- **Files.** `events export` and `events import` write and read `.ics` files.
- **The whole API.** `gcal api` reaches every Google Calendar API method by name.

Every command is in the [command reference](commands.md).

## Next

Nothing new is planned yet. Ask for what you miss in an
[issue on GitHub](https://github.com/WireCatLabs/gcal-cli/issues).

What each released version changed is in the [changelog](../CHANGELOG.md).
