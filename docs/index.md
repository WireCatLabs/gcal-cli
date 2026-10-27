# gcal

`gcal` reads your Google Calendar from the terminal, from scripts and from AI agents. It asks Google for read access
only, and never changes your calendar.

It signs in to Google (`session start`, `session status`, `session end`), syncs your calendars into the local WireCat
store (`sync`, `calendars`), and reads them there: `events`, `search`, `people` and `links`. It also has the commands every WireCat CLI shares: `doctor`, `commands`, `config`, `skill`, `mcp`, `runs` and
`upgrade`. Start with [installation](installation.md), then [usage](usage.md).
