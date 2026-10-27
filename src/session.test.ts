import { chmodSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring } from "@wirecat/cli-base"
import { openStore, storePath } from "@wirecat/cli-core/store"
import { describe, expect, it, vi } from "vitest"
import { CALENDAR_READ_SCOPE, googleClient, sessionStorage } from "./google.js"
import { run } from "./program.js"

const ACCESS = "fixture-access-token-7Qm2"
const REFRESHED = "fixture-refreshed-token-9Kd4"
const REFRESH = "fixture-refresh-token-3Xv8"
const SECRET = "fixture-client-secret-5Lp1"
const MARKERS = [ACCESS, REFRESHED, REFRESH, SECRET, "fixture-code"]
const GRANTED = `openid https://www.googleapis.com/auth/userinfo.email ${CALENDAR_READ_SCOPE}`

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })

const google = (
  options: { email?: string; scope?: string; expiresIn?: number; userinfo?: () => Promise<Response> } = {},
) => {
  const requests: { url: string; body: string; authorization: string | null }[] = []
  const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const headers = new Headers(init?.headers)
    requests.push({ url, body: String(init?.body ?? ""), authorization: headers.get("authorization") })
    if (url === "https://oauth2.googleapis.com/token") {
      const grant = new URLSearchParams(String(init?.body)).get("grant_type")
      return json({
        access_token: grant === "refresh_token" ? REFRESHED : ACCESS,
        ...(grant === "authorization_code" ? { refresh_token: REFRESH } : {}),
        expires_in: options.expiresIn ?? 3600,
        scope: options.scope ?? GRANTED,
        token_type: "Bearer",
      })
    }
    if (url === "https://openidconnect.googleapis.com/v1/userinfo")
      return (
        options.userinfo?.() ?? json({ sub: "1", email: options.email ?? "owner@example.com", email_verified: true })
      )
    return json({ error: "not_found" }, 404)
  })
  return { fetch, requests }
}

// Answers Google's loopback redirect as the browser would after consent.
const consent = async (url: string) => {
  const authorize = new URL(url)
  const back = new URL(authorize.searchParams.get("redirect_uri") ?? "")
  back.searchParams.set("state", authorize.searchParams.get("state") ?? "")
  back.searchParams.set("code", "fixture-code")
  await globalThis.fetch(back)
}

const clientFile = (mode = 0o600) => {
  const file = join(mkdtempSync(join(tmpdir(), "client-")), "client.json")
  writeFileSync(file, JSON.stringify({ installed: { client_id: "fixture-client.apps", client_secret: SECRET } }))
  chmodSync(file, mode)
  return file
}

const harness = () => {
  const keyring = memoryKeyring()
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
    GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
  }
  const opened: string[] = []
  const gcal = async (argv: string[], fake = google()) => {
    const out: string[] = []
    const err: string[] = []
    const code = await run(argv, {
      streams: {
        data: (text) => out.push(text),
        diagnostic: (text) => {
          err.push(text)
          // With --no-browser the owner opens the printed address by hand.
          const printed = /^Open Google sign-in: (\S+)/.exec(text)?.[1]
          if (printed && argv.includes("--no-browser")) void consent(printed)
        },
      },
      tty: false,
      env,
      keyring,
      fetch: fake.fetch,
      openBrowser: async (url: string) => {
        opened.push(url)
        await consent(url)
      },
    })
    return { code, out: out.join("\n"), err: err.join("\n") }
  }
  return { gcal, env, keyring, opened }
}

const item = (text: string) => JSON.parse(text).item
const failure = (err: string) => JSON.parse(err.trim().split("\n").at(-1) ?? "").error
const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? filesUnder(path) : [path]
  })

