import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring } from "@wirecat/cli-base"
import { rememberAccount } from "@wirecat/cli-core/cli"
import { syncAfterInstallCases } from "@wirecat/cli-core/testing"
import { describe, it } from "vitest"
import { CALENDAR_READ_SCOPE, sessionStorage } from "./google.js"
import { IDENTITY } from "./identity.js"
import { run } from "./program.js"
import { fakeGoogleCalendar } from "./testing/google-calendar.js"

const signedIn = () => {
  const keyring = memoryKeyring()
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
    GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
    MESSAGING_STORE: join(mkdtempSync(join(tmpdir(), "store-")), "wirecat.db"),
  }
  sessionStorage(env, "personal", keyring).write({
    tokens: {
      accessToken: "fixture-access",
      refreshToken: "fixture-refresh",
      expiresAt: Date.now() + 3_600_000,
      scopes: [CALENDAR_READ_SCOPE],
    },
    client: { clientId: "fixture-client.apps" },
  })
  rememberAccount(IDENTITY, "personal", "owner@example.com", env)
  return { env, keyring }
}

describe("sync runs right after install, whatever the shared WireCat config holds", () => {
  for (const one of syncAfterInstallCases({
    sync: ["personal", "sync"],
    run: async (argv, extra) => {
      const { env, keyring } = signedIn()
      const err: string[] = []
      const code = await run(argv, {
        streams: { data: () => {}, diagnostic: (text) => err.push(text) },
        tty: false,
        env: { ...env, ...extra },
        keyring,
        fetch: fakeGoogleCalendar([]).fetch as typeof fetch,
      })
      return { code, err: err.join("\n") }
    },
  }))
    it(one.name, () => one.run())
})
