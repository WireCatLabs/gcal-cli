import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Client } from "@modelcontextprotocol/client"
import { InMemoryTransport } from "@modelcontextprotocol/server"
import { isCliError, memoryKeyring } from "@wirecat/cli-base"
import { describeProgram } from "@wirecat/cli-base/commands"
import { changesAuthorityAt } from "@wirecat/cli-core/cli"
import { describe, expect, it, vi } from "vitest"
import { apiMethods } from "./api-methods.js"
import { configuration, permissions } from "./config.js"
import { CALENDAR_READ_SCOPE, sessionStorage } from "./google.js"
import { googleApi } from "./google-api.js"
import { createMcpServer } from "./mcp.js"
import { createProgram, run } from "./program.js"

const ACCESS = "fixture-access-token-4Rt9"
const REFRESH = "fixture-refresh-token-8Wq2"
const REFRESHED = "fixture-refreshed-token-6Jc3"
const SECRET = "fixture-client-secret-2Hn6"
const MARKERS = [ACCESS, REFRESH, REFRESHED, SECRET]
const HOLIDAYS = "en.example#holiday@group.v.calendar.google.com"
const CALENDAR = "https://www.googleapis.com/calendar/v3/"

// Shapes from the Calendar API reference (Events: list, FreeBusy: query); every value is made up.
const EVENTS = {
  kind: "calendar#events",
  summary: "Example calendar",
  items: [
    {
      kind: "calendar#event",
      id: "evtfixture1",
      status: "confirmed",
      summary: "Example planning",
      start: { dateTime: "2026-11-02T10:00:00Z" },
      end: { dateTime: "2026-11-02T11:00:00Z" },
    },
  ],
  nextPageToken: "page-fixture-2",
}
const FREE_BUSY = {
  kind: "calendar#freeBusy",
  timeMin: "2026-11-02T00:00:00Z",
  timeMax: "2026-11-03T00:00:00Z",
  calendars: { primary: { busy: [{ start: "2026-11-02T10:00:00Z", end: "2026-11-02T11:00:00Z" }] } },
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } })

type Answer = (url: URL, init: RequestInit | undefined) => Response | Promise<Response>
const google = (answer: Answer = () => json(EVENTS)) => {
  const requests: { url: URL; method: string; authorization: string | null; body: string }[] = []
  const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    requests.push({
      url,
      method: init?.method ?? "GET",
      authorization: new Headers(init?.headers).get("authorization"),
      body: String(init?.body ?? ""),
    })
    return answer(url, init)
  })
  return { fetch, requests }
}

const harness = (
  scopes: string[] = ["openid", "email", CALENDAR_READ_SCOPE],
  extra: NodeJS.ProcessEnv = {},
  expiresAt = Date.now() + 3_600_000,
) => {
  const keyring = memoryKeyring()
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
    GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
    ...extra,
  }
  sessionStorage(env, "personal", keyring).write({
    tokens: { accessToken: ACCESS, refreshToken: REFRESH, expiresAt, scopes },
    client: { clientId: "fixture-client.apps", clientSecret: SECRET },
  })
  const gcal = async (argv: string[], fake = google(), answer?: string) => {
    const out: string[] = []
    const err: string[] = []
    const code = await run(argv, {
      streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
      tty: false,
      env,
      keyring,
      fetch: fake.fetch,
      ...(answer === undefined ? {} : { answer: () => answer }),
    })
    return { code, out: out.join("\n"), err: err.join("\n") }
  }
  return { gcal, env }
}

const answerOf = (text: string) => JSON.parse(text)
const failure = (err: string) => JSON.parse(err.trim().split("\n").at(-1) ?? "").error
const toCalendar = <T extends { url: URL }>(requests: T[]) =>
  requests.filter(({ url }) => url.href.startsWith(CALENDAR))

