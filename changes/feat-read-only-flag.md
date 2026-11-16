### Added

- **`gcal --read-only` refuses every change for one run, as `GCAL_READ_ONLY=1` does and as drive's `--read-only`
  does.** `gcal --read-only personal api call calendar.events.quickAdd …` answered `unknown option '--read-only'`; it
  now answers `permission_error` (exit 5), and reads still run. `gcal personal mcp serve --read-only` refuses every
  write tool.
