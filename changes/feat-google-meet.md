### Added

- **Google Meet calls in gcal.** There is no separate Google Meet tool: `meetings list`, `show`, `transcript`,
  `people`, `export`, `sync` and `repair` keep your Meet calls with who joined, the transcript and the Drive files
  Google made (the transcript Doc, the recording, Gemini's notes), linked to the calendar event by the room's link.
  `meetings list` and `show` ask Google and the store at once. See [Google Meet](../docs/usage.md#google-meet).
- **`session start --grant meetings`** asks for read access to Google Meet (`meetings.space.readonly`). The default
  sign-in is unchanged. A hint to sign in again names every grant the profile holds, so it keeps them.
- **`events create --conference google-meet` and `events update --conference google-meet`** give the event a new
  Google Meet link, with cli-core's shared `--conference`. They need `--grant write` only. An event that has a link
  already is refused (`event.conference-exists`).
- **`meetings create` and `meetings update`** make a Google Meet room that starts now and change the rooms gcal made:
  `--setting access_type=open|trusted|restricted`, `moderation`, `auto_recording`, `auto_transcription` and
  `auto_smart_notes` (`true|false`). They ask first, like every remote write. `session start --grant write,meetings`
  adds `meetings.space.created` for them.
- **`meetings sync` says when a call has held it for 25 days or more:** Google deletes a call's record 30 days after
  it ends. A rate limit stops the sync and says when to run it again.

### Changed — may break callers

- **`gcal` reaches `meet.googleapis.com`**, a new host in the manifest.
