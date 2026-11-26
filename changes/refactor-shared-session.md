### Changed — may break callers

- **gcal runs on cli-core 2.0** (cli-core 2.0.0, was 1.0.0). cli-core 2.0 moves the message store to version 78 the
  first time it opens it: an AI agent is `agent:<id>` and a sender bot is `bot:<id>`. After that, only tools on
  cli-core 2.0 open the store. Watch for: upgrade every installed WireCat CLI to its 2.0 release first, and stop
  `serve`, `mcp` and every sync while the store migrates. See
  [cli-core's changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).
- **`gcal <profile> session` is cli-core's shared sign-in command** (`oauthSessionCommand`), the same as drive and
  every WireCat CLI that signs in in the browser. Nobody signs in again: the sign-in stays where gcal kept it,
  `oauth:google:<profile>`, and a sign-in file an older gcal left in the state folder still moves to the config
  folder on the first run. `--grant`, `--client-file`, `--client-id`, `--credential-storage` and `--no-browser` work
  as before, and a sign-in that leaves Calendar or an asked grant unticked is still refused before it is kept. What
  changes for a caller of the JSON:
  - `session list` rows are `{"profile","signed_in","state"}`, with `state` `saved`, `missing` or `unknown`. A row
    loses `account` and `credential_storage`. When the keyring cannot be reached, a row says `signed_in: null` and
    `state: "unknown"` in place of an `error` field.
  - `session status` answers `profile`, `state`, `scopes`, `expires_at` and `verified`. It loses `account`, `grants`
    and `credential_storage`, and the `meta` with the time and the zone. `session status --check` adds `account`
    and `grants`, as before. A missing sign-in answers `{"profile","state":"missing","verified":false}`.
  - `session end` answers `profile`, `ended` and `removed`, in place of `cached_data` and `kept`. A run with moved
    folders answers `ended: false` and `why` while it still reads the owner's sign-in. Stored calendar data stays,
    as before. `session end` keeps no run record for `--record`.
  - `session start` answers `profile`, `signed_in`, `account`, `grants` and `scopes`, and loses
    `credential_storage`. It takes `--answer-stdin`. The help for `--grant` now lists each grant in the option.
