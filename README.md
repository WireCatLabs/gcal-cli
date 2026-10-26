# gcal

`gcal` reads your Google Calendar from the terminal, from scripts and from AI agents. It never changes your calendar.
This version signs in to Google; calendars, events and search come next. The design is in
[docs/dev/DESIGN.md](docs/dev/DESIGN.md).

## Quick start

```sh
pnpm install
pnpm build
node dist/bin/gcal.js doctor
node dist/bin/gcal.js personal session start --client-file ~/client_secret.json
```

`doctor` needs no profile. Every command that uses an account starts with one, a name you choose: `gcal personal
session status`. Sign-in needs your own Google OAuth client for now; [settings](docs/configuration.md) says how to make
one.
