/**
 * The published bin is a loader for `dist/bundle/` (cli-base's `cli-dev bundle`, WC-LAY-10). This runs it, with
 * folders of its own, under Node (`pnpm smoke:node`) and Bun (`pnpm smoke:bun`): the vitest suite runs against
 * `src/`, so this is the proof that the bundle a user installs works.
 *
 *   pnpm build && pnpm smoke:node
 */
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const COMMAND = "gcal"
const PREFIX = "GCAL"

const runtime = typeof (globalThis as { Bun?: unknown }).Bun === "undefined" ? "node" : "bun"
const failures: string[] = []
const check = (what: string, condition: boolean) => {
  if (!condition) failures.push(what)
}

const isolated = mkdtempSync(join(tmpdir(), `${COMMAND}-bundle-smoke-`))
const store = join(isolated, "store.db")
const run = (args: string[], env: Record<string, string> = {}) =>
  spawnSync(process.execPath, [`dist/bin/${COMMAND}.js`, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: isolated,
      [`${PREFIX}_CONFIG_DIR`]: join(isolated, "config"),
      [`${PREFIX}_STATE_DIR`]: join(isolated, "state"),
      [`${PREFIX}_CACHE_DIR`]: join(isolated, "cache"),
      [`${PREFIX}_NO_UPDATE_CHECK`]: "1",
      WIRECAT_STATE_DIR: join(isolated, "wirecat"),
      MESSAGING_STORE: store,
      ...env,
    },
  })

const loader = readFileSync(`dist/bin/${COMMAND}.js`, "utf8")
check("the bin starts the bundle", loader.includes(`import("../bundle/${COMMAND}.js")`))
const preloaded = [...loader.matchAll(/"\.\.\/bundle\/([^"]+)"/g)].map(([, chunk]) => chunk ?? "")
check(
  "a server preloads only chunks the bundle has",
  preloaded.length > 1 && preloaded.every((chunk) => existsSync(join("dist/bundle", chunk))),
)

const version = run(["--version"])
check("--version prints a version and nothing else", /^\d+\.\d+\.\d+\n$/.test(version.stdout) && version.stderr === "")
const recorded = run(["--version"], { [`${PREFIX}_TEST_ARGV_LOG`]: join(isolated, "argv.jsonl") })
check("the loader's --version is the bundle's", recorded.stdout === version.stdout)
check("--help names the command", run(["--help"]).stdout.includes(`Usage: ${COMMAND}`))
check("commands lists the calendar commands", run(["commands", "--json"]).stdout.includes('"name":"calendars"'))
check("skill show prints the SKILL.md the package ships", run(["skill", "show"]).stdout.startsWith("---"))
check("guide finds the scenarios the package ships", run(["guide"]).stdout.includes("set-up"))
check("doctor names this run's store", run(["doctor", "--json"]).stdout.includes(JSON.stringify(store)))
rmSync(isolated, { recursive: true, force: true })

if (failures.length > 0) {
  console.error(`${COMMAND} bundle smoke FAILED under ${runtime}:`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log(`${COMMAND} bundle smoke passed under ${runtime}`)
