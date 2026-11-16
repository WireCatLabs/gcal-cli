# Backlog

Open work for gcal-cli (`gcal`), most important first. Users read what shipped in [CHANGELOG.md](../../CHANGELOG.md).
Shared calendar work belongs to cli-core; an item here names it when gcal only adopts it.

## Rules

- **An id is permanent** and never reused: `GCAL-<n>`, the next number above the highest in this file, on any branch.
- **One item:** id · priority · title · where the work starts · link to details.
- **Priority:** **P1** breaks something real, tells users something untrue, or blocks install · **P2** this cycle.
- **Close in the PR that ships the work:** delete the line here in that PR.

## Now (P1)

- **GCAL-1** · P1 · ops · **Do not release before this:** build on the cli-base that installs a skill's `references/`
  (`skill install`, `skill show <part>`; WC-DOC-22, cli-base 0.106.0 or later) and the cli-core that serves them over
  MCP (`skillResources`; cli-core 0.674.0 serves only SKILL.md). The skill now links
  `skills/gcal-cli/references/*.md`; with cli-base 0.103.0 `gcal skill install` copies only SKILL.md and
  `gcal skill show events` fails. After the bump check all three: install into a temporary HOME and list the folder,
  `gcal skill show events`, and the MCP resource list.
