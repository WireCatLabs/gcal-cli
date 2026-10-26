<!-- Generated from the command tree by pnpm generate. Do not edit. -->

# Commands

Every command, option and exit code, generated from the program itself. For the same list as JSON, run
`gcal commands --json`.

**The first word is the profile**, a name you choose: `gcal personal config show`. `GCAL_PROFILE`
does the same for a whole shell session. No profile is assumed: a command that uses an account stops without one and
lists the profiles on this computer.

## Options for every command

| Option | What it does |
|---|---|
| `-V, --version` | output the version number. |
| `-v, --verbose` | more detail in what is shown: -v ids, -vv everything we know. Default: `0`. |
| `--json` | machine-readable output: one JSON value on stdout; --json=id,text keeps only those fields. |
| `--jsonl` | machine-readable output: one JSON object per line, for streaming and jq. |
| `--quiet` | diagnostics off; a failure is still said. |
| `--trace` | the connection's own log lines on stderr — never content. |
| `--debug` | on a failure, its whole record — cause and stack — in place of the short line. |
| `--timeout <duration>` | give up on the whole command after this — 30s, 2m, 500ms. |
| `--offline` | answer from what was recorded and never connect; fails if nothing was. |
| `--no-input` | never prompt or open interactive login; piped input remains available. |
| `--max-input-bytes <bytes>` | maximum buffered input bytes (default: 16777216). |
| `--max-output-bytes <bytes>` | maximum machine output bytes (default: 4194304; 0 disables). |
| `--brief` | found items as reference, title, time, author and excerpt only. |
| `--full` | found items with their whole text and every provider field. |
| `--dry-run` | preview parsed arguments and permissions before running the action. |
| `--yes` | go ahead without the question an ask level puts before a write. |
| `--record` | keep this run, with the command as typed and secrets hidden; record_input false leaves the typed words out. |
| `--no-record` | do not keep it, whatever the configuration says. |

## `gcal commands`

every command by section; --json prints its contract, one path per call

### `gcal commands info`

one command contract, or all schemas, error reasons and explicit overrides

```sh
gcal commands info [path]
```

| Argument | | What it is |
|---|---|---|
| `path` | optional | one command path; without one, export schemas, error reasons and explicit overrides. |

**Returns:** one command contract, or all schemas, error reasons and explicit overrides

**Example:** `gcal commands info commands`

## `gcal doctor`

check this installation: version, paths, config, profiles; no keyring or network

```sh
gcal doctor
```

**Returns:** check this installation: version, paths, config, profiles; no keyring or network

**Example:** `gcal doctor`, `gcal doctor --json`

## `gcal skill`

the instructions an agent is given for this tool

### `gcal skill show`

print SKILL.md — `gcal skill install` puts it where Claude Code, Codex and Gemini CLI look for it; --for prints the copy already there

```sh
gcal skill show [name] [options]
```

| Argument | | What it is |
|---|---|---|
| `name` | optional | one of the skills shipped for a task: follow-ups, link-conversations. |

| Option | What it does |
|---|---|
| `--for <agents>` | print the copy installed for these agents instead of this version's. One of: `claude`, `agents`. |

**Returns:** print the tool's instructions for AI agents

**Example:** `gcal skill show`, `gcal skill show follow-ups`

### `gcal skill install`

write SKILL.md to \~/.claude/skills/gcal-cli/ (Claude Code) and \~/.agents/skills/gcal-cli/ (Codex, Gemini CLI, OpenClaw); --for hermes also has Hermes read \~/.agents/skills, which changes Hermes's own settings, so all leaves it out

**Changes something on this computer only.**

```sh
gcal skill install [options]
```

| Option | What it does |
|---|---|
| `--for <agents>` | which agents to install for. One of: `claude`, `agents`, `hermes`, `all`. Default: `all`. |

**Returns:** install the tool's instructions for AI agents

**Example:** `gcal skill install --for agents`

### `gcal skill status`

for each place `gcal skill install` writes to, and for the copy Hermes reads: the path, the version installed there, and whether it is current, stale, missing or unversioned

```sh
gcal skill status
```

**Returns:** whether the installed instructions for AI agents match this version

**Example:** `gcal skill status`, `gcal skill status --json`

## `gcal mcp`

serve this profile's commands to an agent over MCP, on stdin and stdout, writes included; the profile's permissions decide — `claude mcp add gcal -- gcal personal mcp`

**Changes something in the service.**

```sh
gcal mcp
```

**Returns:** serve this profile's commands to an AI agent

**Example:** `gcal personal mcp`

## `gcal upgrade`

upgrade gcal with the package manager that installed it; --check only looks

**Changes something on this computer only.**

```sh
gcal upgrade [options]
```

| Option | What it does |
|---|---|
| `--check` | say whether a newer version exists, and install nothing. |

