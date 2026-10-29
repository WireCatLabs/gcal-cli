# Roadmap

This page lists what is planned for `gcal` and is not in it yet. Read it before you build a workaround for a missing
feature: it may already be on the way. The order is approximate and can change. To suggest something, open an
[issue on GitHub](https://github.com/WireCatLabs/gcal-cli/issues).

## What works today

`gcal` signs in to your Google account and syncs the calendars you own into the local WireCat store, from a year back
to three months ahead, then only what changed; a big sync goes on over several runs. You can list, show and search
events by words and by meaning, see the people in them and their Drive files, all without the network, and search
Google Calendar itself with `search --backend server`. `calendars busy` shows when people are taken and the stretches
free for all of them. After `session start --grant write` it creates, changes and deletes events, repeating ones
included, switches an event between timed and all-day, and answers invitations, each write asking first. `gcal api`
reaches every Google Calendar API method by name. Every command is in the [command reference](commands.md).

## Next

- **Moving an event to another calendar.** Today: create it on the other calendar and delete the old one.
- **Changing "this and all following" occurrences of a repeating event.** Today a change applies to one occurrence or
  to the whole series (`--series`).
- **Sign-in without your own Google client.** `gcal` uses WireCat's shared Google app once Google has reviewed it for
  Calendar. Until then, [make your own client](configuration.md#your-own-google-client).

What each released version changed is in the [changelog](../CHANGELOG.md).
