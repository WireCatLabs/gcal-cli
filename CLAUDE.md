# gcal — working rules

The [WireCat CLI standards](node_modules/@wirecat/cli-base/docs/standards/README.md) apply here and win over this
file; it keeps only the rules of `gcal` itself. Start with [AGENTS.md](AGENTS.md).

**What cli-core already does, this repository does not do again** — commands, the store, search, MCP and the
permissions. A gap in cli-core is fixed in cli-core.

## Local rules

Add a rule here only when it holds for `gcal` alone, and link the handbook rule it narrows.

- **After each release, move the upgrade baseline to it** in a follow-up pull request, as
  [TESTING.md](docs/dev/TESTING.md) says: `contracts/previous/package.json`, `previous.version` in
  `contracts/upgrade.json`, then `pnpm --dir contracts/previous install`. `bin/release` does not do it: the script is
  the template's, and a change there belongs in cli-template. Narrows
  [WC-TEST-14](node_modules/@wirecat/cli-base/docs/standards/testing.md).
- **A pull request's changelog entries go in a fragment, not under `## Unreleased`.** A new file
  `changes/<branch>.md` (lower case, `/` as `-`) with one or more of the changelog's `###` headings and the entries
  under them, links relative to `changes/`. Every open pull request edits the same lines under `## Unreleased` and
  conflicts at each merge. `pnpm docs:check` checks the fragments; `bin/release` collects them into the version's
  section, so a fragment with `Added` needs a minor release.

## Private working folder

Plans, research and journals do not go into this repository. For WireCat's own CLIs they live in the private
repository `WireCatLabs/cli-private`, linked or cloned into `docs_ai/`, which git ignores. Elsewhere, keep them in a
folder of your own outside the repository.
