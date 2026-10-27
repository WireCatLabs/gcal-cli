# Roadmap

This page lists what is planned for `gcal` and is not in it yet. Read it before you build a workaround for a missing
feature: it may already be on the way. The order is approximate and can change. To suggest something, open an
[issue on GitHub](https://github.com/WireCatLabs/gcal-cli/issues).

## What works today

`gcal` signs in to your Google account and syncs the calendars you own into the local WireCat store, from a year back
to three months ahead, then only what changed. You can list, show and search events by words and by meaning, see the
people in them and their Drive files, all without the network, and search Google Calendar itself with
`search --remote`. After `session start --grant write` it creates, changes and deletes events and answers invitations,
each write asking first. `gcal api` reaches every Google Calendar API method by name. Every command is in the
[command reference](commands.md).

## Next

- **Sign-in without your own Google client.** `gcal` uses WireCat's shared Google app once Google has reviewed it for
  Calendar. Until then, [make your own client](configuration.md#your-own-google-client).
- **A command for when people are free.** Today it is the raw `api calendar-freebusy-query` method.

## Later

- **Repeating events.** `events create` makes one event; a new series is not offered yet.
- **Switching an event between timed and all-day** in one `events update`. Today: delete it and create it again.

What each released version changed is in the [changelog](../CHANGELOG.md).
