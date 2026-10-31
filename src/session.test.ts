import { chmodSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { brokenKeyring, type KeyringStore, memoryKeyring, systemKeyring } from "@wirecat/cli-base"
import { openStore, storePath } from "@wirecat/cli-core/store"
import { describe, expect, it, vi } from "vitest"
import { CALENDAR_READ_SCOPE, googleClient, sessionStorage } from "./google.js"
import { ACLS_SCOPE, EVENTS_SCOPE } from "./grants.js"
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

const homeOnly = () => {
  const home = mkdtempSync(join(tmpdir(), "home-"))
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("GCAL_")))
  const xdg = {
    XDG_CONFIG_HOME: join(home, ".config"),
    XDG_DATA_HOME: join(home, ".local/share"),
    XDG_CACHE_HOME: join(home, ".cache"),
  }
  return { ...env, HOME: home, ...xdg }
}

// `paths: "default"` is the owner's layout: no GCAL_*_DIR, so the keyring service is plain `gcal-cli`.
const harness = (keyring: KeyringStore = memoryKeyring(), paths: "overridden" | "default" = "overridden") => {
  const env: NodeJS.ProcessEnv =
    paths === "default"
      ? homeOnly()
      : {
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
      grants: [],
      credential_storage: "keyring",
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

  it("--grant write also asks for calendar.events, and status shows it granted", async () => {
    const { gcal, opened } = harness()
    const fake = google({ scope: `${GRANTED} ${EVENTS_SCOPE}` })
    const started = await gcal(
      ["personal", "session", "start", "--client-file", clientFile(), "--grant", "write", "--json"],
      fake,
    )
    expect(item(started.out)).toMatchObject({ grants: ["write"] })
    expect(new URL(opened[0] ?? "").searchParams.get("scope")).toBe(
      `openid email ${CALENDAR_READ_SCOPE} ${EVENTS_SCOPE}`,
    )
    expect(item((await gcal(["personal", "session", "status", "--json"])).out)).toMatchObject({
      scopes: expect.arrayContaining([EVENTS_SCOPE]),
      grants: ["write"],
    })
  })

  it("--grant sharing asks for calendar.acls only, never the scope that empties calendars", async () => {
    const { gcal, opened } = harness()
    const fake = google({ scope: `${GRANTED} ${ACLS_SCOPE}` })
    const started = await gcal(
      ["personal", "session", "start", "--client-file", clientFile(), "--grant", "sharing", "--json"],
      fake,
    )
    expect(item(started.out)).toMatchObject({ grants: ["sharing"] })
    expect(new URL(opened[0] ?? "").searchParams.get("scope")).toBe(`openid email ${CALENDAR_READ_SCOPE} ${ACLS_SCOPE}`)
  })

  it("refuses --grant write when the account unticked it, and an unknown grant", async () => {
    const { gcal } = harness()
    const unticked = await gcal([
      "personal",
      "session",
      "start",
      "--client-file",
      clientFile(),
      "--grant",
      "write",
      "--json",
    ])
    expect(failure(unticked.err)).toMatchObject({ code: "permission_error", reason: "sign-in.scope-missing" })
    expect(failure(unticked.err).message).toContain("--grant write")
    expect(item((await gcal(["personal", "session", "status", "--json"])).out)).toMatchObject({ state: "missing" })
    const unknown = await gcal([
      "personal",
      "session",
      "start",
      "--client-file",
      clientFile(),
      "--grant",
      "admin",
      "--json",
    ])
    expect(failure(unknown.err)).toMatchObject({ code: "validation_error" })
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
    expect(failure(other.err).message).not.toContain("session start")
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
    expect(failure(checked.err).message).toContain("run gcal personal session start")
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

  const fakeSystemKeyring = (entries: Map<string, string>) => {
    const spies = [
      vi
        .spyOn(systemKeyring, "get")
        .mockImplementation((service, account) => entries.get(`${service}/${account}`) ?? null),
      vi.spyOn(systemKeyring, "set").mockImplementation((service, account, secret) => {
        entries.set(`${service}/${account}`, secret)
      }),
      vi
        .spyOn(systemKeyring, "delete")
        .mockImplementation((service, account) => entries.delete(`${service}/${account}`)),
      vi.spyOn(process.stderr, "write").mockReturnValue(true),
    ]
    return () => {
      for (const spy of spies) spy.mockRestore()
    }
  }
  const OWNER_ENTRY = "gcal-cli/oauth:google:personal"
  const SIGN_IN = {
    tokens: { accessToken: ACCESS, refreshToken: REFRESH, expiresAt: Date.now() + 3_600_000, scopes: [] },
    client: { clientId: "fixture-client.apps" },
  }
  /** The owner's entry as gcal saves it: written in a moved run, then moved under the shared service. */
  const withOwnerSignIn = (entries: Map<string, string>, env: NodeJS.ProcessEnv) => {
    sessionStorage(env, "personal").write(SIGN_IN)
    const [key, value] = [...entries].find(([one]) => one !== OWNER_ENTRY) ?? []
    if (!key || !value) throw new Error("the moved run saved no sign-in")
    entries.delete(key)
    entries.set(OWNER_ENTRY, value)
  }

  it("in a run with moved folders, end keeps the owner's keyring sign-in and says the run still reads it", async () => {
    const entries = new Map<string, string>()
    const restore = fakeSystemKeyring(entries)
    try {
      const { gcal, env } = harness(systemKeyring)
      withOwnerSignIn(entries, env)
      const ended = await gcal(["personal", "session", "end", "--json"])
      expect(item(ended.out)).toMatchObject({ profile: "personal", ended: false, kept: "keyring" })
      expect(item(ended.out).why).toContain("still signed in")
      expect([...entries.keys()]).toEqual([OWNER_ENTRY])
    } finally {
      restore()
    }
  })

  it("a sign-in in a run with moved folders goes to the run's own entry, which end removes", async () => {
    const entries = new Map<string, string>()
    const restore = fakeSystemKeyring(entries)
    try {
      const { gcal, env } = harness(systemKeyring)
      withOwnerSignIn(entries, env)
      const owner = entries.get(OWNER_ENTRY)
      sessionStorage(env, "personal").write(SIGN_IN)
      expect(entries.size).toBe(2)
      expect(entries.get(OWNER_ENTRY)).toBe(owner)
      const ended = await gcal(["personal", "session", "end", "--json"])
      expect(item(ended.out)).toMatchObject({ ended: true, kept: "keyring" })
      expect(item(ended.out).why).toContain("still signed in")
      expect([...entries.keys()]).toEqual([OWNER_ENTRY])
      expect(item((await gcal(["personal", "session", "status", "--json"])).out)).toMatchObject({ state: "saved" })
    } finally {
      restore()
    }
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

  it("reads a keyring sign-in saved before the sign-in file existed, without a new sign-in", async () => {
    const entry = {
      version: 1,
      provider: "google",
      clientId: "fixture-client.apps",
      accessToken: ACCESS,
      refreshToken: REFRESH,
      expiresAt: Date.now() + 3_600_000,
      scopes: GRANTED.split(" "),
      clientSecret: SECRET,
    }
    const keyring = memoryKeyring({ "gcal-cli:oauth:google:personal": JSON.stringify(entry) })
    const { gcal } = harness(keyring, "default")
    const status = await gcal(["personal", "session", "status", "--check", "--json"])
    expect(item(status.out)).toMatchObject({ state: "saved", credential_storage: "keyring", verified: true })
  })

  it("with no keyring and no sign-in file, status says missing and end has nothing to end", async () => {
    const { gcal } = harness(brokenKeyring("Platform failure: DBus error: Failed to connect to socket"), "default")
    for (const check of [[], ["--check"]]) {
      const status = await gcal(["personal", "session", "status", ...check, "--json"])
      expect(status.code).toBe(0)
      expect(item(status.out)).toEqual({
        profile: "personal",
        state: "missing",
        account: null,
        verified: false,
        keyring: "unreachable",
      })
      expect(status.out + status.err).not.toContain("DBus")
    }
    const ended = await gcal(["personal", "session", "end", "--json"])
    expect(ended.code).toBe(0)
    expect(item(ended.out)).toEqual({
      profile: "personal",
      ended: false,
      cached_data: "retained",
      keyring: "unreachable",
    })
  })

  it("refuses --check offline", async () => {
    const { gcal } = harness()
    const refused = await gcal(["--offline", "personal", "session", "status", "--check", "--json"])
    expect(failure(refused.err).reason).toBe("offline.refused")
  })
})

describe("session list", () => {
  const items = (text: string) => JSON.parse(text).items

  it("lists every profile with whether it holds a sign-in, without a profile and without picking one", async () => {
    const { gcal, env } = harness()
    writeFileSync(join(env.GCAL_CONFIG_DIR ?? "", "config.json"), JSON.stringify({ profiles: { work: {} } }))
    expect(items((await gcal(["session", "list", "--json"])).out)).toEqual([
      { profile: "work", signed_in: false, account: null, credential_storage: null },
    ])
    expect((await gcal(["personal", "session", "start", "--client-file", clientFile()])).code).toBe(0)
    expect(items((await gcal(["session", "list", "--json"])).out)).toEqual([
      { profile: "personal", signed_in: true, account: "owner@example.com", credential_storage: "keyring" },
      { profile: "work", signed_in: false, account: null, credential_storage: null },
    ])
    expect((await gcal(["personal", "session", "end"])).code).toBe(0)
    expect(items((await gcal(["session", "list", "--json"])).out)).toContainEqual({
      profile: "personal",
      signed_in: false,
      account: "owner@example.com",
      credential_storage: null,
    })
  })
})

describe("the owner's Google client", () => {
  it("says how to set one up when none is given; only the command names --client-file", async () => {
    expect(() => googleClient({})).toThrow(/GCAL_GOOGLE_CLIENT_ID and GCAL_GOOGLE_CLIENT_SECRET/)
    expect(() => googleClient({})).not.toThrow(/--client-file/)
    const { gcal, env } = harness()
    delete env.GCAL_GOOGLE_CLIENT_ID
    delete env.GCAL_GOOGLE_CLIENT_SECRET
    const refused = failure((await gcal(["personal", "session", "start", "--json"])).err)
    expect(refused).toMatchObject({ code: "configuration_error", reason: "sign-in.no-client" })
    expect(refused.message).toMatch(/GCAL_GOOGLE_CLIENT_ID.*--client-file <path>/)
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

describe("session start --credential-storage file", () => {
  const noKeyring: KeyringStore = {
    get: () => {
      throw new Error("no keyring here")
    },
    set: () => {
      throw new Error("no keyring here")
    },
    delete: () => {
      throw new Error("no keyring here")
    },
  }

  it("keeps the sign-in in a private file under the state folder where no keyring works", async () => {
    const { gcal, env } = harness(noKeyring)
    const fake = google()
    const start = ["personal", "session", "start", "--client-file", clientFile(), "--json"]
    expect(failure((await gcal(start, fake)).err).code).toBe("configuration_error")
    const started = await gcal([...start, "--credential-storage", "file"], fake)
    expect(started.code).toBe(0)
    expect(item(started.out)).toMatchObject({ signed_in: true, credential_storage: "file" })
    const file = join(env.GCAL_STATE_DIR ?? "", "credentials.json")
    if (process.platform !== "win32") expect(statSync(file).mode & 0o777).toBe(0o600)
    expect(JSON.parse(readFileSync(file, "utf8"))).toHaveProperty(["oauth:google:personal"])
    const status = await gcal(["personal", "session", "status", "--check", "--json"], fake)
    expect(item(status.out)).toMatchObject({ state: "saved", verified: true, credential_storage: "file" })
    expect(item((await gcal(["doctor", "--json"])).out).credential_file).toEqual({
      path: file,
      found: true,
      profiles: ["personal"],
      private: true,
    })
    expect((await gcal(["personal", "session", "end", "--json"])).code).toBe(0)
    expect(JSON.parse(readFileSync(file, "utf8"))).not.toHaveProperty(["oauth:google:personal"])
  })

  it("moves the sign-in back to the keyring on the next keyring sign-in", async () => {
    const { gcal, env } = harness()
    const fake = google()
    const start = ["personal", "session", "start", "--client-file", clientFile(), "--json"]
    expect((await gcal([...start, "--credential-storage", "file"], fake)).code).toBe(0)
    expect(item((await gcal(["personal", "session", "status", "--json"])).out)).toMatchObject({
      credential_storage: "file",
    })
    expect((await gcal(start, fake)).code).toBe(0)
    const file = JSON.parse(readFileSync(join(env.GCAL_STATE_DIR ?? "", "credentials.json"), "utf8"))
    expect(file["oauth:google:personal"]).toBeUndefined()
    expect(item((await gcal(["personal", "session", "status", "--json"])).out)).toMatchObject({
      credential_storage: "keyring",
    })
  })

  it("refuses a storage it does not know", async () => {
    const { gcal } = harness()
    const refused = await gcal(["personal", "session", "start", "--credential-storage", "cloud", "--json"])
    expect(failure(refused.err).code).toBe("validation_error")
  })
})
