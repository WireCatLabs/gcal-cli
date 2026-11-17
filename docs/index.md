# Google Calendar

See your week across every Google account you use, and find past events again by words or by meaning. Your
calendars are copied to your computer, so search needs no network. The transcripts of your Meet calls stay with you
too, after Google deletes them.

You or your AI agent can answer "What is on this week, and what clashes?", find a time when Ana is free and book it,
or recall what was decided on the last call with her. One search finds your meetings beside the chats and notes that
other WireCat tools keep on this computer.

`gcal` is the WireCat command-line tool for Google Calendar and Google Meet. It asks Google for read-only access. It
changes events only after you sign in with `--grant write`, and `--grant meetings` adds your Meet calls. Meet
transcripts come only from Google Workspace accounts, and Google lists only the calls you organised. To start, you need
Node.js, as [installation](installation.md) describes.

**On this page:**

1. [Start in a few minutes](#start-in-a-few-minutes)
2. [Use it with your agent](#use-it-with-your-agent)
3. [How it differs from other tools](#how-it-differs-from-other-tools)

## Start in a few minutes

```sh
npm install -g @wirecat/gcal-cli
gcal personal session start         # sign in to Google in the browser, read-only
gcal personal sync                  # copy your calendars, then only what changed
gcal personal events list           # your events from today on, earliest first
```

`personal` is a name you choose for this Google account. You can add `work` or any other later. Every step, and what
to do when Google refuses the sign-in: [installation](installation.md). Then read your events, search them and book
new ones: [usage](usage.md).

## Use it with your agent

Agents with a terminal, such as Claude Code or Codex, run `gcal` themselves once `gcal skill install` teaches them
how. Claude Desktop, Cursor and other MCP apps connect to `gcal personal mcp serve`. MCP is the standard way such an
app calls a tool.

To use it from ChatGPT or Claude in the browser or on your phone: [remote connection](remote.md).

## How it differs from other tools

How `gcal` differs from other Google Calendar tools: [comparison](compare.md).
