# Google Calendar

`gcal` reads your Google Calendar from the terminal, from scripts and from AI agents. It asks Google for read access
only, unless you sign in with `--grant write` to create, change and delete events.

It signs in to Google (`session start`, `session status`, `session end`), syncs your calendars into the local WireCat
store (`sync`, `status`, `calendars`), and reads them there: `events`, `search`, `people` and `links`.
`calendars busy` asks Google when people are free. With the write grant, `events create | update | delete | move |
respond` change Google Calendar. It also has the commands every WireCat CLI shares: `doctor`, `commands`, `guide`, `config`,
`skill`, `mcp`, `runs` and `upgrade`. Start with [installation](installation.md), then [usage](usage.md).
