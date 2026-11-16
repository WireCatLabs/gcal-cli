### Changed — may break callers

- **Built on cli-core 0.674.0** (was 0.673.0) and cli-base 0.103.0 (was 0.102.1). The shared store moves to version
  67, so upgrade the other WireCat CLIs that share it too. A command run without a profile it needs now carries the
  reason `profile.missing`. See the
  [cli-core changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).
