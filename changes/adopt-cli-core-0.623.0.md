### Changed — may break callers

- **Built on cli-core 0.623.0** (was 0.615.0). The store moves to version 61 on first open (people ties, additive).
  What changed in between is in [cli-core's changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).
- **`search all` no longer lists meetings as an issue when no meeting account is connected**, and `--max-meetings` is
  gone from it.
