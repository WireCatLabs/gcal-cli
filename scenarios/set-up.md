---
title: Copy chosen calendars and make them searchable
goal: Sign in once, choose the calendars to keep, and get their events into the local store, searchable offline.
steps:
  - run: gcal personal session start --client-file ~/client_secret.json
    why: signs in to Google in the browser, read-only; personal is the profile, any name you choose, and starts every account command
  - run: gcal personal calendars list
    why: every calendar the account can see, each with the number to choose it by
  - run: gcal personal calendars sync 1
    why: only the calendars you choose are copied
  - run: gcal personal sync
    why: copies their events; a later run copies only what changed
  - run: gcal personal store status
    why: how far each calendar's copy is, and when it last moved
look:
  - a calendar whose sync is partial; run sync again until it is complete
  - gcal personal search events "planning" finds events offline once they are copied
---

Nothing leaves the computer except the Google requests the sync makes; search and reading run offline.