describe("api list and show", () => {
  it("lists every generated method with a scope, and none of the webhook methods", async () => {
    const { gcal } = harness()
    const { items } = answerOf((await gcal(["api", "list", "--json"])).out)
    expect(items).toHaveLength(33)
    expect(items.map((item: { name: string }) => item.name)).not.toContainEqual(
      expect.stringMatching(/\.watch$|^calendar\.channels\./),
    )
    const byName = Object.fromEntries(items.map((item: { name: string }) => [item.name, item]))
    expect(byName["calendar.freebusy.query"]).toMatchObject({ mutates: false, scope: CALENDAR_READ_SCOPE })
    expect(byName["calendar.calendars.clear"]).toMatchObject({ mutates: true, destructive: true })
    expect(byName["calendar.calendars.transferOwnership"]).toMatchObject({ destructive: true })
    expect(apiMethods().filter((method) => !method.scope)).toEqual([])
  })

  it("shows a method's request schema without calling Google", async () => {
    const { gcal } = harness()
    const fake = google()
    const shown = answerOf((await gcal(["api", "show", "calendar.events.insert", "--json"], fake)).out).item
    expect(shown.operation.id).toBe("calendar.events.insert")
    expect(shown.request_schema.$ref).toBe("#/$defs/CalendarEvent")
    expect(fake.fetch).not.toHaveBeenCalled()
  })

  it("refuses a method it does not know", async () => {
    const { gcal } = harness()
    const refused = await gcal(["api", "show", "calendar.events.watch", "--json"])
    expect(failure(refused.err).reason).toBe("api.unknown-method")
  })
})

describe("reading through the API", () => {
  it("runs a generated read: the id stays in its path segment and the token only in the header", async () => {
    const { gcal } = harness()
    const fake = google()
    const listed = await gcal(
      [
        "personal",
        "api",
        "calendar-events-list",
        "--calendar-id",
        HOLIDAYS,
        "--event-types",
        "default,focusTime",
        "--json",
      ],
      fake,
    )
    expect(listed.code).toBe(0)
    expect(answerOf(listed.out).item).toMatchObject({
      next_page_token: "page-fixture-2",
      items: [{ id: "evtfixture1" }],
    })
    const [request] = toCalendar(fake.requests)
    expect(request?.url.pathname).toBe(`/calendar/v3/calendars/${encodeURIComponent(HOLIDAYS)}/events`)
    expect(request?.url.searchParams.getAll("eventTypes")).toEqual(["default", "focusTime"])
    expect(request?.authorization).toBe(`Bearer ${ACCESS}`)
    expect(request?.url.href).not.toContain(ACCESS)
  })

  it("calls freebusy.query as a read, with no --allow-writes", async () => {
    const { gcal } = harness()
    const fake = google(() => json(FREE_BUSY))
    const body = { timeMin: FREE_BUSY.timeMin, timeMax: FREE_BUSY.timeMax, items: [{ id: "primary" }] }
    const asked = await gcal(
      ["personal", "api", "call", "calendar.freebusy.query", "--body", JSON.stringify(body), "--json"],
      fake,
    )
    expect(asked.code).toBe(0)
    expect(answerOf(asked.out).item.calendars.primary.busy).toHaveLength(1)
    expect(toCalendar(fake.requests)[0]).toMatchObject({ method: "POST", body: JSON.stringify(body) })
  })

  it("refuses a read whose scope the sign-in lacks, before any request", async () => {
    const { gcal } = harness()
    const fake = google()
    const refused = await gcal(["personal", "api", "calendar-acl-list", "--calendar-id", "primary", "--json"], fake)
    expect(failure(refused.err)).toMatchObject({ code: "permission_error", reason: "api.scope-missing" })
    expect(failure(refused.err).message).toContain("calendar.acls.readonly")
    expect(toCalendar(fake.requests)).toEqual([])
  })

  it("refuses an answer that does not match the API contract", async () => {
    const { gcal } = harness()
    const refused = await gcal(
      ["personal", "api", "calendar-events-list", "--calendar-id", "primary", "--json"],
      google(() => json({ items: "not a list" })),
    )
    expect(failure(refused.err).code).toBe("invalid_response")
  })

  it("says to sign in when the profile has none", async () => {
    const { gcal } = harness()
    const refused = await gcal(["other", "api", "calendar-colors-get", "--json"])
    expect(failure(refused.err)).toMatchObject({ code: "authentication_error" })
    expect(failure(refused.err).message).toContain("gcal other session start")
  })

  it.each([
    [401, {}, {}, { code: "authentication_error", reason: "sign-in.expired" }],
    [
      403,
      { error: { errors: [{ reason: "insufficientPermissions" }], status: "PERMISSION_DENIED" } },
      {},
      { code: "permission_error", reason: "api.scope-missing" },
    ],
    [
      403,
      { error: { errors: [{ reason: "accessNotConfigured" }] } },
      {},
      { code: "configuration_error", reason: "api.disabled" },
    ],
    [429, { error: { errors: [{ reason: "rateLimitExceeded" }] } }, { "retry-after": "7" }, { code: "rate_limited" }],
    [404, { error: { errors: [{ reason: "notFound" }] } }, {}, { code: "not_found" }],
    [503, {}, {}, { code: "provider_unavailable" }],
  ])("maps Google's HTTP %i to a WireCat error", async (status, body, headers, expected) => {
    const { gcal } = harness()
    const refused = await gcal(
      ["personal", "api", "calendar-events-get", "--calendar-id", "primary", "--event-id", "evtfixture1", "--json"],
      google(() => json(body, status, headers)),
    )
    expect(failure(refused.err)).toMatchObject(expected)
    if (status === 429) expect(failure(refused.err).retry).toMatchObject({ safe: true, after_ms: 7000 })
  })
})

