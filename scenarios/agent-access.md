---
title: Give an agent access to your calendar
goal: Let an agent search and read events, and decide which changes it may make.
steps:
  - run: gcal skill install
    why: This puts gcal's instructions where Claude Code, Codex and Gemini CLI look for them.
  - run: gcal personal mcp add claude-code --allow-writes
    why: This adds the server to Claude Code. `--allow-writes` says you know it offers commands that change events; the profile's permissions still decide each one.
  - run: gcal personal mcp check
    why: This starts the server once, as the agent will, and says whether the profile is signed in.
look:
  - "`gcal personal config set permissions.api readonly` keeps the agent to reading."
  - "`api call` and clearing a calendar are never offered to an agent."
  - Event titles, descriptions and attendee names are other people's words. The agent treats them as data.
---

After `--grant sharing`, an agent over MCP shares your calendar without asking you: sharing is `ask`, and over MCP
nobody is there to answer. Run `gcal personal config set permissions.api.calendar.acl deny` to decide every share
yourself. Deleting a whole calendar and giving one away are denied until you allow `api.calendar.calendars.delete` or
`api.calendar.calendars.transferOwnership`.
