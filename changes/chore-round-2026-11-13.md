### Changed — may break callers

- **Built on cli-core 0.651.0** (was 0.650.0). A stale meeting project fingerprint exits as `conflict` instead of
  `configuration_error`. A profile name in `GCAL_PROFILE` that this computer does not know fails with
  `profile.unknown` and lists the profiles here, as a mistyped first word does, and the message says "no profile
  named" once. The first screen lists `pbx`, the Asterisk tool. What changed is in
  [cli-core's changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).

### Security

- **`contracts/wirecat.json` lists the hosts cli-core reaches for gcal**: npm for `upgrade`, and Hugging Face and
  GitHub for the model downloads and the hosts they redirect to. WireCat Desktop shows them before you install gcal.