describe("checking a request before it leaves", () => {
  it.each([
    [["calendar.nothing.here"], "api.unknown-method"],
    [["calendar.events.list", "--params", '{"calendarId":"primary","noSuchParameter":1}'], "unknown or unsupported"],
    [["calendar.events.list", "--params", "{}"], "required API parameter: calendarId"],
    [["calendar.events.list", "--params", '{"calendarId":"primary","alt":"media"}'], "--alt is one of json"],
    [["calendar.events.list", "--params", '{"calendarId":"primary","callback":"cb"}'], "unknown or unsupported"],
    [["calendar.events.list", "--params", '{"calendarId":{"nested":true}}'], "scalar values"],
    [["calendar.events.list", "--params", '{"calendarId":"primary"}', "--body", "{}"], "does not accept a JSON body"],
  ])("refuses api call %j without a request", async (args, problem) => {
    const { gcal } = harness()
    const fake = google()
    const refused = failure((await gcal(["personal", "api", "call", ...args, "--json"], fake)).err)
    expect(refused.code).toBe("validation_error")
    expect(`${refused.reason} ${refused.message}`).toContain(problem)
    expect(toCalendar(fake.requests)).toEqual([])
  })

  it("reads Google's ErrorInfo detail, and refuses an answer that is not JSON", async () => {
    const { gcal } = harness()
    const colors = ["personal", "api", "calendar-colors-get", "--json"]
    const disabled = {
      error: {
        status: "PERMISSION_DENIED",
        details: [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason: "SERVICE_DISABLED" }],
      },
    }
    expect(
      failure(
        (
          await gcal(
            colors,
            google(() => json(disabled, 403)),
          )
        ).err,
      ).reason,
    ).toBe("api.disabled")
    const html = google(
      () => new Response("<html>sign in</html>", { status: 200, headers: { "content-type": "text/html" } }),
    )
    expect(failure((await gcal(colors, html)).err).code).toBe("invalid_response")
  })

  it("answers an empty 204 as null", async () => {
    const api = googleApi({
      fetch: async () => new Response(null, { status: 204 }),
      scopes: () => ["https://www.googleapis.com/auth/calendar"],
      accessToken: async () => ACCESS,
    })
    expect(await api.call("calendar.events.delete", { calendarId: "primary", eventId: "evtfixture1" })).toBeNull()
  })
})

