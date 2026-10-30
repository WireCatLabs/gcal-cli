import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { packContents } from "@wirecat/cli-base/release"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isPackage = (value: unknown): value is { name: string; version: string } =>
  isRecord(value) && typeof value.name === "string" && typeof value.version === "string"

// A fixed list, not package.json's own `files`: a path added there by mistake must fail here.
const PACKED = ["dist/", "scenarios/", "skills/", "package.json", "README.md", "CHANGELOG.md", "LICENSE"]

const root = resolve(import.meta.dirname, "..")
const pkg: unknown = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
assert.ok(isPackage(pkg), "package.json needs a name and a version")
const { name, version } = pkg
assert.deepEqual(packContents(root, PACKED, PACKED.join(", "))(), [])
const temp = mkdtempSync(join(tmpdir(), "gcal-package-"))
try {
  const userConfig = join(temp, "npm-user-config")
  writeFileSync(userConfig, "")
  const npmEnv = { ...process.env, NPM_CONFIG_USERCONFIG: userConfig }
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", temp], {
      cwd: root,
      encoding: "utf8",
      env: npmEnv,
    }),
  )
  assert.equal(packed.length, 1)
  const installed = join(temp, "installed")
  mkdirSync(installed)
  execFileSync(
    "npm",
    ["install", "--prefix", installed, "--ignore-scripts", "--no-audit", "--no-fund", join(temp, packed[0].filename)],
    { encoding: "utf8", env: npmEnv, stdio: "pipe" },
  )
  const env = {
    ...process.env,
    NODE_OPTIONS: "",
    HOME: temp,
    GCAL_CONFIG_DIR: join(temp, "config"),
    GCAL_STATE_DIR: join(temp, "state"),
    GCAL_CACHE_DIR: join(temp, "cache"),
    WIRECAT_STATE_DIR: join(temp, "wirecat"),
    MESSAGING_STORE: join(temp, "never-owner.db"),
    GCAL_NO_UPDATE_CHECK: "1",
  }
  const bin = join(installed, "node_modules", name, "dist/bin/gcal.js")
  const run = (args: string[]) =>
    execFileSync(process.execPath, [bin, ...args], { cwd: temp, env, encoding: "utf8", timeout: 20000 })
  assert.equal(run(["--version"]).trim(), version)
  assert.match(run(["--help"]), /Usage: gcal/)
  const tree: unknown = JSON.parse(run(["commands", "--json"]))
  const names =
    isRecord(tree) && Array.isArray(tree.commands)
      ? tree.commands.map((command) => isRecord(command) && command.name)
      : []
  for (const root of ["commands", "doctor", "guide", "skill", "mcp", "upgrade", "config"])
    assert.ok(names.includes(root), `${root} is missing from the installed package`)
  assert.equal(JSON.parse(run(["doctor", "--json"])).item.version, version)
  assert.match(run(["skill", "show"]), /name: gcal-cli/)
  assert.match(run(["guide"]), /set-up/)
  console.log(`installed ${name}@${version}: help, version, commands, doctor, skill and guide answer offline`)
} finally {
  rmSync(temp, { recursive: true, force: true })
}
