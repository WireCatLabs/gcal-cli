# Google Calendar

See your week across every Google account you use, and find a past event again by words or by meaning. `gcal` gives
the AI agent you already use, such as Claude Code or Codex, a copy of your calendars on your computer, so search needs
no network. The transcripts of your Meet calls stay with you too, after Google deletes them.

Ask "What is on this week, and what clashes?", "When can I meet Ana for 30 minutes?" or "What did we decide on the
last call with her?". `gcal` asks Google for read-only access, and it changes your calendar only after you allow it.

**On this page:**

1. [What you get](#what-you-get)
2. [Things a newcomer would not guess](#things-a-newcomer-would-not-guess)
3. [How it looks](#how-it-looks)
4. [Why gcal](#why-gcal)
5. [What it can do](#what-it-can-do)
6. [How it works](#how-it-works)
7. [Start in a few minutes](#start-in-a-few-minutes)
8. [Limits](#limits)
9. [Find a guide for your task](#find-a-guide-for-your-task)

## What you get

- **Your week at a glance.** One list across every Google account you use, personal and work, with the clashes found.
- **A time that suits everyone.** Ask when people are free and get the stretches that fit all of them.
- **Booking without clicking.** Create, move and cancel events, with a Meet link when you want one. Nobody gets an
  email unless you allow it.
- **Calls you can come back to.** Past Meet calls with who joined and the transcript, ready to search and summarise.
- **Prepared for the next meeting.** One request gathers the event, its attendees and your past meetings with them,
  and your latest messages with them when another WireCat tool such as `tg` keeps your chats.
- **Any event, found.** "When did we plan the roadmap review?" finds it by words or by meaning, with no network.

## Things a newcomer would not guess

- **`personal` is a name you choose.** It names one Google account, and it is the first word of every command that
  reads or changes an account. Add `work` later. No command picks an account for you.
- **At a terminal a delete asks first. Over MCP it does not.** MCP is the way apps such as Claude Desktop call a tool,
  and nobody sits there to answer. Set what an agent must not do to read only or refuse before you connect it.
- **The copy covers a year back and three months ahead.** Each later sync asks Google only for what changed. Google's
  own search reaches events outside that span.
- **Only the calendars you own sync at first.** `calendars list` shows the rest, and you add the ones you want.
- **Personal Google accounts get no Meet transcripts**, and Google lists only the calls you organised. Google deletes
  a call's record 30 days after it ends, so sync before then.

## How it looks

```text
You:    When can I meet Ana for 30 minutes this week?
Agent:  (runs gcal personal calendars busy person:ana@example.com --duration-minutes 30)
        Going by both calendars, you are both free on Tuesday 10:00-10:30, Wednesday 14:00-15:00 and
        Thursday 10:00-12:00.
You:    Book Tuesday, 30 minutes, "Example planning", with a Meet link. Do not email her.
Agent:  Draft: "Example planning", Tuesday 10:00-10:30, with ana@example.com, a new Meet link, no email sent.
        Create it?
You:    Yes.
```

## Why gcal

- **Search the other calendar tools do not document.** Of the tools on the [comparison](compare.md), only `gcal`
  documents searching your meetings without the internet, finding one by what it was about, and knowing that an
  attendee is the person you write to in Telegram, WhatsApp or mail.
- **Read-only until you say so.** The first sign-in reads only. Writing events and reading Meet each need their own
  permission from Google.
- **A write never overwrites a change made in Google** since the last sync.
- **No WireCat server.** `gcal` talks only to Google. A meeting's passcode or PIN is never stored or printed.
- **Usually no Google Cloud project to set up.** Every package carries WireCat's own Google app.
- **Free and open source.** Apache 2.0, on macOS, Linux and Windows.

Another tool fits better when you want a calendar grid in the terminal, such as a week view
([gcalcli](https://github.com/insanum/gcalcli)), or help in Claude on the web with nothing to install (Claude's
Google Calendar connector).

## What it can do

- **Read:** events from every account in one list, the clashes, what changed since a date, and one event with its
  attendees and Drive files. [Usage](usage.md)
- **Find a time and book:** free and busy times, create, move and cancel events, answer invitations, add a Meet link.
  [Usage](usage.md)
- **Search:** by words, by meaning, or with Google's own search. [Usage](usage.md)
- **Google Meet:** who joined and the transcript, linked to the calendar event. [Usage](usage.md)
- **Feeds and files:** follow a holiday or other `.ics` calendar, and export events to an `.ics` file.
  [Usage](usage.md)
- **From anywhere:** ChatGPT or Claude in the browser or on your phone, through your own tunnel.
  [Remote connection](remote.md)

## How it works

- **A copy on your computer.** `sync` keeps your events in the WireCat local store, the one file on your computer that
  every WireCat tool shares. One search then finds a meeting beside your chats and notes.
- **Your own sign-in.** `gcal` signs in to Google in the browser and keeps the sign-in in your system keyring.
- **Made for scripts and agents.** `--json` gives a JSON answer for scripts. A skill teaches agents with a
  terminal, and `gcal personal mcp serve` serves Claude Desktop, Cursor and other apps that use MCP.
- **What is stored and what goes over the network.** [Security](security.md)

## Start in a few minutes

Paste this into your agent:

```text prompt
Install gcal with npm install -g @wirecat/gcal-cli. Help me sign in read-only with gcal personal session start, sync, and show what clashes this week.
```

Or in a terminal:

```sh
npm install -g @wirecat/gcal-cli
gcal skill install                  # the agent skill, for Claude Code, Codex and Gemini CLI
gcal personal session start         # sign in to Google in the browser, read-only
gcal personal sync                  # copy your calendars, then only what changed
gcal personal events list           # your events from today on
```

Google may refuse the sign-in through WireCat's app. Then [make your own Google app](installation.md), which costs
nothing. You need Node.js 22.16 or a later 22.x, or Node.js 24 or later, or Bun.

## Limits

- `calendars busy` shows a person's busy times only when their calendar is shared with you or your organisation.
- Search by meaning needs a small model you download once. Search by words works without it.

## Find a guide for your task

| Task | Guide |
|---|---|
| Install and sign in | [Installation](installation.md) |
| Read, search and book | [Usage](usage.md) |
| Use it from ChatGPT or Claude in the browser | [Remote connection](remote.md) |
| Decide what an agent may do | [Configuration](configuration.md) |
| An exact command | [Commands](commands.md) |
| Something does not work | [Troubleshooting](troubleshooting.md) |
| What gcal keeps and sends | [Security](security.md) |
| How gcal differs from other calendar tools | [Comparison](compare.md) |
