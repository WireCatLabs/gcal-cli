import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring, resolvePaths } from "@wirecat/cli-base"
import { checkpointPath, holdLock, releaseLock } from "@wirecat/cli-core/background"
import { accountFileFor } from "@wirecat/cli-core/cli"
import { afterEach, describe, expect, it, vi } from "vitest"
import { feedRegistry } from "./feeds.js"
import { CALENDAR_READ_SCOPE, holdsSignIn } from "./google.js"
import { IDENTITY } from "./identity.js"
import { run } from "./program.js"

const realFetch = globalThis.fetch
const paths = (env: NodeJS.ProcessEnv) => resolvePaths({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env })
const GRANTED = `openid https://www.googleapis.com/auth/userinfo.email ${CALENDAR_READ_SCOPE}`
const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } })

const setup = async () => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
    GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
  }
  const keyring = memoryKeyring()
  const requests: string[] = []
  let email = "owner@example.com"
  const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    requests.push(`${url} ${String(init?.body ?? "")}`)
    if (url === "https://oauth2.googleapis.com/token")
      return json({
        access_token: "access",
        refresh_token: `refresh-of-${email}`,
        expires_in: 3600,
        scope: GRANTED,
        token_type: "Bearer",
      })
    if (url === "https://openidconnect.googleapis.com/v1/userinfo")
      return json({ sub: "1", email, email_verified: true })
    return json({})
  })
  const gcal = async (argv: string[]) => {
    const out: string[] = []
    const err: string[] = []
    const file = join(mkdtempSync(join(tmpdir(), "client-")), "client.json")
    writeFileSync(file, JSON.stringify({ installed: { client_id: "synthetic.apps", client_secret: "synthetic" } }), {
      mode: 0o600,
    })
    const code = await run(
      argv.map((word) => (word === "<client>" ? file : word)),
      {
        streams: {
          data: (text) => out.push(text),
          diagnostic: (text) => {
            err.push(text)
            const printed = /^Open Google sign-in: (\S+)/.exec(text)?.[1]
            if (printed) void consent(printed)
          },
        },
        tty: false,
        env,
        keyring,
        fetch,
      },
    )
    return { code, out: out.join("\n"), err: err.join("\n") }
  }
  const consent = async (url: string) => {
    const authorize = new URL(url)
    const back = new URL(authorize.searchParams.get("redirect_uri") ?? "")
    back.searchParams.set("state", authorize.searchParams.get("state") ?? "")
    back.searchParams.set("code", "synthetic-code")
    await realFetch(back)
  }
  const signIn = async (profile: string, address: string) => {
    email = address
    const started = await gcal([profile, "session", "start", "--client-file", "<client>", "--no-browser", "--json"])
    expect(started.code).toBe(0)
    await feedRegistry(env, profile, keyring).write([{ id: "feed", url: "https://example.com/a.ics", title: null }])
    mkdirSync(join(paths(env).state, "checkpoints", profile), { recursive: true })
    writeFileSync(join(paths(env).state, "checkpoints", profile, "events-sync.json"), "{}")
  }
  await signIn("personal", "owner@example.com")
  await signIn("work", "work@example.com")
  vi.stubGlobal("fetch", fetch)
  requests.length = 0
  const remove = async (...args: string[]) => {
    const result = await gcal(["personal", "account", "remove", "--json", "--yes", ...args])
    const failed = result.err.trim().startsWith("{")
    return {
      code: result.code,
      item: result.out ? JSON.parse(result.out).item : undefined,
      error: failed ? JSON.parse(result.err.trim().split("\n").at(-1) ?? "").error : undefined,
    }
  }
  const feeds = (profile: string) => feedRegistry(env, profile, keyring).read()
  return { env, keyring, requests, remove, feeds, gcal }
}

describe("gcal account remove", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("refuses to choose what happens to the data", async () => {
    const t = await setup()
    expect((await t.remove()).error).toMatchObject({ reason: "account-remove.no-choice" })
    expect(holdsSignIn(t.env, "personal", t.keyring)).toBe(true)
  })

  it("revokes the sign-in, forgets the feeds and the profile, and leaves the other profile alone", async () => {
    const t = await setup()
    const { item } = await t.remove("--keep-data")

    expect(item.account).toEqual({ provider: "google-calendar", account: "owner@example.com" })
    expect(item.revoked).toBe(true)
    expect(t.requests).toHaveLength(1)
    expect(t.requests[0]).toContain("https://oauth2.googleapis.com/revoke")
    expect(t.requests[0]).toContain("refresh-of-owner%40example.com")
    expect(holdsSignIn(t.env, "personal", t.keyring)).toBe(false)
    expect(await t.feeds("personal")).toEqual([])
    expect(existsSync(accountFileFor(IDENTITY, "personal", t.env))).toBe(false)
    expect(existsSync(join(paths(t.env).state, "checkpoints", "personal"))).toBe(false)

    expect(holdsSignIn(t.env, "work", t.keyring)).toBe(true)
    expect(await t.feeds("work")).toHaveLength(1)
    expect(existsSync(accountFileFor(IDENTITY, "work", t.env))).toBe(true)
    expect(existsSync(join(paths(t.env).state, "checkpoints", "work"))).toBe(true)
  })

  it("deletes the account's calendars from the store with --delete-data", async () => {
    const t = await setup()
    const { item } = await t.remove("--delete-data")

    expect(item.removed).toContainEqual({ kind: "store", target: "google-calendar:owner@example.com" })
    expect(holdsSignIn(t.env, "work", t.keyring)).toBe(true)
  })

  it("keeps the stored calendars with --keep-data and says so", async () => {
    const t = await setup()
    const { item } = await t.remove("--keep-data")

    expect(item.kept).toContainEqual(
      expect.objectContaining({ kind: "store", target: "google-calendar:owner@example.com" }),
    )
  })

  it("lists what it would remove with --dry-run and changes nothing", async () => {
    const t = await setup()
    const { item } = await t.remove("--delete-data", "--dry-run")

    expect(item.dry_run).toBe(true)
    expect(item.removed).toContainEqual({ kind: "keyring", target: "feeds:personal" })
    expect(t.requests).toEqual([])
    expect(holdsSignIn(t.env, "personal", t.keyring)).toBe(true)
    expect(await t.feeds("personal")).toHaveLength(1)
  })

  it("succeeds for a profile that is already signed out", async () => {
    const t = await setup()
    await t.gcal(["personal", "session", "end", "--json"])
    t.requests.length = 0

    const { item, error } = await t.remove("--keep-data")

    expect(error).toBeUndefined()
    expect(item.revoked).toBeNull()
    expect(t.requests).toEqual([])
    expect(await t.feeds("personal")).toEqual([])
  })

  it("refuses while an events remind run holds the profile and removes nothing", async () => {
    const t = await setup()
    const lock = `${checkpointPath(paths(t.env).state, "personal", "events-remind")}.lock`
    holdLock(lock, { pid: process.pid, startedAt: new Date().toISOString() })
    try {
      expect((await t.remove("--delete-data")).error).toMatchObject({ reason: "account-remove.busy" })
    } finally {
      releaseLock(lock)
    }
    expect(holdsSignIn(t.env, "personal", t.keyring)).toBe(true)
    expect(await t.feeds("personal")).toHaveLength(1)
  })
})
