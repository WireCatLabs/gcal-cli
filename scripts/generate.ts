import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import {
  adaptDiscovery,
  coverageGenerator,
  definitionsGenerator,
  generate,
  manifestGenerator,
  readDiscovery,
  typesGenerator,
  valibotGenerator,
  writeArtifacts,
} from "@wirecat/cli-base/codegen"

const root = resolve(import.meta.dirname, "..")
const webhook = "needs a public HTTPS address to receive Google's notifications, which a local CLI does not have"
const { model, metadata, services } = adaptDiscovery(readDiscovery(`${root}/spec/google`), {
  sourceRevision: "spec/google/provenance.json",
  exclude: {
    "calendar.events.watch": webhook,
    "calendar.calendarList.watch": webhook,
    "calendar.acl.watch": webhook,
    "calendar.settings.watch": webhook,
    "calendar.channels.stop": "stops a notification channel, and gcal never opens one",
  },
})
const artifacts = generate(
  model,
  [
    typesGenerator({ path: "src/generated/types.ts" }),
    valibotGenerator({ path: "src/generated/schemas.ts", typesImport: "./types.js" }),
    manifestGenerator({ path: "src/generated/manifest.ts" }),
    definitionsGenerator({ path: "src/generated/definitions.ts" }),
    coverageGenerator({
      path: "docs/dev/API_COVERAGE.md",
      title: "Google Calendar API coverage",
      command: (op) => `gcal <profile> api ${op.command}`,
    }),
  ],
  {
    banner: ["Source: spec/google/*.json, verified by provenance.json", "Run: pnpm generate"],
    overrides: {
      "calendar.freebusy.query": { effect: "read", reason: "a POST that only reads when calendars are busy" },
      "calendar.calendars.clear": {
        effect: "destructive",
        reason: "a POST that deletes every event of the primary calendar",
      },
      "calendar.calendars.transferOwnership": {
        effect: "destructive",
        reason: "a POST that gives the calendar to another account; the owner loses it",
      },
    },
  },
)
artifacts.push({
  path: "src/generated/metadata.ts",
  content: `export const metadata = ${JSON.stringify({ ...metadata, services }, null, 2)}\n`,
})
const format = (path: string, content: string) =>
  path.endsWith(".ts")
    ? execFileSync(
        process.execPath,
        [`${root}/node_modules/@biomejs/biome/bin/biome`, "check", "--write", `--stdin-file-path=${path}`],
        { cwd: root, encoding: "utf8", input: content },
      )
    : content
const stale = writeArtifacts(artifacts, { root, check: process.argv.includes("--check"), format })
if (process.argv.includes("--check") && stale.length) {
  process.stderr.write(`Generated files are stale: ${stale.join(", ")}; run pnpm generate\n`)
  process.exitCode = 1
}
process.stderr.write(`${model.operations.length} operations generated from a verified offline snapshot\n`)
