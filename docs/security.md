# Security

What WireCat CLIs share — the keyring, permissions, MCP and what never reaches a log — is on the
[shared security page](https://wirecat.dev/en/docs/security). This page keeps only what is particular to `gcal`.

`gcal` keeps its settings in `config.json` and its state in the folders `gcal doctor` shows. It talks only to Google,
and asks for read access to Calendar and your email address. `session start --grant write` adds the events, and
`--grant sharing` adds who can see a calendar: nothing more.

An agent connected through `gcal <profile> mcp serve` can change who sees your calendar without asking you. After
`--grant sharing` it can share a calendar with any address, make it public, or remove someone. It can also call the
method that gives a calendar to another account; that one works only for a Google Workspace administrator, and only
when the sign-in has a permission `gcal` does not ask for. Over MCP no one is there to answer a question, so `ask`
lets these run. An agent cannot have Google mail the person it shares with: that needs `sharing.notify`, which is
`deny`. It can still share in silence, with `--send-notifications false`. To keep sharing with you, run
`gcal personal config set permissions.api.calendar.acl deny`, or sign in without `--grant sharing`. Emptying a
calendar is never offered to an agent.

`events remind -- <program>` runs a program of yours on this computer, once per meeting that starts soon. It is
`deny` until you run `gcal personal config set permissions.events.remind.hook allow`; `--yes` does not lift it, and
`GCAL_READ_ONLY` refuses it at any level. No MCP tool offers `events remind`. The program starts without a shell, and
the event comes as JSON on its standard input: the title, place and description are written by whoever sent the
invitation, so they never reach a command line where a shell could run them. Your program must treat them as data
too. Its environment is that of the `gcal` run, plus `GCAL_EVENT` and `GCAL_PROFILE`.

The Google sign-in is kept in the system keyring, under the service `gcal-cli`, one entry per profile. That entry also
holds your OAuth client's ID and secret, so refreshing the sign-in does not need the client file again. Google says a
Desktop app's client secret is not confidential, but `gcal` still never prints it. No command, error, log or run record
shows a token or the client secret; the address of the sign-in page holds neither. `session end` removes the entry.
A run with moved folders (`GCAL_CONFIG_DIR`, `GCAL_STATE_DIR` or another `HOME`) reads that entry but never changes
it: its own sign-in goes to a separate entry, `gcal-cli:<config folder>`, and its `session end` removes only that one.

When the keyring fails, or with `session start --credential-storage file`, the same entry goes to `credentials.json` in
`gcal`'s state folder instead, mode 600: anyone who can read your files as you can read the sign-in. `gcal` says so
once on stderr and never asks. Choose the file only where no keyring works.

`gcal` refuses an OAuth client file that other users of the computer can read. The account's email address is saved in
`gcal`'s state folder, readable by you only, so `session status` can answer without the network.

A run record keeps the command line as you typed it, so `gcal runs show` tells you what was run. A secret is still
stored as `[redacted]`: an option named like a token or password, a password in a link, a long opaque string. A
phone number is replaced by `[redacted]` inside the word you typed, message text included: one written with its "+" and
country code, or 11 to 15 digits in a row, so a long id of that length is hidden as well. To keep none of the words
you type, run `gcal personal config set record_input false`.

A secret is also found by what it looks like, in a run record and in a kept error message: a token in a known
format (GitHub, OpenAI, Slack, AWS, Stripe, npm and the like), a `Bearer` credential, a random-looking string of 20 or
more characters, and a random-looking run of 20 or more lower-case hex characters, such as a hex key or a full commit
hash. The value after a secret name is hidden too, whether it follows `=`, `:` or a space: `password=`, `API_TOKEN=`,
`password hunter2`, `pin 1234`. Some secrets look like ordinary words and stay: a value of letters only after a
secret name and a space (`pin this message` stays), a hex key in upper case, a short commit hash or a UUID, a short
password typed without a secret name before it, and a secret inside a link or a file path unless it is in a known
format or after a secret name.

`config.json` is saved readable by you only (`0600`), and its folder is created for you only (`0700`). A file or
folder made by an older version may be open to other users of the computer: `gcal doctor` lists each under
`files.problems` and prints the `chmod` that fixes it. Windows is not checked. Report a vulnerability as [SECURITY.md](https://github.com/WireCatLabs/gcal-cli/blob/main/SECURITY.md)
says.
