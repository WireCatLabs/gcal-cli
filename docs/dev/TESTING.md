# Testing

How the tests run, and what they never touch. The rules are the handbook's
[Testing page](../../node_modules/@wirecat/cli-base/docs/standards/testing.md).

- `pnpm test` runs vitest. `@wirecat/cli-base/testing/setup` gives each test file its own temporary home folder, a
  keyring that throws and no network, and points this CLI's config, state, cache and the shared store into that
  folder. `src/testing/sandbox.ts` names the config folder, which tests write into by name.
- `pnpm test:coverage` adds the coverage floor in `vitest.config.ts`.
- Each run logs the command lines the tests drove (`coverage/argv.jsonl`). `pnpm test:matrix` turns that log into
  [test-matrix.md](test-matrix.md); a command or option no test drives needs a reason in
  `scripts/test-matrix-untested.ts`.
- `pnpm contracts:check` runs the built CLI against `contracts/plan.json`: help, discovery, errors and the MCP tool
  list. `pnpm exec cli-contract contracts/plan.json --update` rewrites the snapshots; review the diff.
- `pnpm contracts:upgrade` does not exist yet: the skeleton has no store of its own, and `.github/workflows/ci.yml`
  skips the step. Add it with the first store, and remove the skip.
- `pnpm smoke` installs the packed package into a temporary folder and runs it offline.
- `pnpm audit:commands` audits the command tree beside the latest published WireCat CLIs.
