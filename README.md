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

`doctor` needs no profile. Every command that uses an account starts with one, a name you choose: `gcal personal
session status`. Sign-in needs your own Google OAuth client for now; [settings](docs/configuration.md) says how to make
one.

## Documentation

- [Install](docs/installation.md), [use it](docs/usage.md) and the [command reference](docs/commands.md)
- [Settings and permissions](docs/configuration.md), [security](docs/security.md) and
  [when something goes wrong](docs/troubleshooting.md)
- [Roadmap](docs/roadmap.md) and [changelog](CHANGELOG.md)
- To work on `gcal` itself: [design](docs/dev/DESIGN.md) and [testing](docs/dev/TESTING.md)
