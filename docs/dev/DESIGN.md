# gcal — design

Written by `npx @wirecat/cli-template new`. The agent reads it first, asks the further questions the reference CLI
does not answer, and starts building only after the owner has read it.

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
  `search all` and in a person's context. `search --remote` asks Google live and saves nothing. Working location,
  focus time, out of office, birthdays and busy-only private events are listed, never searched.
- **Offline:** everything except `session`, `calendars list`, `sync`, `search --remote`, the event writes and `api`.
- **Links:** attendees join people by address; Telegram, WhatsApp and MAX people only by the owner's
  `people link`; an event joins a Zoom meeting by join key and its other copies by iCalUID; an attached Drive file
  links the event to the stored document. Ambiguous links go to `links review`. Never by name or time alone.
- **Secrets:** tokens in the system keyring through `@wirecat/cli-core/oauth` (WC-SECR). Passcodes, PINs and the
  query string of a join link are never stored.
- **Writes:** creating, changing and deleting events, and answering an invitation, behind `session start --grant write`
  and a permission per write (`events.*`); mailing attendees and deleting a whole series are denied by default.
- **Google app:** during development the owner's own client (`GCAL_GOOGLE_CLIENT_ID`, `GCAL_GOOGLE_CLIENT_SECRET`);
  the shared WireCat app gets Calendar after Drive's Google review is approved.

## Open questions for the owner
