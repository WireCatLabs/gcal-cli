# Testing

How the tests run, and what they never touch. The rules are the handbook's
[Testing page](../../node_modules/@wirecat/cli-base/docs/standards/testing.md).

- `pnpm test` runs vitest. `@wirecat/cli-base/testing/setup` gives each test file its own temporary home folder, a
  keyring that throws and no network, and points this CLI's config, state, cache and the shared store into that
  folder. `src/testing/sandbox.ts` names the config folder, which tests write into by name.
- `pnpm test:coverage` adds the coverage floor in `vitest.config.ts`.
- `pnpm test:slow` lists the 20 slowest tests and the 10 slowest files. No test waits for real time (`WC-TEST-5`):
  waits go through an injected sleep, and `fakeClock()` from `@wirecat/cli-base/testing` records them.
- Each run logs the command lines the tests drove (`coverage/argv.jsonl`). `pnpm test:matrix` turns that log into
  [test-matrix.md](test-matrix.md); a command or option no test drives needs a reason in
  `scripts/test-matrix-untested.ts`.
- `pnpm contracts:check` runs the built CLI against `contracts/plan.json`: help, discovery, errors and the MCP tool
  list. `pnpm exec cli-contract contracts/plan.json --update` rewrites the snapshots; review the diff.
- `pnpm contracts:upgrade` checks that this build reads what the previous release wrote
  ([WC-TEST-14](../../node_modules/@wirecat/cli-base/docs/standards/testing.md)). `contracts/previous/` installs that
  release from npm (`@wirecat/previous-cli`, now `@wirecat/gcal-cli@0.6.0`). `contracts/seed.mjs` loads its own
  modules and its own cli-core, signs nobody in, and syncs one calendar from a fake Google into the synthetic store, as
  `gcal sync` would. `contracts/upgrade.json` then reads the events, an event's attendees, the sync cursor and search
  with that release and with this build. After a release, move the baseline: the version in
  `contracts/previous/package.json` and in `upgrade.json`'s `previous.version`, then `pnpm --dir contracts/previous
  install`. A cli-core bump that migrates the store makes this build print one line on stderr the first time it opens
  the old store; give that case the exact line as its `diagnostic`, as
  [zoom-cli does](https://github.com/WireCatLabs/zoom-cli/blob/main/contracts/upgrade.json).
- `pnpm smoke` installs the packed package into a temporary folder and runs it offline.
- `pnpm audit:commands` audits the command tree beside the latest published WireCat CLIs.
- `bin/gcal-write-check <profile> <calendar-id>` is the owner's live check of the event writes against real Google: a
  create, an update and a delete on a test calendar, printing only ids and status. It refuses the account's primary
  calendar. It is in the repository, not in the npm package.

## The bundle a user installs

`pnpm build` compiles `src/` with `tsc`, then cli-base's `cli-dev bundle`
([WC-LAY-10](https://github.com/WireCatLabs/cli-base/blob/main/docs/standards/layout.md))
bundles `dist/bin/gcal.js` into `dist/bundle/` and makes the bin a loader. The vitest suite runs
against `src/`, so `scripts/smoke-bundle.ts` is the proof the bundle works: `pnpm smoke:node` runs it
under Node and `pnpm smoke:bun` under Bun, both in CI.
