# Changelog

Notable changes to `@wirecat/gcal-cli`. One section per version, newest first.

## Unreleased

### Added

- **Sign in without a Google Cloud project of your own.** `session start` uses WireCat's Google app when the package
  carries one; `gcal doctor` then shows `oauth_client.client: wirecat`. Your own app still wins: `--client-file`, or
  `GCAL_GOOGLE_CLIENT_ID` and `GCAL_GOOGLE_CLIENT_SECRET`. A package without WireCat's app asks for yours, as before.
  Until Google finishes its review of the app, Google shows an "unverified app" page first;
  [connect your Google account](docs/installation.md#connect-your-google-account) says how to go on.
- **All your accounts in one list.** `gcal <profile> events list --source all` lists the events of every Google
  account gcal has stored as one list; `--source gcal:personal,gcal:work` names profiles. The answer names the
  accounts in `meta.accounts`, and says `meta.complete: false` with an issue per account whose sync is missing or
  unfinished. A meeting two accounts hold is listed once. Under `GCAL_PROFILE_LOCK`, `--source` reads only the locked
  profile's account. A profile signed in but never synced is listed too, as an account with no synced calendar.
- **Meetings that overlap.** `events list overlapping:true` lists the meetings whose time overlaps another's, each with
  `overlaps`; with `--source` it compares across accounts. It counts timed meetings that are not cancelled, declined,
  marked free or a working-location block; all-day events and back-to-back meetings never overlap.
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
