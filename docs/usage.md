# Use it

This page explains how a command is built, and how an agent uses the tool. Read it before your first command.

## The profile comes first

A profile is a name you choose for one account. It is the first word of every command that uses an account:

```sh
gcal personal config show
```

`GCAL_PROFILE=personal` does the same for one shell session. No profile is ever assumed, not even the only one: a
command without one stops with exit code 2 and lists the profiles on this computer.

## Sign in to Google

`session start` opens Google's sign-in page in your browser. Choose the account and allow read access to Calendar:

```sh
gcal personal session start --client-file ~/client_secret.json
```

For now, `gcal` has no Google app of its own, so it needs yours: see
[your own Google client](configuration.md#your-own-google-client). Add `--no-browser` to get the sign-in address on
stderr instead, and open it in any browser on this computer.

One Google account belongs to one profile. Signing in to a profile with another account is refused, and so is a second
profile for the same account.

```sh
gcal personal session status            # what is saved on this computer; no network
gcal personal session status --check    # ask Google whether the sign-in still works
gcal personal session end               # forget the sign-in on this computer
```

`session status` gives the account's email address, the permissions Google granted and `state`: `saved` or
`missing`. With `--check`, `verified: true` means Google accepted the sign-in just now. `session end` removes the
sign-in from the keyring; it keeps which account the profile is, and your stored calendar data.

## Output for scripts

Every command except `mcp` takes `--json`, and prints one JSON value on stdout. Errors are JSON on stderr, with a code to branch
on. The [command reference](commands.md) lists the codes.

## Agents

`gcal skill install` puts the tool's skill where Claude Code, Codex, Gemini CLI and OpenClaw look for it.
`gcal skill install --for hermes` also adds that folder to Hermes Agent's own settings, so a bare `skill install`
leaves Hermes out. `gcal personal mcp` serves the profile's commands over MCP, on stdin and stdout:

```sh
claude mcp add gcal -- gcal personal mcp
```

The server offers every command, the ones that write included. The profile's permissions decide what runs; see
[settings](configuration.md#permissions).
