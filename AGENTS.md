# Working rules for agents

The [WireCat CLI standards](node_modules/@wirecat/cli-base/docs/standards/README.md) apply here and win over this
file and over every other document in this repository. The handbook ships inside `@wirecat/cli-base`; run
`pnpm install` first. Read the page for the area you change before changing it, and cite the rule ids the change
touches (`WC-<AREA>-<n>`) in the commit message and the pull request. The rules of this CLI alone are in
[CLAUDE.md](CLAUDE.md).

## Before building anything

This CLI was made from [cli-template](https://github.com/WireCatLabs/cli-template). Its first task is the design:

1. Read [docs/dev/DESIGN.md](docs/dev/DESIGN.md). If the seven answers are not there, ask the owner the
   [design interview](docs/dev/skills/design-interview/SKILL.md) and write them down.
2. Learn from the reference CLI below. Copy its patterns for the provider, the store and the commands; the
   template has no sample code on purpose.
3. Ask the further questions in the interview that the reference CLI does not answer. Build only after the owner
   has read `DESIGN.md`.
4. When the first command reaches the service, rewrite `README.md`, `docs/index.md` and the description in
   `skills/gcal-cli/SKILL.md` to say what the tool does and who it is for.

<!-- cli-template:reference-cli:start -->
## Reference CLI

No reference CLI for this category yet: pick the nearest one with the owner from the Reference CLIs page.
<!-- cli-template:reference-cli:end -->

## Template-owned files

`template.json` names the files `npx @wirecat/cli-template upgrade` keeps in step with the template. Change one of
them here only when this CLI needs to differ; `upgrade` asks before it touches your change.