describe("session start", () => {
  it("signs in with read-only Calendar access, remembers the account and registers the provider", async () => {
    const { gcal, env, opened } = harness()
    const fake = google()
    const file = clientFile()
    const started = await gcal(["personal", "session", "start", "--client-file", file, "--json"], fake)
    expect(started.code).toBe(0)
    expect(item(started.out)).toEqual({
      profile: "personal",
      signed_in: true,
      account: "owner@example.com",
      scopes: GRANTED.split(" "),
    })

    const authorize = new URL(opened[0] ?? "")
    expect(authorize.origin + authorize.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth")
    expect(authorize.searchParams.get("scope")).toBe(`openid email ${CALENDAR_READ_SCOPE}`)
    expect(authorize.searchParams.get("access_type")).toBe("offline")
    expect(authorize.searchParams.get("code_challenge_method")).toBe("S256")
    expect(started.err).toContain('"open_url"')

    const [exchange, lookup] = fake.requests
    const exchanged = new URLSearchParams(exchange?.body)
    expect([exchanged.get("grant_type"), exchanged.get("client_secret")]).toEqual(["authorization_code", SECRET])
    expect(lookup).toEqual({
      url: "https://openidconnect.googleapis.com/v1/userinfo",
      body: "",
      authorization: `Bearer ${ACCESS}`,
    })

    const store = await openStore({ path: storePath(env), env, command: "gcal" })
    try {
      expect(await store.accounts.profiles()).toMatchObject({
        gcal: { personal: { provider: "google-calendar", account: "owner@example.com" } },
      })
    } finally {
      await store.close()
    }
  })

  it("keeps the client secret so a later refresh works without the client file", async () => {
    const { gcal } = harness()
    expect(
      (await gcal(["work", "session", "start", "--client-file", clientFile()], google({ expiresIn: 1 }))).code,
    ).toBe(0)
    const fake = google({ email: "owner@example.com" })
    const status = await gcal(["work", "session", "status", "--check", "--json"], fake)
    expect(status.code).toBe(0)
    expect(item(status.out)).toMatchObject({ state: "saved", verified: true, account: "owner@example.com" })
    const refresh = new URLSearchParams(fake.requests[0]?.body)
    expect(refresh.get("grant_type")).toBe("refresh_token")
    expect(refresh.get("refresh_token")).toBe(REFRESH)
    expect(refresh.get("client_secret")).toBe(SECRET)
    expect(fake.requests[1]?.authorization).toBe(`Bearer ${REFRESHED}`)
  })

  it("refuses a sign-in that left Calendar unticked, and saves nothing", async () => {
    const { gcal } = harness()
    const refused = await gcal(
      ["personal", "session", "start", "--client-file", clientFile(), "--json"],
      google({ scope: "openid https://www.googleapis.com/auth/userinfo.email" }),
    )
    expect(refused.code).not.toBe(0)
    expect(failure(refused.err)).toMatchObject({ code: "permission_error", reason: "sign-in.scope-missing" })
    expect(item((await gcal(["personal", "session", "status", "--json"])).out)).toMatchObject({ state: "missing" })
  })

  it("refuses another account on the same profile, and the same account on a second profile", async () => {
    const { gcal } = harness()
    const file = clientFile()
    expect((await gcal(["home", "session", "start", "--client-file", file])).code).toBe(0)
    const other = await gcal(
      ["home", "session", "start", "--client-file", file, "--json"],
      google({ email: "someone@example.com" }),
    )
    expect(failure(other.err).reason).toBe("profile.wrong-account")
    const twice = await gcal(["second", "session", "start", "--client-file", file, "--json"])
    expect(failure(twice.err).reason).toBe("profile.same-account")
  })

  it("never prints, logs or records a token or the client secret", async () => {
    const { gcal } = harness()
    const file = clientFile()
    const results = [
      await gcal(
        ["--record", "personal", "session", "start", "--client-file", file, "--json"],
        google({ expiresIn: 1 }),
      ),
      await gcal(["--record", "personal", "session", "status", "--check", "--json"]),
      await gcal(
        ["--record", "personal", "session", "start", "--client-file", file, "--json"],
        google({ scope: "openid" }),
      ),
      await gcal(["--record", "personal", "runs", "list", "--limit", "20", "--json"]),
      await gcal(["--record", "personal", "session", "end", "--json"]),
    ]
    const printed = results.map(({ out, err }) => out + err).join("\n")
    const onDisk = filesUnder(tmpdir())
      .filter((path) => !path.startsWith(join(tmpdir(), "client-")) && statSync(path).size < 50_000_000)
      .map((path) => readFileSync(path).toString("latin1"))
      .join("\n")
    expect(printed).toContain("owner@example.com")
    expect(onDisk).toContain("--client-file")
    for (const marker of MARKERS) {
      expect(printed).not.toContain(marker)
      expect(onDisk).not.toContain(marker)
    }
  })

  it("prints the address instead of opening a browser with --no-browser", async () => {
    const { gcal, opened } = harness()
    const started = await gcal([
      "personal",
      "session",
      "start",
      "--no-browser",
      "--client-file",
      clientFile(),
      "--json",
    ])
    expect(started.code).toBe(0)
    expect(opened).toEqual([])
    expect(started.err).toContain("Open Google sign-in: https://accounts.google.com/o/oauth2/v2/auth?")
  })
})

describe("the account lookup", () => {
  it.each([
    ["no answer", () => Promise.reject(new TypeError("fetch failed")), "sign-in.lookup-unavailable"],
    ["a refusal", () => Promise.resolve(json({ error: "invalid_token" }, 401)), "sign-in.lookup-refused"],
    [
      "an unverified address",
      () => Promise.resolve(json({ email: "owner@example.com", email_verified: false })),
      "sign-in.no-email",
    ],
    ["no address", () => Promise.resolve(json({ sub: "1" })), "sign-in.no-email"],
  ])("refuses the sign-in on %s, and saves nothing", async (_case, userinfo, reason) => {
    const { gcal } = harness()
    const refused = await gcal(
      ["personal", "session", "start", "--client-file", clientFile(), "--json"],
      google({ userinfo }),
    )
    expect(failure(refused.err).reason).toBe(reason)
    expect(item((await gcal(["personal", "session", "status", "--json"])).out)).toMatchObject({ state: "missing" })
  })

  it("status --check refuses a sign-in that now answers for another account", async () => {
    const { gcal } = harness()
    expect((await gcal(["personal", "session", "start", "--client-file", clientFile()])).code).toBe(0)
    const checked = await gcal(
      ["personal", "session", "status", "--check", "--json"],
      google({ email: "someone@example.com" }),
    )
    expect(failure(checked.err).reason).toBe("profile.wrong-account")
  })

  it("drops the old client secret when signing in again with a client that has none", async () => {
    const { gcal, env, keyring } = harness()
    expect((await gcal(["personal", "session", "start", "--client-file", clientFile()])).code).toBe(0)
    env.GCAL_GOOGLE_CLIENT_ID = "fixture-public-client"
    expect((await gcal(["personal", "session", "start"])).code).toBe(0)
    const saved = sessionStorage(env, "personal", keyring).read()
    expect(saved?.client).toEqual({ clientId: "fixture-public-client" })
  })
})

describe("session status and end", () => {
  it("answers missing before a sign-in, and end says when nothing was signed in", async () => {
    const { gcal } = harness()
    expect(item((await gcal(["personal", "session", "status", "--json"])).out)).toEqual({
      profile: "personal",
      state: "missing",
      account: null,
      verified: false,
    })
    expect(item((await gcal(["personal", "session", "end", "--json"])).out)).toMatchObject({ ended: false })
  })

  it("ends the sign-in but keeps the account the profile is", async () => {
    const { gcal } = harness()
    expect((await gcal(["personal", "session", "start", "--client-file", clientFile()])).code).toBe(0)
    expect(item((await gcal(["personal", "session", "status", "--json"])).out)).toMatchObject({
      state: "saved",
      account: "owner@example.com",
      verified: false,
    })
    expect(item((await gcal(["personal", "session", "end", "--json"])).out)).toEqual({
      profile: "personal",
      ended: true,
      cached_data: "retained",
    })
    expect(item((await gcal(["personal", "session", "status", "--json"])).out)).toMatchObject({
      state: "missing",
      account: "owner@example.com",
    })
  })

  it("records each session run with its account lookup", async () => {
    const { gcal } = harness()
    await gcal(["--record", "personal", "session", "start", "--client-file", clientFile(), "--json"])
    await gcal(["--record", "personal", "session", "status", "--check", "--json"])
    await gcal(["--record", "personal", "session", "end", "--json"])
    const runs = JSON.parse((await gcal(["personal", "runs", "list", "--json"])).out).items as {
      command: string
      status: string
      requests: number
      operations: string[]
    }[]
    const of = (command: string) => runs.find((run) => run.command === command)
    expect(of("session start")).toMatchObject({ status: "success", operations: ["GET /v1/userinfo"] })
    expect(of("session status")).toMatchObject({ status: "success", requests: 1, operations: ["GET /v1/userinfo"] })
    expect(of("session end")).toMatchObject({ status: "success" })
  })

  it("refuses --check offline", async () => {
    const { gcal } = harness()
    const refused = await gcal(["--offline", "personal", "session", "status", "--check", "--json"])
    expect(failure(refused.err).reason).toBe("offline.refused")
  })
})

describe("the owner's Google client", () => {
  it("says how to set one up when none is given", () => {
    expect(() => googleClient({})).toThrow(/--client-file <path>.*GCAL_GOOGLE_CLIENT_ID and GCAL_GOOGLE_CLIENT_SECRET/)
  })

  it("reads the environment, and refuses a secret without an id", () => {
    expect(googleClient({ GCAL_GOOGLE_CLIENT_ID: "id", GCAL_GOOGLE_CLIENT_SECRET: SECRET })).toEqual({
      clientId: "id",
      clientSecret: SECRET,
    })
    expect(() => googleClient({ GCAL_GOOGLE_CLIENT_SECRET: SECRET })).toThrow(/requires GCAL_GOOGLE_CLIENT_ID/)
  })

  it.skipIf(process.platform === "win32")("refuses a client file other users can read", () => {
    expect(() => googleClient({}, clientFile(0o644))).toThrow(/chmod 600/)
  })

  it("refuses a file that is not a Desktop client, without quoting it", () => {
    const file = clientFile()
    writeFileSync(file, JSON.stringify({ web: { client_secret: SECRET } }))
    expect(() => googleClient({}, file)).toThrow(/^could not read a Desktop app OAuth client JSON[^{]*$/)
  })
})