describe("writes", () => {
  it("asks before a write: --yes or a yes goes ahead, a no or nobody to answer does not", async () => {
    const { gcal } = harness()
    const fake = google()
    const insert = ["personal", "api", "call", "calendar.events.insert", "--params", '{"calendarId":"primary"}']
    const unasked = failure((await gcal([...insert, "--body", "{}", "--json"], fake)).err)
    expect(unasked).toMatchObject({
      code: "confirmation_required",
      details: { permission: "api.calendar.events.insert" },
    })
    expect((await gcal([...insert, "--body", "{}"], fake, "n")).err).toContain("the answer was no")
    expect(failure((await gcal([...insert, "--body", "{}", "--yes", "--json"], fake)).err).reason).toBe(
      "api.scope-missing",
    )
    expect((await gcal([...insert, "--body", "{}"], fake, "y")).err).toContain("session start --grant write")
    expect(toCalendar(fake.requests)).toEqual([])
  })

  it("denies emptying a calendar, giving it away and sharing it until the owner allows that one method", async () => {
    const { gcal } = harness()
    const clear = ["personal", "api", "call", "calendar.calendars.clear", "--params", '{"calendarId":"primary"}']
    expect(failure((await gcal([...clear, "--yes", "--json"])).err)).toMatchObject({
      code: "permission_error",
      details: { permission: "api.calendar.calendars.clear" },
    })
    const share = ["personal", "api", "calendar-acl-insert", "--calendar-id", "primary", "--body", "{}", "--yes"]
    expect(failure((await gcal([...share, "--json"])).err).code).toBe("permission_error")
    expect((await gcal(["personal", "config", "set", "permissions.api", "allow"])).code).toBe(0)
    expect(failure((await gcal([...clear, "--yes", "--json"])).err).code).toBe("permission_error")
    expect((await gcal(["personal", "config", "set", "permissions.api.calendar.calendars.clear", "ask"])).code).toBe(0)
    expect(failure((await gcal([...clear, "--yes", "--json"])).err).reason).toBe("api.scope-missing")
  })

  it("takes config set permissions.api deny, and then refuses api call and every generated method", async () => {
    const { gcal } = harness()
    const fake = google()
    expect((await gcal(["personal", "config", "set", "permissions.api", "deny", "--json"])).code).toBe(0)
    const called = await gcal(["personal", "api", "call", "calendar.events.list", "--json"], fake)
    expect(failure(called.err)).toMatchObject({
      code: "permission_error",
      details: { permission: "api.calendar.events.list" },
    })
    const generated = await gcal(["personal", "api", "calendar-colors-get", "--json"], fake)
    expect(failure(generated.err).code).toBe("permission_error")
    expect((await gcal(["api", "list", "--json"], fake)).code).toBe(0)
    expect(fake.fetch).not.toHaveBeenCalled()
  })

  it("reads but never writes under permissions.api readonly", async () => {
    const { gcal } = harness()
    const fake = google()
    expect((await gcal(["personal", "config", "set", "permissions.api", "readonly"])).code).toBe(0)
    const read = ["personal", "api", "call", "calendar.events.list", "--params", '{"calendarId":"primary"}', "--json"]
    expect((await gcal(read, fake)).code).toBe(0)
    expect((await gcal(["personal", "api", "calendar-colors-get", "--json"], fake)).code).toBe(0)
    const insert = ["personal", "api", "call", "calendar.events.insert", "--params", '{"calendarId":"primary"}']
    expect(failure((await gcal([...insert, "--body", "{}", "--yes", "--json"], fake)).err)).toMatchObject({
      code: "permission_error",
      details: { permission: "api.calendar.events.insert" },
    })
    const generated = ["personal", "api", "calendar-events-delete", "--calendar-id", "primary", "--event-id", "e1"]
    expect(failure((await gcal([...generated, "--yes", "--json"], fake)).err).code).toBe("permission_error")
    expect(toCalendar(fake.requests)).toHaveLength(2)
  })

  it("refuses a permission key that names no method", async () => {
    const { gcal } = harness()
    for (const key of ["permissions.api.calendar.events.nope", "permissions.apis"]) {
      const refused = await gcal(["personal", "config", "set", key, "deny", "--json"])
      expect(failure(refused.err).code).toBe("validation_error")
    }
  })

  it("refuses every write for want of the write scope, and names session start --grant write", async () => {
    const { gcal } = harness()
    const fake = google()
    const deleted = await gcal(
      [
        ...["personal", "api", "calendar-events-delete", "--calendar-id", "primary", "--event-id", "evtfixture1"],
        ...["--yes", "--json"],
      ],
      fake,
    )
    expect(failure(deleted.err)).toMatchObject({ code: "permission_error", reason: "api.scope-missing" })
    expect(failure(deleted.err).message).toContain("session start --grant write")
    const called = await gcal(
      [
        ...["personal", "api", "call", "calendar.events.quickAdd", "--params"],
        ...['{"calendarId":"primary","text":"Example lunch"}', "--yes", "--json"],
      ],
      fake,
    )
    expect(failure(called.err).reason).toBe("api.scope-missing")
    expect(toCalendar(fake.requests)).toEqual([])
  })

  it("refuses a write under GCAL_READ_ONLY and still reads", async () => {
    const { gcal } = harness(undefined, { GCAL_READ_ONLY: "1" })
    const fake = google()
    const refused = await gcal(
      ["personal", "api", "calendar-events-delete", "--calendar-id", "primary", "--event-id", "evtfixture1", "--json"],
      fake,
    )
    expect(refused.code).toBe(5)
    expect(failure(refused.err).message).toContain("read-only (GCAL_READ_ONLY)")
    expect((await gcal(["personal", "api", "calendar-colors-get", "--json"], fake)).code).toBe(0)
    const read = ["personal", "api", "call", "calendar.events.list", "--params", '{"calendarId":"primary"}', "--json"]
    expect((await gcal(read, fake)).code).toBe(0)
  })

  it("previews a write with --dry-run and sends nothing", async () => {
    const { gcal } = harness()
    const fake = google()
    const previewed = await gcal(
      [
        ...["--dry-run", "personal", "api", "calendar-events-delete"],
        ...["--calendar-id", "primary", "--event-id", "evtfixture1", "--json"],
      ],
      fake,
    )
    expect(previewed.code).toBe(0)
    expect(fake.fetch).not.toHaveBeenCalled()
  })

  it("calls a write whose outcome Google never confirmed unknown, never safe to retry", async () => {
    const api = (fetch: typeof globalThis.fetch) =>
      googleApi({
        fetch,
        scopes: () => ["https://www.googleapis.com/auth/calendar"],
        accessToken: async () => ACCESS,
      })
    const params = { calendarId: "primary", eventId: "evtfixture1" }
    const lost = api(async () => {
      throw new TypeError("fetch failed")
    })
    const unanswered = api(async () => json({}, 502))
    for (const attempt of [lost, unanswered]) {
      const error = await attempt.call("calendar.events.delete", params).catch((caught: unknown) => caught)
      expect(isCliError(error) && error.code).toBe("outcome_unknown")
      expect(isCliError(error) && error.details.retryable).toBe(false)
    }
  })
})

