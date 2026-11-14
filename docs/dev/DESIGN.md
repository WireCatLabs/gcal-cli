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
- **Offline:** everything except `session`, `calendars list`, `calendars add`, `calendars busy`, `sync`,
  `meetings sync` and `search events --backend server`. `meetings list` and `meetings show` answer the store alone
  under `--offline`.
- **Links:** attendees join people by address; Telegram, WhatsApp and MAX people only by the owner's
  `people link`; an event joins a Zoom or Google Meet call by join key (`meet:<code>` from the room's link, tested in
  `src/meetings.test.ts` "a synced call links to its calendar entry") and its other copies by iCalUID; an attached Drive file
  links the event to the stored document. Ambiguous links go to `links review`. Never by name or time alone.
- **Secrets:** tokens in the system keyring through `@wirecat/cli-core/oauth` (WC-SECR), or with
  `--credential-storage file` in a mode-600 file in the config folder where no keyring works. Passcodes, PINs and the
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
- **Google app:** `--client-file`, then `GCAL_GOOGLE_CLIENT_ID` (with `GCAL_GOOGLE_CLIENT_SECRET`), then WireCat's
  Desktop app from cli-core's `constants.json`, through cli-core's `googleApp`. `doctor` reports which as
  `oauth_client`. The owner's console steps: [google-app-verification.md](google-app-verification.md).
- **Google Meet is part of gcal** (owner, 2026-11-14): "every meeting has a time, so it fits the calendar". The calls
  are cli-core's
  shared `meetings` group over a Google Meet `MeetingSource` (`src/meet/source.ts`); cli-core's `events list` from the
  same group is left out, since gcal's own `events` lists the same stored events. `summary` and `import` are left out:
  Meet has no summary of its own and no transcript files to import.
- **Meet in the store:** provider `google-meet`, account the Google address, as the calendar's account, so both join by
  address. A conference record is one meeting (`provider_id` the record's id in `sync`, `list` and `show` alike, tested
  in `src/meetings.test.ts` "sync, list and show give a call one id"); its space is the series; the space's
  `meetingUri` gives `join_key = meet:<code>`, which links the call to its calendar entry. A signed-in participant is
  `users/{id}`, the same in every call; a guest or a caller is known by name in one call only. The transcript, the
  recording and the notes are linked by Drive file id (`MeetingSave.documents`); gcal asks for no Drive scope.
- **Meet facts, each from Google's pages, checked 2026-11-13:**
  - `conferenceRecords.list` returns only the calls the account organized
    ([conferences guide](https://developers.google.com/workspace/meet/api/guides/conferences)); `get` and the child
    lists work for owners and participants
    ([artifacts guide](https://developers.google.com/workspace/meet/api/guides/artifacts)).
  - A record and its transcript entries are deleted 30 days after the call
    ([ConferenceRecord](https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords),
    artifacts guide). `meetings sync` names a cursor held 25 days or more in its answer. `doctor` does not: cli-core's
    doctor opens no store, since one can hang (`appDoctorReport` in `@wirecat/cli-core/cli`).
  - A transcript is `STARTED`, `ENDED` or `FILE_GENERATED`
    ([Transcript](https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.transcripts)); a
    sync reads entries only once every transcript of the call is `FILE_GENERATED`, and otherwise leaves the call due.
    Each sync looks two days behind its cursor (`overlapMs`), since the transcript comes after the call.
  - Transcripts are not offered to personal accounts
    ([Use transcripts](https://support.google.com/meet/answer/12849897)); inferred from the editions list, not seen live.
  - `docsDestination.document` is the Docs id, equal to the Drive file id; `driveDestination.file` is the Drive file id
    (artifacts guide).
  - The list filter takes `start_time` in RFC 3339 in double quotes; page size at most 100
    (conferences guide; the discovery document, revision 20261110).
  - Every read takes `meetings.space.readonly`
    ([scopes](https://developers.google.com/workspace/meet/api/guides/authenticate-authorize); discovery document).
- **Meet's contract is generated** from `spec/google/meet.json` (`pnpm spec:sync`, `pnpm generate`), apart from
  Calendar's, into `src/generated/meet/`: its methods stay out of `gcal api`, its permission keys and
  `API_COVERAGE.md`. Meet's paths are `v2/{+name}`, one template for a call and a space, so `scripts/generate.ts`
  takes each method's `flatPath`, which names every id on its own; gcal encodes each id as one segment. Its enums are
  kept as strings, so a value Google adds later does not fail an answer. The methods no command calls are excluded
  with their reason. The requests go through gcal's own `googleApi`, the same as Calendar's.
- **Meet sign-in:** `--grant meetings` adds `meetings.space.readonly`; the default sign-in stays `calendar.readonly`.
  `meetings sync` without the grant is refused before the store opens and before any request (`oauth.scope-missing`,
  grant `meetings`); `list` and `show` answer the store and say Google refused. A new sign-in replaces every scope
  the profile held, so a hint to sign in again names the grants it holds as well (`grants` in the error's details).
- **Rate limits:** a sync stops at Google's first `rate_limited`. The budget gcal hands cli-core's `pull` stops the
  run, so its `stopped` reads `requests`; the answer adds `complete: false` and `retry_after_ms`. Spaces are looked
  up four at a time.
- **A Meet link on an event:** `events create|update --meet` sends `conferenceData.createRequest` with
  `conferenceDataVersion=1` under `calendar.events`
  ([create events, conferencing](https://developers.google.com/workspace/calendar/api/guides/create-events#conferencing)).
  The event's id is the `requestId`; Google ignores a `requestId` it has seen, so a retried write makes one link
  (Discovery `CreateConferenceRequest.requestId`). `update --meet` needs another change: cli-core's update refuses a
  patch with no field, and its fields have no conference yet.
- **Meet rooms** (`src/meet/spaces.ts`, `createSpace`/`updateSpace`): ported, tested against the fake, and not yet a
  command. They wait for cli-core's shared `meetings create|update` with provider settings. Until then gcal asks for
  no `meetings.space.created`.

## Open questions for the owner

None.
