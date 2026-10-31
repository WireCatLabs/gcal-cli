---
title: Find a time that suits everyone
goal: See when people are busy and the free stretches you share, without copying their calendars.
steps:
  - run: gcal personal calendars busy person:ana@example.com
    why: asks Google when Ana and your calendars are taken this week; nothing is stored
  - run: gcal personal calendars busy person:ana@example.com --duration-minutes 30 --hours 10:00-16:00
    why: the free half-hours you share inside working hours
  - run: gcal personal events create 1 --title 'Example planning' --start-time 2026-11-02T10:00 --end-time 2026-11-02T10:30 --attendee ana@example.com --no-notify
    why: adds the event; with --no-notify Google mails nobody
look:
  - free stretches fall inside --hours, Monday to Friday, in your time zone; the default is 09:00-17:00
  - events create needs a sign-in with --grant write
---

Busy times come from Google's free/busy answer, which says when, never what.
