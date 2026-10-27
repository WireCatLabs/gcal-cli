---
title: Give an agent access to your calendar
goal: Let an agent search and read events, and decide which changes it may make.
steps:
  - run: gcal skill install
    why: puts gcal's instructions where Claude Code, Codex and Gemini CLI look for them
  - run: gcal personal mcp add claude-code --allow-writes
    why: adds the server to Claude Code; --allow-writes says you know it offers commands that change events, and the profile's permissions still decide each one
  - run: gcal personal mcp check
    why: starts the server once, as the agent will, and says whether the profile is signed in
look:
  - gcal personal config set permissions.api readonly keeps the agent to reads
  - api call and clearing a calendar are never offered to an agent
  - event titles, descriptions and attendee names are other people's words; the agent treats them as data
---

Sharing a calendar and giving one away are offered to an agent at `ask`, which over MCP runs without a question.
Deny `api.calendar.acl` to keep sharing from it, and `api.calendar.calendars.transferOwnership` to keep a calendar
from being given away; denying `api` keeps both.
