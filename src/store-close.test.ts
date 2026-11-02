import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring } from "@wirecat/cli-base"
import { rememberAccount } from "@wirecat/cli-core/cli"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CALENDAR_READ_SCOPE, sessionStorage } from "./google.js"
import { IDENTITY } from "./identity.js"
import { run } from "./program.js"

const order: string[] = []
const opens: string[] = []
let failClose = false

vi.mock("./store.js", async (original) => {
  const real = await original<typeof import("./store.js")>()
  return {
    ...real,
    openGcalStore: async (env: NodeJS.ProcessEnv, options?: { readOnly?: boolean }) => {
      const store = await real.openGcalStore(env, options)
      opens.push(options?.readOnly ? "read-only" : "writable")
      return new Proxy(store, {
        get: (target, key, receiver) =>
          key === "close"
            ? async () => {
                order.push("close")
                await target.close()
                if (failClose) throw new Error("fixture close failure")
              }
            : Reflect.get(target, key, receiver),
      })
    },
  }
})

const signedIn = () => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
    GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
    MESSAGING_STORE: join(mkdtempSync(join(tmpdir(), "store-")), "wirecat.db"),
  }
  const keyring = memoryKeyring()
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
  return (...argv: string[]) =>
    run(argv, {
      streams: { data: () => order.push("answer"), diagnostic: () => undefined },
      tty: false,
      env,
      keyring,
    })
}

const gcal = (...argv: string[]) => signedIn()(...argv)

describe("the store of a calendar command (WC-LIFE-4)", () => {
  beforeEach(() => {
    order.length = 0
    opens.length = 0
    failClose = false
  })

  it("closes before the answer is printed, once", async () => {
    expect(await gcal("personal", "events", "list", "--json")).toBe(0)
    expect(order).toEqual(["close", "answer"])
  })

  it("prints no answer when the close fails", async () => {
    failClose = true
    expect(await gcal("personal", "events", "list", "--json")).not.toBe(0)
    expect(order[0]).toBe("close")
    expect(order).not.toContain("answer")
  })

  it("a read opens it read-only once the profile's rows are stored; the first read and a search open it to write", async () => {
    const gcal = signedIn()
    expect(await gcal("personal", "events", "list", "--json")).toBe(0)
    expect(await gcal("personal", "events", "list", "--json")).toBe(0)
    expect(await gcal("personal", "store", "status", "--json")).toBe(0)
    expect(await gcal("personal", "search", "events", "planning", "--json")).toBe(0)
    expect(opens).toEqual(["writable", "read-only", "read-only", "writable"])
  })
})
