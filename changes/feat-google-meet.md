### Added

- **Google Meet calls in gcal.** There is no separate Google Meet tool: `meetings list`, `show`, `transcript`,
  `people`, `export`, `sync` and `repair` keep your Meet calls with who joined, the transcript and the Drive files
  Google made (the transcript Doc, the recording, Gemini's notes), linked to the calendar event by the room's link.
  `meetings list` and `show` ask Google and the store at once. See [Google Meet](../docs/usage.md#google-meet).
- **`session start --grant meetings`** asks for read access to Google Meet (`meetings.space.readonly`);
  `--grant write,meetings` also asks to create Meet rooms (`meetings.space.created`). The default sign-in is unchanged.
- **`events create --meet` and `events update --meet`** give the event a new Google Meet link. They need
  `--grant write` only.
- **`doctor` reports each profile's last Google Meet sync** (`meet_sync`) and warns at 25 days: Google deletes a
  call's record 30 days after it ends.

### Changed — may break callers

- **Built on cli-core 0.660.0** (was 0.659.0). See the
  [cli-core changelog](https://github.com/WireCatLabs/cli-core/blob/main/CHANGELOG.md).
- **`gcal` reaches `meet.googleapis.com`**, a new host in the manifest.
