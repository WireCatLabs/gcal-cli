### Added

- **`gcal <profile> sync --allow-deletions <count>`** lets a held round mark up to that many events deleted. A full
  round is now held when it would mark most of a calendar deleted: an empty list, or more than half of ten or more
  stored events. The round still ends, and `held` says why. `--rescan` lists everything again but does not lift the
  hold. The flag is the owner's: an MCP server does not offer it.

### Changed — may break callers

- **gcal runs on cli-core 1.0 and cli-base 1.0** (cli-core 1.0.0, was 0.691.0; cli-base 1.0.0, was 0.109.0).
  cli-core 1.0 moves the message store to version 74 the first time it opens it: an id is never handed out twice,
  and a JSON column holds valid JSON. After that, only tools on cli-core 1.0 open the store. Watch for: upgrade every
  installed WireCat CLI to its 1.0 release first, and stop `serve`, `mcp` and every sync while the store migrates;
  the migration writes a rollback copy first and refuses to run without one. See
  [cli-core's changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).

### Fixed

- **A calendar round no longer stalls on a series deleted between its listing and its slots call**, and an ICS feed
  event that stops parsing is no longer marked deleted: the feed still holds it.

### Security

- **An MCP call cannot name a credential folder, a WireCat tool's folder or the message store.** Every option and
  argument that takes a local file or folder (`gcal events import <file>`, `gcal events export --output`,
  `--body-file` and the rest) is checked by its real path before the call runs, so neither a link nor `..` gets
  past. A refused call answers `permission_error` (`access.denied`) with the option in `param`. A run in a terminal
  is unchanged.