describe("over MCP", () => {
  const serve = async (
    readOnly = false,
    levels = () => configuration.resolveSettings({ profile: "personal" }).permissions,
  ) => {
    const program = createProgram()
    const server = createMcpServer({
      profile: "personal",
      commands: describeProgram(program),
      levels,
      authority: changesAuthorityAt(program),
      permissions,
      readOnly,
      run,
    })
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
    await server.connect(serverSide)
    const client = new Client({ name: "test", version: "1.0.0" })
    await client.connect(clientSide)
    const search = async (query: string) =>
      (
        (await client.callTool({ name: "gcal_tools_search", arguments: { query } })).structuredContent as {
          items: { command: string }[]
        }
      ).items
    return { client, search }
  }

  it("offers reads and generated writes, but not api call, sharing, clearing or giving a calendar away", async () => {
    const { client, search } = await serve()
    try {
      const commands = async (query: string) => (await search(query)).map((item) => item.command)
      expect(await commands("returns events on the specified calendar")).toContain("api calendar-events-list")
      expect(await commands("deletes an event")).toContain("api calendar-events-delete")
      const offered = [
        ...(await commands("access control rule calendar acl sharing")),
        ...(await commands("clears a primary calendar transfers ownership")),
        ...(await commands("call one Google Calendar API method by name")),
      ]
      for (const command of offered)
        expect(command).not.toMatch(/^api (call|calendar-acl-|calendar-calendars-(clear|transfer))/)
      const refused = await client.callTool({
        name: "gcal_write",
        arguments: { command: "api calendar-calendars-clear", arguments: { calendar_id: "primary" } },
      })
      expect(refused.isError).toBe(true)
    } finally {
      await client.close()
    }
  })

  it("lists a write as unavailable under the read-only lock, and a denied read as unavailable", async () => {
    const locked = await serve(true)
    const denied = await serve(false, () => ({ "api.calendar.events.list": "deny" }))
    try {
      const of = (items: { command: string }[], command: string) => items.find((item) => item.command === command)
      expect(of(await locked.search("deletes an event"), "api calendar-events-delete")).toMatchObject({
        availability: { available: false },
      })
      expect(
        of(await locked.search("returns events on the specified calendar"), "api calendar-events-list"),
      ).toMatchObject({
        availability: { available: true },
      })
      expect(
        of(await denied.search("returns events on the specified calendar"), "api calendar-events-list"),
      ).toMatchObject({
        availability: { available: false, permission: "api.calendar.events.list" },
      })
    } finally {
      await locked.client.close()
      await denied.client.close()
    }
  })
})

