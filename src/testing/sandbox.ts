import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, afterEach } from "vitest"
import { ARGV_LOG } from "./argv-log.js"

const saved = { ...process.env }

// cli-base's setup already gave this file a fresh TMPDIR and HOME, a keyring that throws and no network, and points
// every folder and store variable at them (WC-TEST-1, WC-STORE-14). The config folder is set only because tests
// write into it by name.
process.env.GCAL_CONFIG_DIR = join(tmpdir(), "config")
process.env.GCAL_NO_UPDATE_CHECK = "1"
process.env.GCAL_TEST_ARGV_LOG = ARGV_LOG
delete process.env.GCAL_PROFILE
delete process.env.GCAL_READ_ONLY
delete process.env.AI_AGENT
delete process.env.CLAUDECODE

// cli-base's stand-in for the keyring throws, but a keyring in `auto` mode catches that, warns and falls back to a
// file, so a test that reached the keyring still passed. Resolved from cli-base's own folder: a CLI's require finds a
// different copy, which cli-base never loads.
const require = createRequire(join(process.cwd(), "package.json"))
const keyringModule = require.cache[createRequire(require.resolve("@wirecat/cli-base")).resolve("@napi-rs/keyring")]
const StandIn = keyringModule?.exports.Entry
if (!keyringModule || !StandIn) throw new Error("cli-base's keyring stand-in is not installed")
let reached: string | undefined
keyringModule.exports = {
  Entry: class {
    constructor(...args: unknown[]) {
      reached ??= new Error("the real OS keyring was reached here").stack
      // biome-ignore lint/correctness/noConstructorReturn: hands back the stand-in, which throws
      return new StandIn(...args)
    }
  },
}
afterEach(() => {
  const stack = reached
  reached = undefined
  if (stack) throw new Error(`a test reached the real OS keyring; pass memoryKeyring() instead\n${stack}`)
})

afterAll(() => {
  for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]
  Object.assign(process.env, saved)
})
