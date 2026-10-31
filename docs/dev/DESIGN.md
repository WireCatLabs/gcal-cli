# gcal — design

The owner's answers to the design interview, and the decisions made since. Read it before changing what a command
does, and write each new decision here.

## Answers

- **Category:** calendar
- **Content languages:** en, ru
- **Sign-in:** OAuth in the browser
- **The API:** an official API with an official client library
- **How people filter:** by time, by person, by words in the text
- **Never in the store, a log or the output:** tokens and passwords, one-time codes and passcodes, links that carry a secret
- **Untrusted input:** messages from other people, names and titles set by others, links

## Reference CLI

No calendar CLI exists yet. Chosen with the owner: [drive-cli](https://github.com/WireCatLabs/drive-cli) for the Google
sign-in, the Google client, the store import and the command shape; [zoom-cli](https://github.com/WireCatLabs/zoom-cli)
for events and meetings in the store.

## Content languages

Languages: en, ru.
If this CLI defines a messenger, set its `speechModels` to `parakeet-v3`.

## Further answers

- **Records kept:** calendars and calendar entries as source records; events and event series as entities; attendees
  as `email` contacts (WC-DATA-1, WC-DATA-2). All through cli-core's `EventStore`; gcal keeps no tables of its own.
- **Provider:** `registerProvider(store, { name: "google-calendar", kind: "events", aliases: ["gcal", "calendar"],
  command: "gcal" })` on every run that opens the store.
- **Sync:** by change token (`syncToken`), on demand (`gcal <profile> sync`). Occurrences of a series from
  `events.instances` over a window, 1 year back and 3 months ahead, configurable. `410 Gone` lists everything again
  and marks what is missing; nothing is wiped.
- **Which calendars:** the ones the owner owns sync; the others are listed with the command that adds them.
- **Deletes at Google:** the entry is marked deleted; a past event stays as history, a future one becomes cancelled
  (WC-DATA-7). The person deletes local data only through cli-core's store commands.
- **Search:** title, description (cleaned), location and attendee names, by words and by meaning. Events appear in
  `search all` and in a person's context. `search --backend server` asks Google live and saves nothing. Working location,
  focus time, out of office, birthdays and busy-only private events are listed, never searched.
- **Offline:** everything except `session`, `calendars list`, `calendars busy`, `sync` and `search --backend server`.
- **Links:** attendees join people by address; Telegram, WhatsApp and MAX people only by the owner's
  `people link`; an event joins a Zoom meeting by join key and its other copies by iCalUID; an attached Drive file
  links the event to the stored document. Ambiguous links go to `links review`. Never by name or time alone.
- **Secrets:** tokens in the system keyring through `@wirecat/cli-core/oauth` (WC-SECR), or with
  `--credential-storage file` in a mode-600 file in the state folder where no keyring works. Passcodes, PINs and the
  query string of a join link are never stored.
- **Writes:** creating, changing, moving and deleting events (one occurrence, the series or `--following`), and
  answering an invitation, behind `session start --grant write` and a permission per write (`events.*`). Create,
  update, move and respond are allowed by default and delete asks; mailing attendees, deleting a whole series and a
  rule that ends a series sooner are denied by default.
- **Shared commands:** `mcp` is cli-core's `appMcpCommand` and the first screen and `guide` are cli-core's
  (`scenarios/`). `doctor` is cli-core's `appDoctorReport` plus `credential_file`, which no hook of
  `appDoctorCommand` can add. `session list` is gcal's own: cli-core has no helper for a CLI that is not a messenger
  (WC-ACCT-12, NEED-1884). A profile is signed in when its sign-in is in the file or the keyring, not when its account
  file exists: `session end` keeps that file.
- **Google app:** during development the owner's own client (`GCAL_GOOGLE_CLIENT_ID`, `GCAL_GOOGLE_CLIENT_SECRET`);
  the shared WireCat app gets Calendar after Drive's Google review is approved.

## Open questions for the owner
