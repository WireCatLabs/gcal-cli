### Changed — may break callers

- **The agent skill is shorter.** `SKILL.md` keeps what an agent needs on every turn (the profile rule, answering
  from the calendar, the limits on changes, output) in about 7 KB instead of 17 KB, and links the rest in
  `skills/gcal-cli/references/`: events, meeting briefs and digests, changing events, Google Meet, calendars and
  feeds, the Calendar API and MCP. No rule was dropped. The skill now also names `meetings list --backend archive`,
  the working hours of `calendars busy --hours`, and `--send-notifications false` for sharing on the command line. An
  agent that reads the skill pays about 2,500 fewer tokens on every turn.
