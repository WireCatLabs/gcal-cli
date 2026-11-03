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

gcal is the reference for calendar CLIs. It learned from these, chosen with the owner:
[drive-cli](https://github.com/WireCatLabs/drive-cli) for the Google sign-in, the Google client, the store import and the
command shape; [zoom-cli](https://github.com/WireCatLabs/zoom-cli)
for events and meetings in the store.

## Further answers

- **Records kept:** calendars and calendar entries as source records; events and event series as entities; attendees
  as `email` contacts (WC-DATA-1, WC-DATA-2). All through cli-core's `EventStore`; gcal keeps no tables of its own.
- **Provider:** `registerProvider(store, { name: "google-calendar", kind: "events", aliases: ["gcal", "calendar"],
  command: "gcal" })` on every run that opens the store to write; a read opens it read-only and writes nothing
  (`src/store.ts:15-28`; read in code).
- **Sync:** by change token (`syncToken`), on demand (`gcal <profile> sync`). Occurrences of a series from
  `events.instances` over a window, 1 year back and 3 months ahead, configurable. `410 Gone` lists everything again
  and marks what is missing; nothing is wiped. Token, window and reset: `src/calendar-source.ts:253-270`; series
  slots: `src/calendar-source.ts:284-287`. Tested in `src/calendar-source.test.ts` ("asks for a full list with a
  window…", "a sync token Google refuses with 410 is a reset…", "asks for a series' slots…").
- **Which calendars:** the ones the owner owns sync (`src/calendar-source.ts:204`, tested in
  `src/calendar-source.test.ts` "only the owner's own calendars sync by default"); the others are listed with the
  command that adds them.
- **Deletes at Google:** the entry is marked deleted; a past event stays as history, a future one becomes cancelled
  (WC-DATA-7). The person deletes local data only through cli-core's store commands.
- **Search:** title, description (cleaned), location and attendee names, by words and by meaning. Events appear in
  `search all` and in a person's context. `search events --backend server` asks Google live and saves nothing. Working location,
  focus time, out of office, birthdays and busy-only private events are listed, never searched.
- **Offline:** everything except `session`, `calendars list`, `calendars add`, `calendars busy`, `sync` and
  `search events --backend server`.
- **Links:** attendees join people by address; Telegram, WhatsApp and MAX people only by the owner's
  `people link`; an event joins a Zoom meeting by join key and its other copies by iCalUID; an attached Drive file
  links the event to the stored document. Ambiguous links go to `links review`. Never by name or time alone.
- **Secrets:** tokens in the system keyring through `@wirecat/cli-core/oauth` (WC-SECR), or with
  `--credential-storage file` in a mode-600 file in the state folder where no keyring works. Passcodes, PINs and the
  query string of a join link are never stored.
- **Writes:** creating, changing, moving and deleting events (one occurrence, the series or `--following`), and
  answering an invitation, behind `session start --grant write` and a permission per write (`events.*`). Create,
  update, move and respond are allowed by default and delete asks; mailing attendees, deleting a whole series and a
  rule that ends a series sooner are denied by default. The keys and defaults: `src/config.ts:21-63`; the shared
  defaults come from cli-core's `CALENDAR_WRITE_DEFAULTS`. Read in code; the previews were seen in the 2026-11-02
  review.
- **Feeds:** `calendars add <url>` follows an iCalendar feed as a read-only calendar of the profile's own account
  (cli-core `icsFeeds`, `ics:<random id>`, `accessRole: "reader"`); `sync` reads it after Google. Google's
  [calendarList.insert](https://developers.google.com/workspace/calendar/api/v3/reference/calendarList/insert) takes
  only an existing calendar's `id`, and the Discovery schema's `CalendarListEntry` has no URL or source field, so the
  API documents no way to subscribe a URL (not tried against a live account). The addresses are one keyring entry
  per profile, `feeds:<profile>`, kept where the sign-in is. Verbs `add` and `remove` from the vocabulary (WC-CMD-2).
- **Shared commands:** `mcp` is cli-core's `appMcpCommand` and the first screen and `guide` are cli-core's
  (`scenarios/`). `doctor` is cli-core's `appDoctorCommand` (with `--online`, and the clock,
  `meta.now`, WC-TIME-7, from cli-core 0.562.0), and gcal adds `credential_file` through its `local` option.
  `session list` is gcal's own: cli-core has no helper for a CLI that is not a messenger
  (WC-ACCT-12, NEED-1884). A profile is signed in when its sign-in is in the file or the keyring, not when its account
  file exists: `session end` keeps that file.
- **Command names:** the package installs both `gcal` and `wcat-gcal`, as mail installs `mail` and `wcat-mail`.
  `cli-dev lint` warns `wcat-bin-name` on `gcal`; the owner decided to keep the short name while every CLI still has
  one. `lint/overrides.json` holds that decision with its reason (cli-base 0.75.2 lets it), which silences the warning.
- **Google app:** `--client-file`, then `GCAL_GOOGLE_CLIENT_ID`, then WireCat's Desktop client in
  `google-client.json` at the package root, which the release workflow writes from the `GCAL_GOOGLE_CLIENT_JSON`
  secret (`bin/set-google-client`). A release without the secret carries none. The owner's console steps:
  [google-app-verification.md](google-app-verification.md).

## Open questions for the owner

None.
