### Changed — may break callers

- **A `readonly` level no longer stops `gcal sync`** (cli-core 0.662.0, was 0.659.0). A command that only fetches
  from Google Calendar into the local store runs at `readonly`; `deny` still refuses it. Commands that write the
  owner's files or call another service stay blocked by `readonly`. A profile that used `readonly` to stop syncing
  sets the key to `deny`.
