### Added

- **Google Meet calls in gcal.** There is no separate Google Meet tool: `meetings list`, `show`, `transcript`,
  `people`, `export`, `sync` and `repair` keep your Meet calls with who joined, the transcript and the Drive files
  Google made (the transcript Doc, the recording, Gemini's notes), linked to the calendar event by the room's link.
  `meetings list` and `show` ask Google and the store at once. See [Google Meet](../docs/usage.md#google-meet).
- **`session start --grant meetings`** asks for read access to Google Meet (`meetings.space.readonly`). The default
  sign-in is unchanged. A hint to sign in again names every grant the profile holds, so it keeps them.
- **`events create --meet` and `events update --meet`** give the event a new Google Meet link. They need
  `--grant write` only.
- **`meetings sync` says when a call has held it for 25 days or more:** Google deletes a call's record 30 days after
  it ends. A rate limit stops the sync and says when to run it again.

### Changed — may break callers

- **Built on cli-core 0.660.0** (was 0.659.0). See the
  [cli-core changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).
- **`gcal` reaches `meet.googleapis.com`**, a new host in the manifest.