describe("secrets", () => {
  it("keeps the token out of the output, the errors and the run records", async () => {
    const { gcal } = harness()
    const results = [
      await gcal(["--record", "personal", "api", "calendar-events-list", "--calendar-id", HOLIDAYS, "--json"]),
      await gcal(
        ["--record", "personal", "api", "calendar-events-list", "--calendar-id", "primary", "--json"],
        google(() => json({ error: { errors: [{ reason: "authError" }] } }, 401)),
      ),
      await gcal(
        ["--record", "personal", "api", "calendar-colors-get", "--json"],
        google(() => {
          throw new TypeError(`fetch failed for Bearer ${ACCESS}`)
        }),
      ),
      await gcal(["--record", "personal", "runs", "list", "--limit", "20", "--json"]),
    ]
    const printed = results.map(({ out, err }) => out + err).join("\n")
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
      )
    const onDisk = files(tmpdir())
      .filter((path) => statSync(path).size < 50_000_000)
      .map((path) => readFileSync(path).toString("latin1"))
      .join("\n")
    expect(onDisk).toContain("/calendar/v3/calendars/{calendarId}/events")
    for (const marker of MARKERS) {
      expect(printed).not.toContain(marker)
      expect(onDisk).not.toContain(marker)
    }
    expect(onDisk).not.toContain(encodeURIComponent(HOLIDAYS))
  })

  it("refreshes an expired sign-in and keeps both tokens out of the output and the run records", async () => {
    const { gcal } = harness(undefined, undefined, Date.now() - 60_000)
    const fake = google((url) =>
      url.href === "https://oauth2.googleapis.com/token"
        ? json({ access_token: REFRESHED, expires_in: 3600, scope: CALENDAR_READ_SCOPE, token_type: "Bearer" })
        : json(EVENTS),
    )
    const listed = await gcal(
      ["--record", "personal", "api", "calendar-events-list", "--calendar-id", "primary", "--json"],
      fake,
    )
    expect(listed.code).toBe(0)
    expect(toCalendar(fake.requests)[0]?.authorization).toBe(`Bearer ${REFRESHED}`)
    const runs = await gcal(["--record", "personal", "runs", "list", "--limit", "5", "--json"])
    for (const marker of MARKERS) expect(listed.out + listed.err + runs.out + runs.err).not.toContain(marker)
  })
})
