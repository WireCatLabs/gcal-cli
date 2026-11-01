# Settings

Settings live in one file, `config.json`, in the folder `gcal doctor` shows. Each profile has its own part,
and `defaults` apply to every profile. This page lists how to see and change them.

```sh
gcal personal config show
gcal personal config set limit 50
gcal personal config unset limit
```

`config show` lists each setting and where it came from: the file, a variable or the default.

## Your own Google client

`session start` signs in through a Google app of your own: pass its Desktop app client file with `--client-file`, or
set `GCAL_GOOGLE_CLIENT_ID` and `GCAL_GOOGLE_CLIENT_SECRET`. Either one wins over WireCat's app, which the current
releases do not carry yet. `gcal` refuses a client file other users of the computer can read. The client is needed
only at sign-in: `gcal` keeps it with the sign-in, so later commands work without the file.

[Make your own Google app](installation.md#make-your-own-google-app) walks through Google Cloud Console step by step.

## Permissions

`permissions` decides what a command may do for this profile: `allow`, `ask`, `readonly` or `deny`, per permission
key. Each Google Calendar method has its own key, `api.<method>`, such as `api.calendar.events.insert`; `api` and
`api.calendar.events` name every method under them. The same key covers `api call <method>` and the method's own
command, `api calendar-events-insert`.

```sh
gcal personal config set permissions.api readonly                        # reads only, every method
gcal personal config set permissions.api.calendar.events.insert ask      # be asked before each new event
```

Without a setting of yours:

- A method that changes Calendar and is easy to undo, such as `calendar.events.insert` or `calendar.events.patch`, is
  `allow`, as `events create` and `events update` are.
- A method that deletes, such as `calendar.events.delete` or `calendar.calendarList.delete`, is `ask`. At a terminal
  `gcal` asks before it calls Google; in a script, add `--yes`. Over MCP there is no one to ask, so `ask` lets the
  command run.
- Sharing a calendar (`calendar.acl.insert`, `patch`, `update`, `delete`) is `ask`. Over MCP that means an agent can
  share your calendar with anyone without a question. Set `permissions.api.calendar.acl deny` to stop it.
- Deleting a whole calendar (`calendar.calendars.delete`) and giving it to another account
  (`calendar.calendars.transferOwnership`) are `deny`: neither can be undone. Set the key to `ask` or `allow` to let
  them run.
- `sharing.notify`, letting Google mail the person a calendar is shared with, is `deny`. Google sends that mail
  unless `sendNotifications` is `false`, so while the key is `deny` a share must say `--send-notifications false`.
- Emptying a calendar (`calendar.calendars.clear`, every event of the main calendar) is `deny`, and never offered over
  MCP.
- The event writes that are easy to undo go ahead without a question: `events create`, `update`, `move` and `respond`
  are `allow`, each under its own key, such as `events.create`. `events delete`, `--following` included, is `ask`.
- `events.notify`, letting Google mail the other attendees (`--notify`), is `deny`. Over MCP `ask` lets a command
  run, so an agent could otherwise mail people.
- `events.delete.series`, deleting every occurrence of a repeating event (`events delete --series`), is `deny`. A
  series update whose new `--repeat` rule ends it sooner (a new `COUNT` or an earlier `UNTIL`) needs it too.

An event write also answers to the key of the Google method it calls, once you set that key: `api.calendar.events.insert`
for `create`, `api.calendar.events.patch` for `respond`, `api.calendar.events.patch` and `api.calendar.events.update`
for `update` (a switch between timed and all-day sends the whole event), `api.calendar.events.delete` for `delete`,
`api.calendar.events.move` for `move`. So `permissions.api readonly` stops the event writes too, and
`permissions.api.calendar.events.insert ask` makes `events create` ask. The built-in `ask` of
`api.calendar.events.delete` holds for the `api` commands only: `events delete` asks under its own key. One question
covers every key of one write.

The `api` commands answer to the same keys. A method that has Google mail the attendees (`--send-updates` other than
`none`, or `--send-notifications true`) also needs `events.notify`. Deleting an event, or patching it to `cancelled`,
also needs `events.delete.series` when the event repeats: `gcal` reads the event from Google first to find out.
Sharing a calendar (`calendar.acl.insert`, `patch`, `update`) also needs `sharing.notify` unless the call passes
`--send-notifications false` (`"sendNotifications": false` in `api call --params`); `gcal` never adds it for you.
Removing access (`calendar.acl.delete`) mails nobody, so it needs no extra key.
`--dry-run` lists every key a call checks, with its level, and calls nothing.

```sh
gcal personal config set permissions.events.notify allow     # let --notify mail attendees
gcal personal config set permissions.sharing.notify allow    # let a share mail the person it is shared with
gcal personal config set permissions.events.create ask       # be asked before each new event
```

These defaults only become stricter against a broader key: `permissions.api allow` keeps both the question and the
`deny`. To change one, set that method's own key, such as `permissions.api.calendar.calendars.clear ask`. A key that
names no method is refused, and `gcal doctor` lists any in the file. `GCAL_READ_ONLY=1` refuses every write, whatever
the permissions say. `gcal <profile> mcp serve --permission api=readonly` makes a key stricter for that server only.

## Run records

A command that fails is kept as a run, for `gcal runs list` and `runs show`. `record_input` decides whether a run
keeps the words you typed; it is `true` unless you set it to `false`. Secrets are masked either way; see
[Security](security.md).
