### Changed — may break callers

- **Built on cli-core 0.648.0** (was 0.647.0). A profile name typed as the first word that this computer does not
  know now fails with `profile.unknown` and exit code 6, before the command runs, and lists the profiles here.
  `store reset` is no longer offered over MCP. gcal's Google sign-in and store opener are now cli-core's. What
  changed is in [cli-core's changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).
- **The sign-in file moves from the state folder to the config folder**, where the other WireCat CLIs keep it. It is
  `credentials.json`, used only where no keyring works or with `--credential-storage file`. The first run that reads
  a sign-in moves the old file, so nobody signs in again. `gcal doctor` shows the new path. A run with moved folders
  now keeps its own sign-in in the keyring entry `gcal-cli:<config folder>`, as
  [security](../docs/security.md) always said, not under the state folder.
- **An MCP agent now finds `schedule`, as in every WireCat CLI.** It can list schedules and run one, under the keys
  `schedule.run` and `schedule.exec` (`ask` by default). `mcp.authority` (`deny` by default) still keeps it from
  installing, removing, pausing or resuming one. Before, gcal hid the whole group.

### Fixed

- **`GCAL_READ_ONLY` no longer creates `wirecat.db`.** A read with no store, or with no saved row for the profile,
  now reads an empty store in a temporary folder, as cli-core's CRM commands do, and answers with no events. Under
  the lock, `--source` leaves out a profile that was never opened, since saving its row would be a write.
- **The README said you need a Google app of your own.** Every package carries WireCat's Google app. The quick start
  now signs in with it and points to your own app for when Google refuses it.
