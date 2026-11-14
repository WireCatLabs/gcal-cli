# Changelog

Notable changes to `@wirecat/gcal-cli`. One section per version, newest first.

## 0.27.0 — 14.11.2026

### Changed — may break callers

- **A `readonly` level no longer stops `gcal sync`** (cli-core 0.662.0, was 0.659.0). A command that only fetches
  from Google Calendar into the local store runs at `readonly`; `deny` still refuses it. Commands that write the
  owner's files or call another service stay blocked by `readonly`. A profile that used `readonly` to stop syncing
  sets the key to `deny`.

## 0.26.0 — 14.11.2026

### Changed — may break callers

- **Built on cli-core 0.659.0** (was 0.656.0). See the
  [cli-core changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).

### Fixed

- **A shared config with a small slip is mended when it is read.** `~/.config/WireCat/config.json` with a
  byte-order mark, a comment, a trailing comma or a missing comma between two lines is fixed in place, the old file
  kept beside it as `config.json.bak-<time>`. Other damage names its line, column and the likely fix.

## 0.25.0 — 13.11.2026

### Changed — may break callers

- **Built on cli-core 0.651.0** (was 0.650.0). A stale meeting project fingerprint exits as `conflict` instead of
  `configuration_error`. A profile name in `GCAL_PROFILE` that this computer does not know fails with
  `profile.unknown` and lists the profiles here, as a mistyped first word does, and the message says "no profile
  named" once. The first screen lists `pbx`, the Asterisk tool. What changed is in
  [cli-core's changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).
- **Built on cli-core 0.656.0** (was 0.651.0). See the
  [cli-core changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).

### Fixed

- **Sync runs on a fresh install.** A shared WireCat config (`~/.config/WireCat/config.json`) that could not be
  read (a byte-order mark, broken JSON, a folder in its place, an older `setup` shape) made every WireCat tool
  read-only and refused `sync`. Now only the owner's own "read only" answer limits a tool, and even then a sync runs:
  it only reads the service into the local store (cli-core 0.656.0).

### Security

- **`contracts/wirecat.json` lists the hosts cli-core reaches for gcal**: npm for `upgrade`, and Hugging Face and
  GitHub for the model downloads and the hosts they redirect to. WireCat Desktop shows them before you install gcal.

## 0.24.0 — 13.11.2026

### Added

- **A pull request adds its changelog entries as a fragment, `changes/<branch>.md`.** Open pull requests no longer
  conflict under `## Unreleased`. `pnpm docs:check` checks each fragment, and `bin/release` collects them into the
  version's section. An entry under `## Unreleased` still works during the move.

### Changed — may break callers

- **Built on cli-core 0.650.0** (was 0.615.0). The store moves to version 66 on first open (people ties, person kinds
  and name order; additive). Remote embeddings for meaning search follow memo's "local only" switch (`models
  local-only set on`), send to a plain `http` address only on this computer, and reach only their own host. A profile
  that is not signed in fails with `session.missing` (was `oauth.missing`). A profile name typed as the first word
  that this computer does not know fails with `profile.unknown` and exit code 6, before the command runs, and lists the
  profiles here. `doctor reports show` and `doctor reports create` write a problem report to send; `doctor --help`
  shows its Returns and Example again. `store reset` is no longer offered over MCP. gcal's Google sign-in and store
  opener are now cli-core's. What changed is in
  [cli-core's changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).
- **`search all` no longer lists meetings as an issue when no meeting account is connected**, and `--max-meetings` is
  gone from it.
- **`schedule pause <name>` and `schedule resume <name>`** take a schedule off its timer and keep it; `schedule run`
  still runs it. `--at` repeats: `--at 08:30 --at 18:00` runs twice a day.
- **The sign-in file moves from the state folder to the config folder**, where the other WireCat CLIs keep it. It is
  `credentials.json`, used only where no keyring works or with `--credential-storage file`. The first run that reads
  a sign-in moves the old file, so nobody signs in again. `gcal doctor` shows the new path. A run with moved folders
  now keeps its own sign-in in the keyring entry `gcal-cli:<config folder>`, as
  [security](docs/security.md) always said, not under the state folder.
- **An MCP agent now finds `schedule`, as in every WireCat CLI.** It can list schedules and run one, under the keys
  `schedule.run` and `schedule.exec` (`ask` by default). `mcp.authority` (`deny` by default) still keeps it from
  installing, removing, pausing or resuming one. Before, gcal hid the whole group.

### Fixed

- **`GCAL_READ_ONLY` no longer creates `wirecat.db`.** A read with no store, or with no saved row for the profile,
  now reads an empty store in a temporary folder, as cli-core's CRM commands do, and answers with no events. Under
  the lock, `--source` leaves out a profile that was never opened, since saving its row would be a write.
- **The README said you need a Google app of your own.** Every package carries WireCat's Google app. The quick start
  now signs in with it and points to your own app for when Google refuses it.

## 0.23.0 — 08.11.2026

### Added

- **`gcal <profile> account remove --keep-data|--delete-data`** removes a profile from this computer: it revokes the
  Google sign-in at Google, deletes the saved sign-in and the saved calendar feeds, forgets the profile and its sync
  checkpoints and, with `--delete-data`, deletes the account's calendars and events from the store. `--keep-data`
  leaves them searchable. Other profiles stay as they are, and a running `events remind` stops the removal.
- **`gcal models set` and `gcal models add`** from cli-core 0.609.0: choose the local embedding model every WireCat
  CLI uses, and add one of your own from Hugging Face. A question with a time in it (`HH:MM`, `10:30`) is searched by
  its words again.
- **gcal ships `contracts/wirecat.json`, which says which hosts it talks to.** WireCat Desktop reads it to show you,
  before you install, what gcal touches: `accounts.google.com`, `oauth2.googleapis.com`,
  `openidconnect.googleapis.com` and `www.googleapis.com`, plus the calendar feed (ICS) addresses you add.

### Changed — may break callers

- **gcal now writes the shared store at version 59, and an older WireCat CLI refuses it until it is upgraded.** Run
  `<cli> upgrade` for each WireCat CLI on the same store. From cli-core 0.615.0, whose message templates live in the
  store.

### Security

- **gcal's requests to Google reach only the hosts it declares.** Sign-in, token refresh, the account check and every
  Calendar API call go through cli-base's `hostFetch`. It refuses any other host before a byte is sent, checks each
  redirect, drops the `Authorization` header on a redirect to another site, and gives up after 30 seconds. Calendar
  feeds (ICS) are still read by cli-core, from whatever address you added. From cli-base 0.87.0 (was 0.80.8)
  and cli-core 0.615.0 (was 0.614.0).

## 0.22.0 — 08.11.2026

### Changed — may break callers

- **gcal now writes the shared store at version 57, and an older WireCat CLI refuses it until it is upgraded.**
  Run `<cli> upgrade` for each WireCat CLI on the same store. The other way round matters more: a memo already on
  the new store version stopped this gcal from opening it, and this release reads it again. From cli-core 0.608.0
  (was 0.600.0).
- **`upgrade --offline` and `calendars busy --offline` answer `permission_error` with reason `offline.refused`
  (exit code 5)**, as gcal's own commands that need Google already did. They answered `validation_error` (exit
  code 2) and `busy.offline` before.
- **`events prepare` reads only accounts of the asked account's scope**: a work account no longer brings in a
  linked person's mail or messages from personal accounts, and the other way round.
- **Search treats a `?` at the end of a word as a question mark and a `word:` that is no search field as words.**
  `budget?` finds "budget", and `meeting at 10:30` finds what holds it instead of an empty answer.

### Fixed

- **`ё` and `е` match in names**, so a person or calendar typed with `е` finds the one written with `ё`.
- **The 0.21.0 notes said the guides warn of an "unverified app" page and a limit of 100 users for WireCat's
  Google app.** They do not: the guides say Google may refuse a sign-in through WireCat's app, and that your own app
  always wins and is the way out. The unverified page and the 100-user limit are described for your own app only.

## 0.21.0 — 07.11.2026

### Added

- **`schedule command` and `schedule agent` take `--notify-on always|failures|never` and `--deliver-to <route>`**,
  and `schedule agent` takes `--model` and `--max-cost-per-day`. `schedule list` shows each schedule's `notify` and
  `deliver_to`. From cli-core 0.600.0 (was 0.566.0) and cli-base 0.80.8 (was 0.77.1).
- **`session start --client-id <id>` and the `google_client_id` setting choose your own Google app**:
  `--client-file` or `--client-id`, then `GCAL_GOOGLE_CLIENT_ID`, then the profile's or the defaults'
  `google_client_id`, then WireCat's app. The secret comes from `GCAL_GOOGLE_CLIENT_SECRET`, never the settings file,
  and `session start` warns before the browser opens when your app has none. `doctor` reports `"source": "config"`
  for the defaults' setting. `config set` refuses `google_client_id` to an agent.

### Changed — may break callers

- **A write that Ctrl-C cut short ends as `outcome_unknown` (exit 14), never `cancelled` (exit 130).** Google may
  have carried it out, and a caller told "cancelled" could make the change twice. This covers a stop while the
  request was out and a stop while gcal read the answer. A read keeps `cancelled`.

### Security

- **The `api` commands now also answer to the permission of the `events` command that does the same work.** A call
  through `gcal api` checked only its own `api.*` key, so it could still do what a denied `events` command could not.
  Each events method, reads included, now checks that command's key too, on every path: `--dry-run`, `api show` and
  MCP. An events import through `api` now asks, as `events import` does.

### Fixed

- **A Google call no longer keeps the finished command in memory for 30 seconds.** Its time limit was a timer that
  ran to the end even after Google answered, as tg-cli found. `gcal mcp serve` and `gcal schedule`, which make many
  calls in one process, grew with each call.
- **`mcp serve --permission api.<method>=deny` now stops the event writes that call that method.** `events create`,
  `update`, `delete`, `respond`, `move` and `import` checked their `api.calendar.events.*` keys, and the shared
  calendar keys such as `events.notify`, at the profile's saved levels and ignored the levels the agent's server
  entry set, so an agent could still write. They now use the levels of the run.
- **The Google sign-in notes no longer describe WireCat's review status.** They say that making a shared Google app
  public for Calendar is complex, so Google may refuse the sign-in, and point to your own Google app. No behaviour
  changes.
- **The 0.20.0 notes named two error reasons by their old names.** A misspelled profile answers reason
  `oauth.missing`, not `profile.not-signed-in`, and Google's Calendar usage limit is `provider.usage-limit`, not
  `google.usage-limit`. 0.20.0 already answered these names. Only its notes were wrong.
- **The guides say every package carries WireCat's Google app.** Installation, troubleshooting, the roadmap and
  `session start --help` said releases might not carry it. They now say Google has not verified it yet: Google may
  show an "unverified app" page, and the app allows 100 users in total, shared with drive. Your own app always wins
  and is the way out when that limit is reached.

## 0.20.0 — 05.11.2026

### Changed — may break callers

- **Error reasons use the names cli-core and drive share.** `sign-in.expired` is now `oauth.expired`;
  `sign-in.scope-missing` and `api.scope-missing` are both `oauth.scope-missing`; `profile.not-signed-in` is
  `oauth.missing`; `google.denied` is `access.denied`; `google.not-found` is `item.not-found`; `google.usage-limit` is
  `provider.usage-limit`. `file.*`, `offline.refused`, `api.unknown-method` and `api.disabled` keep their names and
  now come from cli-core.
- **`calendars busy` takes and answers `starts_at` and `ends_at`**, as every event answer does, in place of `start`
  and `end`: `gcal personal calendars busy starts_at>=2026-11-02 ends_at<=2026-11-06`.
- **A sync where one calendar fails answers with the others.** It used to print nothing and fail with
  `sync.partial`. It now saves and prints what the healthy calendars brought, with `meta.complete: false` and a
  `sync.partial` issue for each failed calendar. The exit code is 0.
- **cli-core 0.566.0 and cli-base 0.77.1.** A failure can now be `conflict` (exit 15). `doctor` connects nowhere by default; `doctor --online` connects once and reads the account,
  sending nothing.
- **gcal signs in with WireCat's Google app with no client file and no environment.** 0.19.0 expected a
  `google-client.json` the release workflow wrote from a secret that was missing, so it could not sign in without
  `--client-file`. WireCat's app now comes from cli-core's `constants.json`. The order is unchanged: `--client-file`,
  then `GCAL_GOOGLE_CLIENT_ID` (with `GCAL_GOOGLE_CLIENT_SECRET`), then WireCat's app.
- **`GCAL_GOOGLE_CLIENT_SECRET` without `GCAL_GOOGLE_CLIENT_ID` fails with reason `sign-in.secret-without-id`**
  (was `sign-in.no-client`). `sign-in.no-client` and `sign-in.bundled-client-invalid` are gone: there is always an
  app.
- **`doctor`'s `oauth_client` says where the app comes from:** `{ "client": "wirecat", "source": "constants" }`, or
  `"own"` with `"flag"` or `"env"`.

### Security

- **The published package is the one the checks passed.** The release no longer adds a file to the checked package,
  and the publish step checks its hash again before `npm publish`.
- **The ClawHub dry run in the release gets no sign-in token from GitHub.** It runs ClawHub's own code, so it now
  runs the ClawHub CLI directly, as the real ClawHub step does, without `id-token: write`.
- **The tests of `bin/gcal-live-check` and `bin/gcal-write-check` cannot reach the system keyring.** They started the
  scripts with the owner's D-Bus address; they now pass `DBUS_SESSION_BUS_ADDRESS=disabled:`.
- **`events export --output` writes the file whole and private.** It wrote in place, so an interrupted run left half a
  file, and an existing file kept its old mode, such as 0644, so others on the computer could read your meetings. It
  now writes a new file with mode 0600 and moves it over the old one.

### Added

- **`gcal config migrate` writes each setting the file lacks into `defaults` at its default**, keeping your values,
  their order and keys gcal does not know; a second run changes nothing (cli-core 0.563.0).
- **`gcal config repair`** fixes broken JSON syntax in the settings file and keeps a backup beside it. From cli-core.
- **`gcal doctor --online`** also checks npm for a newer gcal. `doctor` is now cli-core's shared one, with gcal's
  `credential_file` kept, and still answers `meta.now` and the time zone.

### Fixed

- **`events create --text` can be retried safely after a lost answer.** It names an `operation_id`; run the same line
  again with `--operation-id <that id>` and gcal looks for the event that attempt made before adding another.
- **`session start` opens no browser under `--json`, `--no-input` or `CI`.** It prints the address to open instead.
- **A `--dry-run` of an event write shows the Google key it checks**, `api.calendar.events.insert` for a create, under
  `permission.also`, and refuses where the real run would.
- **The calendar commands keep every fact cli-core puts in `meta`.** gcal dropped one that did not fit its own copy
  of the schema; cli-core now prints the answers itself, so gcal's adapter is gone.
- **gcal runs on cli-base 0.75.2.** Its own check for a test that reaches the system keyring moved into cli-base,
  so gcal's copy is gone; the check is the same. `cli-dev lint` no longer warns about the short `gcal` command: the
  decision to keep it beside `wcat-gcal` is now an override with its reason.
- **A misspelled profile lists the profiles you have.** `gcal persona events list` said only "profile persona has no
  Google account yet; run gcal persona session start", which invited a sign-in under the typo. When other profiles
  exist, it now says `no profile named "persona" — profiles here: personal, work` before the sign-in hint, and
  `details.profiles` lists them. The code and reason stay `authentication_error` and `profile.not-signed-in`.
- **Google's Calendar usage limit is no longer called a short rate limit.** Google's `quotaExceeded` said "retry the
  command" and was marked safe to retry; Google's guide points to the usage limits, not a retry. It is now
  `google.usage-limit`, not retryable, and links [Google's error
  guide](https://developers.google.com/workspace/calendar/api/guides/errors).
- **A change only the organizer may make says so.** Google's `forbiddenForNonOrganizer` was "Google denied this
  operation; check access to the calendar". It is now `event.organizer-only`: only the organizer can change this,
  so change only your own copy's fields.
- **The upgrade check reads a store that 0.19.0 wrote.** It started from 0.6.0, so no check covered what 0.7.0 to
  0.19.0 wrote.
- **Reading commands no longer write to the shared store.** `events list`, `events show`, `store status`, `people
  list` and the other reads open the store read-only once the profile is stored, so reads that run at once over MCP
  take no write lock. The first command of a profile, `sync`, the searches and every write still open it to write,
  and save the account and profile rows as before.
- **A calendar list or a series' slots that Google pages without end stop with an error.** A repeated page token,
  or more than 1000 pages, now ends the read with `invalid_response` instead of looping until the time limit.
- **The program gets cli-core's stop signal and gcal's error reasons from the entry, as drive's does.** A crash now
  names gcal's own reasons.
- **The remote guide's commands no longer hold a `<device>.<network>` placeholder.** [Remote use](docs/remote.md)
  writes a labelled example address, the same in every shell, which you replace with your tunnel's.
- **`links review` under `GCAL_PROFILE_LOCK` lists only the locked profile's link choices,** and shows a candidate
  event the profile holds no copy of by its ref alone, so another account's event titles are not shown. Without the
  lock it still lists every account's, and now names them in `meta.accounts`. From cli-core 0.562.0.
- **At a terminal, event times are shown in your computer's time zone, and the last line names it** (`times in
  Europe/Madrid`). `--json` and `--jsonl` keep UTC times. From cli-core 0.562.0.
- **`calendars busy` says when Google did not answer for a calendar or person.** `meta.complete` is false with an
  issue for each one, so free times are no longer shown as certain, and `meta` names `now` and the time zone. From
  cli-core 0.562.0.
- **The first `events list` help example works:** `gcal personal events list 'starts_at:[2026-11-02 TO 2026-11-07}'`.
- **`gcal api` writes use cli-core's permission guard** (`keyedGuard`) instead of a copy, so a fix there reaches them.

## 0.19.0 — 02.11.2026

### Added

- **`wcat gcal` runs the tool, and `wcat --help` lists it.** The package installs `wcat-gcal` beside `gcal`, and
  `wcat-gcal --wcat-describe` prints the tool's name, version and description for `wcat`. `gcal` keeps working.

## 0.18.0 — 02.11.2026

### Added

- **A guide to using `gcal` from ChatGPT or Claude in the browser or on your phone**, `docs/remote.md`: a Tailscale
  Funnel or Cloudflare tunnel, `mcp serve --http --public-url`, the one-time login code, the permissions that hold
  over MCP (`ask` runs, so `--permission api=readonly` or `api.calendar.acl=deny` for this server), running it in the
  background with `mcp server start`, and how to stop it and log every app out with `mcp revoke`. The README, the
  overview, the usage page and the skill link to it.

### Fixed

- **An Outlook or Exchange feed's events are read.** Such feeds name time zones the Windows way
  (`TZID:W. Europe Standard Time`), and `calendars add` and `sync` skipped every timed event of them. They are now read
  in the matching IANA zone (`Europe/Berlin`). From cli-core 0.551.0.
- **`--help` no longer offers `OR` where the query refuses it.** A list that Google filters takes `field:value` terms
  joined by AND, and its `Syntax:` line now says only that (`@wirecat/cli-base` 0.75.0).
- **The browser login page of `mcp serve --http` talks about your calendar.** It said an app asks to reach "your
  messages" through `gcal mcp --http`; it now says "your Google Calendar" and `gcal mcp serve --http`.
- **The roadmap's "What works today" names what 0.11.0–0.17.0 added**: all accounts in one list, overlaps,
  meeting preparation, quick add, `.ics` files, feeds, `search all` and `schedule`.

## 0.17.0 — 02.11.2026

### Added

- **One search over meetings, chats and notes: `gcal <profile> search all <query>`**, as `tg` and `max` have it.
  It reads the store every WireCat tool shares, so your meetings come back beside the messages `tg`, `max` or `wa`
  stored and your notes, best match first, each with its `kind` and `ref`. The answer names every account it read in
  `meta.accounts`, and at a terminal on a `searched:` line. `--only`, `--source`, `--limit`, `--page`, `--exact` and
  `--timezone` work as in the other tools. Meeting transcripts are read only when `--source` names a meeting account,
  and mail stays with `memo search mail`. It reads the local store only, never Google. Agents get it over MCP as a
  read, and `permissions.search.all` can deny it. With `@wirecat/cli-core` 0.548.0 → 0.549.0 and
  `@wirecat/cli-base` 0.73.0 → 0.74.0.
- **`sync` asks a feed whether it changed** (`ETag` / `Last-Modified`), and keeps the stored events when the server
  says nothing changed; the answer's `feeds` then says `unchanged: true`. The first `sync` of a day, and
  `sync --rescan`, read every feed in full.
- **`calendars add` warns once on stderr for an `http://` address**: the feed and any token in its address travel
  unencrypted. It still works.
- [Keep feeds fresh](docs/usage.md#keep-feeds-fresh) gives the timer that runs `sync` every hour beside the reminders
  timer: `gcal personal schedule command feeds --every 1h -- sync`.

### Changed — may break callers

- **`calendars remove` deletes the feed's events** instead of leaving them in `events list` as cancelled: the feed's
  calendar and every event stored from it go, from search too, and the answer's `events` counts them. An event also
  on one of your Google calendars stays. `calendars remove` takes only a feed; `calendars unsync` still stops a Google
  calendar and keeps its events. With `@wirecat/cli-core` 0.546.0 → 0.548.0.

## 0.16.0 — 02.11.2026

### Added

- **Follow an iCalendar feed: `gcal <profile> calendars add <url>`**, such as a public holiday calendar, a sports
  schedule or a colleague's published `.ics` address, as a read-only calendar beside your Google calendars. `sync`
  reads it again each time, and its events show in `events list`, `search events`, `overlapping:true` and
  `events remind`. Repeating events are expanded in their own time zone. A write to a feed's event refuses before
  anything is sent, and `calendars busy` leaves feeds out. The address is kept in the keyring like the sign-in and is
  never printed. `calendars remove` stops following it. Google's API documents no way to add a calendar from a URL, so
  `gcal` reads the feed itself. See [Follow a calendar feed](docs/usage.md#follow-a-calendar-feed).

### Fixed

- A write to a calendar you may only read, such as one shared with you as `reader`, now refuses with
  `calendar.read-only` before it asks or sends anything; Google refused it before.
- The reader of your own `--client-file` comes from `@wirecat/cli-core`, not a copy in gcal. The file shapes, the
  `chmod 600` check and the errors are unchanged.

## 0.15.0 — 02.11.2026

### Added

- **One command installs the meeting reminder timer: `gcal <profile> schedule`**, as `tg` and `mail` have it.
  `gcal personal schedule command reminders --every 5m -- events remind --due-within 10m -- /home/me/bin/remind`
  installs a systemd user timer on Linux, a launchd agent on macOS or a Task Scheduler task on Windows; `schedule
  list`, `run` and `remove` look after it. Installing it does not allow your program: while `events.remind.hook` is
  not `allow`, the command says so and gives the `config set` line. It also says when `--every` is longer than
  `--due-within`, or the program's path is relative. `GCAL_READ_ONLY` refuses `schedule command` and `remove`, and no
  MCP tool offers `schedule`. The cron and hand-written timers stay in
  [Get reminded before a meeting](docs/usage.md#run-it-on-a-timer) for a machine without a systemd user session.

## 0.14.0 — 02.11.2026

### Added

- **Meeting reminders: `gcal <profile> events remind`, for cron or a timer every few minutes**, as gcalcli's `remind`.
  Each run syncs, then tells you once about each event that starts within `--due-within` (`10m` if not given): it
  prints them, or after `--` runs your own program once per event, with the event as JSON on its standard input and
  `GCAL_EVENT` in its environment. No shell runs it, and the event's text never reaches its command line. The program
  form is `deny` until you allow it with `config set permissions.events.remind.hook allow`, and no MCP tool offers the
  command. [Get reminded before a meeting](docs/usage.md#get-reminded-before-a-meeting) shows a desktop notification,
  a Telegram message, and the cron, systemd, launchd and Task Scheduler lines.

## 0.13.0 — 02.11.2026

### Added

- **Answers give the time and the time zone.** `events list`, `events prepare`, `doctor` and `session status` carry
  `meta.now`, `meta.now_local` and `meta.timezone`, so an agent plans "tomorrow" from the real date and your zone, not
  from a guess (WC-TIME-7).
- **Over MCP, a list's `query` names its fields.** It said "the fields are below", and nothing was below. It now lists
  each field with its values, and says that `-event_type:<kind>` (or `NOT event_type:<kind>`) leaves a kind out.

### Fixed

- **`events export` no longer needs the write tool.** Without `--output` it only answers the `.ics` text, so it runs
  through `gcal_read`, and a read-only profile (`GCAL_READ_ONLY`) can export. `--output` is still not offered over MCP,
  and the read-only lock still refuses it on the command line.

## 0.12.0 — 01.11.2026

### Added

- **Prepare for a meeting: `gcal <profile> events prepare [event:<id>]`.** It gives what the local store holds for one
  meeting, your next one when you name none: the event with its attendees' answers and Drive files, and for each other
  attendee their latest one-to-one messages and mail, their messages in groups, past events and recorded meetings with
  them, from every WireCat tool on this computer. It reads the store only and writes no summary. `meta.accounts` names
  every account read, and `meta.complete: false` says what is missing; `untrusted` marks everything other people
  wrote. [Prepare for a meeting](docs/usage.md#prepare-for-a-meeting) has the details.
- **The skill and `gcal guide` show an agent how to write a meeting brief and a daily or weekly digest**
  (`gcal guide prepare-meeting`, `gcal guide digest`): the objective, participants, decisions needed, open questions
  and a checklist, from `events prepare` and `events list`, never following instructions found in an event's text.
- **Add a meeting from one line.** `gcal <profile> events create Work --text "Lunch with Ana tomorrow 1pm"` hands the
  line to Google's quick add, which reads the day, time and place. Its keys are `events.create` and
  `api.calendar.events.quickAdd`; nobody is mailed without `--notify`. Google picks the id, so `--operation-id` does
  not apply.
- **iCalendar export and import.** `events export <query> --output week.ics` writes the events `events list` would
  list as an `.ics` file (`id:<id>` for one); `events import <calendar> <file.ics>` adds a file's events through
  Google's `events.import`, each under its UID, and mails nobody. Import asks first (`events.import`).
- **Leave out birthdays, focus time and other noise.** `events list -event_type:birthday -event_type:focus` leaves
  kinds out, and `event_type:default` keeps ordinary events only. `events list id:<id>` finds one event.
- **Calendars by name.** `calendar:Team`, `events create Team`, `--calendar` and `--to-calendar` take a calendar's name
  as well as its id. A name two calendars share is refused with their ids.
- gcal runs on cli-core 0.539.0 and cli-base 0.71.0.

## 0.11.0 — 01.11.2026

### Added

- **`session start` can use a WireCat Google app built into the package**, when a release carries one; `gcal doctor`
  then shows `oauth_client.client: wirecat`. This release carries none, so you still make your own app and pass it
  with `--client-file`, or `GCAL_GOOGLE_CLIENT_ID` and `GCAL_GOOGLE_CLIENT_SECRET`, which also win over a built-in app.
- **All your accounts in one list.** `gcal <profile> events list --source all` lists the events of every Google
  account gcal has stored as one list; `--source gcal:personal,gcal:work` names profiles. The answer names the
  accounts in `meta.accounts`, and says `meta.complete: false` with an issue per account whose sync is missing or
  unfinished. A meeting two accounts hold is listed once. Under `GCAL_PROFILE_LOCK`, `--source` reads only the locked
  profile's account. A profile signed in but never synced is listed too, as an account with no synced calendar.
- **Meetings that overlap.** `events list overlapping:true` lists the meetings whose time overlaps another's, each with
  `overlaps`; with `--source` it compares across accounts. It counts timed meetings that are not cancelled, declined,
  marked free or a working-location block; all-day events and back-to-back meetings never overlap.
- **A step-by-step guide to making your own Google app.**
  [Make your own Google app](docs/installation.md#make-your-own-google-app) walks through Google Cloud Console: the
  project, the Google Calendar API, Branding, Audience, Data Access with the scopes `gcal` asks for, and a Desktop app
  client. It says when to keep the app in Testing, where a sign-in ends after 7 days, and when to publish it.
  [Sign-in problems](docs/troubleshooting.md#sign-in-problems) lists what Google and `gcal` show when a step was
  missed. The current releases carry no WireCat Google app, so every user makes one.
- gcal runs on cli-core 0.527.0.
- **gcal's MCP server is listed in the official MCP Registry** as `dev.wirecat/gcal-cli`, from the next release on:
  `server.json`, `mcpName`, and the registry jobs from cli-template 0.12.0.

### Fixed

- **The usage guide's raw `api` section now matches 0.7.0**: a write that is easy to undo runs without a question;
  deletes and sharing ask; emptying, deleting or giving away a calendar is refused until you allow it.

## 0.10.0 — 01.11.2026

- gcal now runs on cli-core 0.512.0. Nothing changes for gcal's commands or its MCP server: cli-core 0.512.0 renamed
  `id` to `operation_id` in its own calendar MCP tools, which gcal does not serve. gcal's agents write through
  `gcal_write`, whose `events create` and `events update` already take `operation_id` since 0.9.0, and page
  `events list` through `gcal_read` with `page`.

## 0.9.0 — 31.10.2026

### Changed — may break callers

- **`events create --id` and `events update --following --id` are now `--operation-id`**, the name every WireCat
  write uses for a retry after `outcome_unknown` (WC-CMD-10, WC-OUT-10). The value is the same: the `operation_id`
  the lost write's error names. `--id` is refused as an unknown option; change scripts and agent prompts that pass it.
- **The log of what agents did over `gcal mcp` names the agent that called, not the server** (cli-core 0.509.0): the
  client's own name, such as `claude-code`, where it was always `gcal-mcp`. A filter on `gcal-mcp` no longer finds
  new rows. gcal now runs on cli-core 0.510.0 and cli-base 0.68.1.

### Added

- **`events list --page <n>`**: the next page of stored events. A list with more events than `--limit` (100) says
  `page.next_page`, and its `next` step runs the same query one page on; until now it said `has_more` with no way to
  read further.
- **`search events --backend both`** asks the store and Google Calendar's own search together. The store's matches
  come first, in the store's order, and each one Google also found has `server` in its `found_by`; then the events
  only Google found, earliest first. One page with no cursor: it refuses `--cursor` and `--newest`, and needs the
  network. Before, `both` was offered and always refused.

### Fixed

- **`search events --cursor` help** no longer names `next_offset`, a key the answer does not have; the value comes
  from `page.next_cursor`.

## 0.8.0 — 31.10.2026

### Fixed

- **The keyring's file fallback now comes from cli-base 0.68.0 and cli-core 0.507.0**, with no workaround of gcal's
  own. cli-base fixed the bug gcal worked around: removing the keyring copy after `--credential-storage file` also
  cleared the file. A sign-in in the private file is read from there and its refreshes stay there; the next
  `session start` that reaches the keyring moves it back and removes the file copy. Answers are as in 0.7.0, and the
  keyring warning still comes once per run.

## 0.7.0 — 31.10.2026

### Changed — may break callers

- **A raw `api` write that is easy to undo no longer asks.** `api calendar-events-insert`, `-patch`, `-move`,
  `-quickAdd`, `calendar-calendars-insert` and the other methods that change Calendar without deleting are `allow`,
  as `events create` and `events update` already were. A method that deletes (`calendar.events.delete`,
  `calendar.calendarList.delete`, `calendar.acl.delete`) and sharing a calendar stay `ask`; emptying, deleting or
  giving away a calendar stays `deny`, and `events.notify`, `events.delete.series` and `sharing.notify` still hold on
  every `api` write. To keep the question, set `permissions.api ask`.

### Fixed

- **`session start --help` keeps each option to one short line** (WC-CMD-22). What `--grant write` and
  `--grant sharing` allow, and when to pick `--credential-storage file`, moved below the options.

## 0.6.0 — 31.10.2026

### Added

- **`events list` finds events from their earliest start: `starts_at>=<date>`.** `starts_at` now takes either side
  and a range: `starts_at>=2026-11-02`, `starts_at:[2026-11-02 TO 2026-11-07}`, and `starts_at:2026-11-02` for the
  events of one day. An event that starts exactly at the moment is kept; an all-day event is compared by its date in
  your time zone. In 0.5.0 `starts_at>=…` was refused. `ends_at` is unchanged: an earliest end only, strictly after.

### Changed — may break callers

- **`session start` falls back to a private file when the keyring fails, and never asks.** It used to
  stop with `oauth.not-saved` and tell you to pass `--credential-storage file`. Now it signs in, says once on stderr
  that it used `credentials.json` in the state folder, and answers `credential_storage: "file"`. The flag still
  chooses the file outright; the keyring is still the default and the safer choice. `session status` and
  `session end` no longer answer `keyring: "unreachable"`: the keyring's failure is the stderr warning.
- A run with moved folders names its temporary keyring entry after its state folder, where it used to name it after
  its config folder; a temporary entry an older run left is no longer read. `bin/keyring-dedupe` removes it.
- **`calendars busy` takes the standard field query, and none of its own words.** `today`, `week`, `from:` and `to:`
  are refused. The window is the answer's own `start` and `end`: `from:2026-11-02 to:2026-11-06` is
  `start>=2026-11-02 end<=2026-11-06`, and `today` is `start>=today end<=today`. Without `start` the window starts
  today, without `end` it lasts seven days, so a bare `calendars busy` is still this week. `calendar:` and `person:`
  stay and may still be repeated. Over MCP the input is `query`, no longer `words`. The first screen shows
  `calendars busy --duration-minutes 30`.
- **gcal needs `@wirecat/cli-base` 0.67 and `@wirecat/cli-core` 0.502**, which now build `store status`,
  `search events <query>` and the field queries themselves; the commands, their answers and permission keys are the
  same as in 0.5.0.

## 0.5.0 — 31.10.2026

### Added

- **`calendars list` takes a query**: `synced:`, `primary:` and `access_role:` narrow the list, such as
  `gcal personal calendars list synced:true`.
- **`commands info` describes what each calendar command answers with**, and `--fields` can pick from it.

### Changed — may break callers

- **`gcal search <words>` is now `gcal search events <query>`, and `gcal status` is now `gcal store status`**, the
  shape the other WireCat tools use (max: `search messages <query>`, `store status`). The old paths are gone, with no
  alias. Over MCP the command is `search events`, and its input is `query` (was `words`); a store search's next-page
  step names `query` too. A partial sync's hint points at `store status`. The permission keys move with them:
  `permissions.store.status` and `permissions.search.events`; `permissions.search` still covers the search. A config
  that still sets `permissions.status` is refused with `config.invalid`, which names
  `gcal <profile> config unset permissions.status`.
- **`events list` takes only the standard field query, and none of its own words.** `today`, `week`, `from:`, `to:`,
  `changed:` and `overlapping` are refused. Write the window as fields: `from:2026-11-02 to:2026-11-06` is
  `ends_at>=2026-11-02 starts_at<=2026-11-06`, and `changed:2026-10-25` is `changed_at>=2026-10-25`; `calendar:` and
  `person:` stay. Over MCP the input is `query` (`"ends_at>=2026-11-02"`), no longer `words`. What callers lose:
  - `today` and `week`: write the dates. The query language has `today` but no word for a day ahead, so the end of a
    window is an ISO date.
  - `overlapping` and the `overlaps` field: no standard term asks for events that clash, so the list no longer finds
    them. Compare `starts_at` and `ends_at` of the listed events instead.
  - `starts_at>=…` is refused and names the `ends_at>=…` term to write instead: the store finds events by the moments
    they span, so it can bound only the latest start and the earliest end. An event that ends exactly at the
    `ends_at` moment is left out.
  - Without a time term the list still starts at the beginning of today.
- **Deleting a whole Google calendar and giving it to another account are `deny` by default**, as emptying one is.
  `api.calendar.calendars.delete` and `api.calendar.calendars.transferOwnership` were `ask`, which over MCP runs with no
  question. Set either key to `ask` or `allow` to let it run.
- **`session status` and `session end` answer where no keyring can be reached and no sign-in file is kept.** They
  failed with `oauth.not-saved`. Now `session status` says `state: missing` with `keyring: unreachable`, and
  `session end` says `ended: false` with `keyring: unreachable`: this run can use no sign-in, so there is nothing to
  show or end. A sign-in kept with `--credential-storage file` is read as before. `session start` and the commands that
  call Google still fail with `oauth.not-saved`, which [troubleshooting](docs/troubleshooting.md) explains. A script
  that took the failure to mean "keyring out of reach" reads `keyring` in the answer instead.
- **`people list` takes one event as `event:<id>`.** `gcal personal people list 42` is refused as a word with no
  field; write `people list event:42`. Over MCP the input is `query` (`"event:42"`), no longer `event`.
- **`search --backend server` answers as the shared search does.** Each event's `found_by` is `["server"]` (was
  `["google"]`). The refusals have new reasons: no synced calendar is `search.no-calendars` (was
  `calendars.none-synced`), `--offline` is `search.offline` (was `offline.refused`), `--exact`, `--cursor` or
  `--newest` is `search.server-options`, and `--backend both` is `search.one-backend` (was `search.backend-both`).
- **The calendar commands' help no longer lists `--json` and `--jsonl` under each command**, and their MCP tools no
  longer take `json` or `jsonl` inputs. The global `--json` and `--jsonl` work as before; an agent that sent
  `jsonl: true` was refused.
- **`config show --bot` and `config set|unset --personal|--bot` are hidden.** gcal has no bots, so they had nothing
  behind them. They are still accepted, so a script that passes one keeps working.

### Fixed

- **Calls an agent sends to `gcal mcp serve` at the same time each get their own answer.** Two calendar reads sent
  together could answer one of them empty (`{"item":{"value":null}}`) or fail it with `command.crashed`, because the
  calls shared which command was running and the store it had opened. Each call now keeps its own
  ([WC-ARCH-22](https://github.com/WireCatLabs/cli-base/blob/v0.65.5/docs/standards/architecture.md#wc-arch-22--build-the-command-tree-once-keep-each-calls-state-out-of-it)).
- **An all-day event with no time zone of its own or of its calendar starts at midnight in your computer's time zone.**
  gcal read it as midnight UTC: on a computer in Madrid it started an hour late, and in New York on the evening before.
  Such an event's `timezone` now names the zone it was read in, where it was `null`. An event or calendar that names
  its zone is read in that zone, as before. An event already stored keeps its old start until Google sends it again,
  after it changes
  ([WC-TIME-3](https://github.com/WireCatLabs/cli-base/blob/v0.65.5/docs/standards/time.md#wc-time-3--read-a-time-that-has-no-zone-in-the-zone-in-use-and-say-which-zone-that-was)).

## 0.4.0 — 31.10.2026

### Fixed

- **gcal keeps the shared local store at the same version as the other WireCat tools (store version 40).** The store
  gains the trigram index that notes and documents search uses; gcal has no notes of its own, but an older gcal no
  longer leaves a store written by a newer tool without the index entries it should write.

## 0.3.0 — 31.10.2026

### Added

- **`gcal models list` and `gcal models download <model>` fetch the model that search by meaning uses.** The search's
  hint named `gcal models download e5-small`, which did not exist. The model goes into the folder every WireCat tool
  shares, so one already downloaded by another WireCat tool is used as it is.
- **`events move <event> --to-calendar <id>` moves an event, with its id, to another calendar of the same account.**
  It refuses a calendar you cannot write to, the same calendar, an event Google does not move (focus time, out of
  office, working location, birthdays) and an occurrence without `--series`. Over MCP it is the `events move` command.
- **`events update --following` and `events delete --following` change or delete "this and all following"
  occurrences.** An update ends the series just before the occurrence and starts a new series there with the change,
  keeping the attendees; a delete only ends the series. A series that ends after a number of times needs `--repeat`
  for the new part.
- **`events list changed:<date>` lists what changed since a date**, from the store: each event says `change` (`new`,
  `moved` or `cancelled`) and `changed_at`, and a moved one where it `was`.
- **`events list overlapping` lists the meetings that clash**, each with `overlaps`, the other events. Only events that
  take your time count: not cancelled, not all-day, not declined or marked free.

### Changed — may break callers

- **Creating, changing, moving and answering events go ahead without a question by default.** `events.create`,
  `events.update`, `events.respond` and the new `events.move` are `allow` (were `ask`); a script no longer needs `--yes`
  for them. `events.delete` stays `ask`, `--following` included. To be asked again, set a key to `ask`, such as
  `gcal personal config set permissions.events.create ask`. The `api.calendar.events.*` keys stop the event writes
  once you set them; their built-in `ask` holds for the `api` commands only.
- **A series update whose new rule ends it sooner also needs `events.delete.series`**, which is `deny` by default. A
  new `COUNT`, an earlier `UNTIL`, or a bound on a series that had none removed the later occurrences under
  `events.update` alone.
- **A `sync` where a calendar fails prints nothing on stdout and fails with `sync.partial`.** Its message names each
  failed calendar and its error, `details.calendars` holds every calendar's result (`error` on the failed ones), and
  the error says a retry is safe. The calendars that synced are saved. A sync stopped by its time or request budget
  still answers `state: "partial"` and succeeds.
- **`search` answers a list: the events under `items`, with `page` in cursor mode, as every other list does.** It
  answered one `item` holding `hits`, `has_more` and `untrusted` (WC-OUT-4). A script reads `items` in place of
  `item.hits`, and `page.next_cursor` is the value for `--cursor`. Each event names its own `untrusted` fields, and why
  meaning was not searched is under `missing`. `query` and `by` are gone; each event still says `found_by`.
- **`links review` answers its reviews under `items`, without `accounts: "all"`.** It answered one `item` holding the
  list. Link choices are still kept per store, so every account's reviews are listed.
- **`search --backend server` refuses `--newest`.** Google returns its matches in no stated order and gcal reads only
  the first page of each calendar, so the newest event could be missing from a "newest first" answer. Its matches
  are listed earliest first, and each event's `found_by` is `["google"]`, as a store search writes it.

### Fixed

- **`gcal --help` no longer offers a `--read-only` option, which does not exist.** `GCAL_READ_ONLY=1` is how a run
  refuses every change.
- **`events delete` of an event already deleted at Google succeeds and removes the stored copy.** Google answers such a
  delete with 410, and 404 once it no longer shows the event; gcal failed on both and kept the event in the store
  until the next sync.
- **The daily full sync no longer marks events outside its window as deleted.** Older and later single events, moved
  occurrences and ended series were marked deleted and their events cancelled. A store this damaged heals on its next
  sync.
- **A repeating event moved to another time no longer keeps its occurrences at the old time** after an incremental
  sync.
- **A `sync --rescan` stopped by its budget no longer leaves the calendars it did not reach on incremental rounds.**
- **A create Google made but the store failed to save names the event's id**, so a repeat with `--id` finds it.
- **`sync` writes to the store in far fewer transactions, and the daily full round asks only changed series for their
  occurrences.** `events list` by time and `people list` read the store faster.
- **A refusal from Google for a missing or forbidden item names a reason**: `google.not-found` or `google.denied`,
  so a script can branch on it instead of the message.
- **A sign-in cut short by a timeout or Ctrl-C still closes the store it opened.**
- **`gcal api call --help` no longer shows `Default: [object Object]` for `--params`.** Left out, it still sends no
  parameters.
- **`gcal` starts in about half the time** (`gcal --help`: 0.40 s before, 0.19 s now, on a laptop with Node 24). The
  package ships one bundled program instead of hundreds of modules. A sync also maps each event faster.

### Security

- **`search --backend server` marks the right fields as written by others.** Its `untrusted` list named `title` and
  `location`, while the answer held them under `hits`, so an agent that follows the list did not treat them as data.
  Each event now names `title` and `location` itself.
- **`gcal api` refuses an empty, `.` or `..` id in a request's address** (`api.bad-path-id`). Such an id made the
  address point at another Google endpoint, `calendars/primary/events/..` at the calendar itself; nothing is sent now.
- **`session end` in a run with moved folders keeps the owner's sign-in in the system keyring, and says so.** A run
  with `GCAL_CONFIG_DIR`, `GCAL_STATE_DIR` or a moved `HOME` uses the keyring entry every run of gcal shares; ending
  the session there would have signed the owner out everywhere. It now answers `kept: "keyring"` and says the run is
  still signed in; `ended` is `true` only when the run had a sign-in of its own to remove. A run in the normal folders
  ends the sign-in as before.
- **A sign-in in a run with moved folders no longer replaces the owner's sign-in in the system keyring.** It goes to
  the run's own entry, `gcal-cli:<config folder>`, which the run reads first and its `session end` removes; the run
  otherwise reads the owner's entry and never changes it. So a test sign-in with another Google account can no longer
  switch the owner's profile.

## 0.2.0 — 30.10.2026

### Added

- **The `gcal-cli` skill is published on ClawHub as `wirecat-gcal` after each release, and tells OpenClaw that it
  needs `gcal` and how to install it** (`metadata.openclaw`: `requires.bins` and the npm package `@wirecat/gcal-cli`).
  With `gcal` missing from PATH, OpenClaw marks the skill not ready and offers to install the package. Claude Code and
  Codex ignore the block.

## 0.1.1 — 29.10.2026

### Fixed

- **The agent guide's header (`skills/gcal-cli/SKILL.md`) is valid YAML again.** Its `description` held
  `Calendar: sync`, which a YAML parser reads as a nested mapping, so strict skill loaders and the WireCat site's
  skills index refused the file. The text is unchanged apart from a dash in place of that colon.

## 0.1.0 — 29.10.2026

### Added

- **`gcal <profile> session start | status | end` signs in to Google in the browser, with read-only Calendar access.**
  It uses your own Google OAuth client for now (`--client-file`, or `GCAL_GOOGLE_CLIENT_ID` and
  `GCAL_GOOGLE_CLIENT_SECRET`); [settings](docs/configuration.md#your-own-google-client) says how to make one. The
  sign-in is kept in the system keyring, or with `--credential-storage file` in a private file (mode 600) where no
  keyring works. `session status --check` asks Google whether the sign-in still works. `--grant write` also asks for
  `calendar.events`, which the event writes need, and `--grant sharing` for `calendar.acls`, which sharing needs.
  `gcal session list` lists the profiles on this computer, each with `signed_in`, `account` and `credential_storage`;
  no command ever picks a profile for you.
- **`gcal <profile> sync` copies your calendars into the local WireCat store, and the read commands work offline.**
  `calendars list | sync | unsync`, `events list | show`, `search`, `people list | link` and `links review | resolve`
  are the WireCat shared calendar commands, so other WireCat tools see the same events and people. The first sync
  reads the calendars you own from a year back to three months ahead; each later one asks Google only for what
  changed. A repeating event's slots are stored one by one, cancelled slots included. `sync --embed` also indexes
  events for search by meaning. Each answer names, under `untrusted`, the fields an invitation's sender wrote, so an
  agent reads them as data.
- **A big sync goes on over several runs.** `sync` stops on its own before its time limit (15 minutes at a terminal,
  45 seconds over MCP; `--timeout` changes it, `--max-pages <n>` lowers the requests to Google further) and saves after
  every page. A partial answer says `state: "partial"`, how far it got, and the command to run next. `--rescan`
  starts every calendar over. `gcal <profile> status` shows each synced calendar's progress, `partial` or `complete`,
  and how long since it last moved.
- **`gcal <profile> calendars busy` shows when calendars and people are taken**, from Google's free/busy answer,
  which says when and never what. `--duration-minutes` lists the stretches free for all of them inside `--hours`
  (09:00-17:00 by default), Monday to Friday; whoever Google will not show is listed in `unknown`. Nothing is stored.
- **`gcal <profile> search --backend server <words>` asks Google Calendar's own search** over the synced calendars.
  It reads only, keeps nothing, and also finds events outside the synced span. `--backend archive`, the local store,
  is the default.
- **`gcal <profile> events create | update | delete | respond` change Google Calendar after
  `session start --grant write`.** Without that grant a write fails with `permission_error` and names the flag. A
  change sends the synced version, so an event changed in Google since is an `event.conflict`, never overwritten. A
  create whose answer was lost ends in `outcome_unknown` with an id; retried with that id, it finds the event.
  `events create --repeat <rule>` makes a repeating event, and `events update --series --repeat <rule>` changes its
  rule. New dates on a timed event make it all-day, and new times make an all-day event timed, keeping its Meet link
  and Drive files. `respond` changes only your own answer. The writes are MCP tools too, with the same options as the
  command line.
- **`gcal api list | show | call`, and one `gcal <profile> api <method>` command per method, reach every Google
  Calendar API v3 method** gcal can serve. They are generated from Google's description of the API, and each answer is
  checked against it. Google's change notifications (`watch`, `channels.stop`) are not offered: they need a public web
  address.
- **Every command and every Google Calendar method has a permission key**, such as `events.create` or
  `api.calendar.events.insert`. A change asks first (`--yes` in a script), sharing a calendar and giving it to another
  account included; over MCP no one answers, so `ask` lets an agent run it. Three keys are `deny` until you allow
  them: `events.notify` (Google mails the attendees), `events.delete.series` (deleting every occurrence of a repeating
  event) and `sharing.notify` (Google mails the person a calendar is shared with). The `api` commands check the same
  keys as the event writes, and an event write also checks its Google method's key, so `permissions.api readonly`
  stops both. Emptying a calendar (`calendars.clear`) is denied, and it is never offered over MCP, nor is `api call`.
  `--dry-run` lists every key a call checks, with its level. A key that names no method is refused, and `gcal doctor`
  lists any saved in the file.
- **A meeting's passcode, PIN, access code and password never leave Google.** They are never stored: a join link is
  kept without its query string, and a line of an event's description or location that names a passcode, a password
  or a PIN is dropped. The `api` commands remove them too, from every answer that holds an event, in the terminal and
  over MCP.
- **`gcal <profile> mcp serve` serves the profile's commands to an agent**, and `mcp add claude-code | codex`,
  `mcp config`, `mcp check`, `mcp revoke` and `mcp server start | stop | status` set it up. `--profiles <names|all>`
  serves several profiles; no profile is ever picked, so `gcal mcp serve` alone lists them and stops. The server
  tells the agent which text other people wrote, and control characters in an answer are shown visibly, so an
  invitation's text cannot hide anything from the agent.
- **`gcal --help` shows what gcal can do and where to start, and `gcal guide` gives step-by-step scenarios**: setting
  up, giving an agent access, finding a time. `gcal skill install` adds the tool's skill for Claude Code, Codex,
  Gemini CLI, OpenClaw and Hermes Agent.
- **`gcal doctor` shows what is set up, with no network and no keyring**: the version, the paths, the store, the OAuth
  client, the profile lock and the sign-in files.
- **`gcal <profile> runs list | show` shows the runs gcal kept**, sign-in and sign-out included: successes for 7 days,
  failures for 30. Secrets are masked; `config set record_input false` keeps none of the words you type.