**Returns:** upgrade gcal with the package manager that installed it; --check only looks

**Example:** `gcal upgrade --check`

## `gcal config`

the settings in force, and where each one came from

### `gcal config show`

the profile, the profiles that exist, and each setting with where it came from

```sh
gcal config show [options]
```

| Option | What it does |
|---|---|
| `--bot` | the settings a bot command on this profile gets, rather than the personal account's. |

**Returns:** the profile, the profiles that exist, and each setting with where it came from

**Example:** `gcal personal config show`

### `gcal config set`

save a setting to the configuration file

**Changes something on this computer only.**

```sh
gcal config set <setting> <value> [options]
```

| Argument | | What it is |
|---|---|---|
| `setting` | required | one of: limit, timeout_ms, color, record, record_input, keep_runs_for_days, permissions, sends_per_hour, requests_per_minute, transcribe_with, speech_model, search_catch_up, picture_search, search_reranker, embedding_provider, embedding_model, embedding_base_url, embedding_dims, models, read_other_bots, update_check, skill_hint, search_stemmers.cyrillic, search_stemmers.latin, phone_countries, task_categories.<name>, task_agent_close, task_agent_close_min, task_first_pass_per_chat, account_groups.<name>. |
| `value` | required | a number, true or false; for a group tg:work,max:Alice,email:me@x. |

| Option | What it does |
|---|---|
| `--defaults` | change what every profile gets, rather than this profile. |
| `--personal` | only for personal accounts — the personal section of the file. |
| `--bot` | only for bots — the bot section of the file. |

**Returns:** save a setting to the configuration file

**Example:** `gcal personal config set limit 20`

### `gcal config unset`

remove a setting from the configuration file

**Changes something on this computer only.**

```sh
gcal config unset <setting> [options]
```

| Argument | | What it is |
|---|---|---|
| `setting` | required | one of: limit, timeout_ms, color, record, record_input, keep_runs_for_days, permissions, sends_per_hour, requests_per_minute, transcribe_with, speech_model, search_catch_up, picture_search, search_reranker, embedding_provider, embedding_model, embedding_base_url, embedding_dims, models, read_other_bots, update_check, skill_hint, search_stemmers.cyrillic, search_stemmers.latin, phone_countries, task_categories.<name>, task_agent_close, task_agent_close_min, task_first_pass_per_chat, account_groups.<name>. |

| Option | What it does |
|---|---|
| `--defaults` | change what every profile gets, rather than this profile. |
| `--personal` | only for personal accounts — the personal section of the file. |
| `--bot` | only for bots — the bot section of the file. |

**Returns:** remove a setting from the configuration file

**Example:** `gcal personal config unset limit`

## `gcal runs`

recorded runs — what this tool did, and when

### `gcal runs list`

recorded runs, newest first

```sh
gcal runs list [query] [options]
```

| Argument | | What it is |
|---|---|---|
| `query` | optional | field:value terms that narrow the list — the fields are below. |

| Option | What it does |
|---|---|
| `--limit <n>` | how many to show. Default: `20`. |
| `--page <n>` | which page, starting at 1. Default: `1`. |

**Returns:** run — run_id, command, started_at, status, cli_version, profile, completed_at, requests, and 20 more; every field: gcal commands info runs list

**Example:** `gcal personal runs list --limit 10`

### `gcal runs show`

one run: what it was, how it ended, and every event it logged

```sh
gcal runs show <run-id> [options]
```

| Argument | | What it is |
|---|---|---|
| `run-id` | required | an id from `gcal runs list`. |

| Option | What it does |
|---|---|
| `--problems` | only failed responses, warnings and crashes. |

**Returns:** run details — run_id, command, started_at, status, cli_version, directory, event_count, events, and 19 more; every field: gcal commands info runs show

**Example:** `gcal personal runs show run-101`

### `gcal runs path`

the directory holding one run

```sh
gcal runs path <run-id>
```

| Argument | | What it is |
|---|---|---|
| `run-id` | required | an id from `gcal runs list`. |

**Returns:** run location — path; every field: gcal commands info runs path

**Example:** `gcal personal runs path run-101`

## Exit codes

Branch on the code, not on the text: the text can change, the code does not.

| Code | When |
|---|---|
| `0` | it worked |
| `2` | `validation_error` |
| `3` | `configuration_error` |
| `4` | `authentication_error` |
| `5` | `permission_error` |
| `6` | `not_found` |
| `7` | `confirmation_required` |
| `8` | `rate_limited` |
| `9` | `timeout` |
| `10` | `network_error` |
| `11` | `provider_error` |
| `12` | `provider_unavailable` |
| `13` | `invalid_response` |
| `14` | `outcome_unknown` |
| `130` | `cancelled` |
| `1` | anything else |
