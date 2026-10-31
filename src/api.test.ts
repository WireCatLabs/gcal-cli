import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { isCliError, memoryKeyring } from "@wirecat/cli-base"
import { describe, expect, it, vi } from "vitest"
import { apiMethods } from "./api-methods.js"
import { permissions } from "./config.js"
import { CALENDAR_READ_SCOPE, sessionStorage } from "./google.js"
import { googleApi } from "./google-api.js"
import { ACLS_SCOPE, EVENTS_SCOPE } from "./grants.js"
import { run } from "./program.js"
import { mcpClient } from "./testing/mcp.js"

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
  const asked: string[] = []
  const gcal = async (argv: string[], fake = google(), answer?: string) => {
    const out: string[] = []
    const err: string[] = []
    const code = await run(argv, {
      streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
      tty: false,
      env,
      keyring,
      fetch: fake.fetch,
      ...(answer === undefined
        ? {}
        : {
            answer: (question: string) => {
              asked.push(question)
              return answer
            },
          }),
    })
    return { code, out: out.join("\n"), err: err.join("\n") }
  }
  return { gcal, env, keyring, asked }
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
    expect(failure(refused.err)).toMatchObject({
      reason: "api.unknown-method",
      message: "unknown Google Calendar method; run gcal api list",
    })
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

  it("refuses an empty, . or .. id, which would move the request to another endpoint, and sends nothing", async () => {
    const { gcal } = harness()
    const fake = google()
    for (const id of ["", ".", ".."]) {
      const refused = await gcal(
        ["personal", "api", "calendar-events-get", "--calendar-id", "primary", "--event-id", id, "--json"],
        fake,
      )
      expect([id, refused.code]).toEqual([id, 2])
      expect(refused.err).toContain("api.bad-path-id")
    }
    expect(toCalendar(fake.requests)).toEqual([])
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

  it("reads one sharing rule with read access alone, which Google lets calendar.readonly do", async () => {
    const { gcal } = harness()
    const fake = google(() => json({ kind: "calendar#aclRule", id: "user:a@example.com", role: "reader" }))
    const read = ["personal", "api", "calendar-acl-get", "--calendar-id", "primary", "--rule-id", "user:a@example.com"]
    expect((await gcal([...read, "--json"], fake)).code).toBe(0)
    expect(toCalendar(fake.requests)).toHaveLength(1)
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
    [["calendar.nothing.here"], "api.unknown-method unknown Google Calendar method; run gcal api list"],
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
  it("asks before a delete: --yes or a yes goes ahead, a no or nobody to answer does not", async () => {
    const { gcal } = harness()
    const fake = google()
    const remove = ["personal", "api", "call", "calendar.calendarList.delete", "--params", '{"calendarId":"team"}']
    const unasked = failure((await gcal([...remove, "--json"], fake)).err)
    expect(unasked).toMatchObject({
      code: "confirmation_required",
      details: { permission: "api.calendar.calendarList.delete" },
    })
    expect((await gcal(remove, fake, "n")).err).toContain("the answer was no")
    expect(failure((await gcal([...remove, "--yes", "--json"], fake)).err).reason).toBe("api.scope-missing")
    expect((await gcal(remove, fake, "y")).err).toContain("Google permission gcal does not ask for")
    expect(toCalendar(fake.requests)).toEqual([])
  })

  it("denies emptying, deleting or giving a calendar away until the owner allows it, and asks before sharing", async () => {
    const { gcal } = harness()
    const clear = ["personal", "api", "call", "calendar.calendars.clear", "--params", '{"calendarId":"primary"}']
    expect(failure((await gcal([...clear, "--yes", "--json"])).err)).toMatchObject({
      code: "permission_error",
      details: { permission: "api.calendar.calendars.clear" },
    })
    const share = [
      ...["personal", "api", "calendar-acl-insert", "--calendar-id", "primary", "--body", "{}"],
      ...["--send-notifications", "false", "--json"],
    ]
    expect(failure((await gcal(share)).err).code).toBe("confirmation_required")
    const shared = failure((await gcal([...share, "--yes"])).err)
    expect(shared.reason).toBe("api.scope-missing")
    expect(shared.message).toContain("session start --grant sharing")
    const give = [
      ...["personal", "api", "calendar-calendars-transfer-ownership", "--calendar-id", "team@example.com"],
      "--use-admin-access",
      "true",
    ]
    const given = failure((await gcal([...give, "--new-data-owner", "a@example.com", "--yes", "--json"])).err)
    expect(given).toMatchObject({
      code: "permission_error",
      details: { permission: "api.calendar.calendars.transferOwnership" },
    })
    const deleted = ["personal", "api", "calendar-calendars-delete", "--calendar-id", "team@example.com", "--yes"]
    expect(failure((await gcal([...deleted, "--json"])).err)).toMatchObject({
      code: "permission_error",
      details: { permission: "api.calendar.calendars.delete" },
    })
    expect(
      (await gcal(["personal", "config", "set", "permissions.api.calendar.calendars.transferOwnership", "ask"])).code,
    ).toBe(0)
    const allowed = failure((await gcal([...give, "--new-data-owner", "a@example.com", "--yes", "--json"])).err)
    expect(allowed.reason).toBe("api.scope-missing")
    expect(allowed.message).toContain("calendar.calendars")
    expect((await gcal(["personal", "config", "set", "permissions.api", "allow"])).code).toBe(0)
    expect(failure((await gcal([...clear, "--yes", "--json"])).err).code).toBe("permission_error")
    expect((await gcal(["personal", "config", "set", "permissions.api.calendar.calendars.clear", "ask"])).code).toBe(0)
    expect(failure((await gcal([...clear, "--yes", "--json"])).err).reason).toBe("api.scope-missing")
  })

  it("allows an ordinary change, asks for a delete or a share, and denies emptying, deleting or giving a calendar away", () => {
    for (const method of ["insert", "patch", "update", "delete"])
      expect(permissions.defaults[`api.calendar.acl.${method}`]).toBe("ask")
    for (const method of ["clear", "delete", "transferOwnership"])
      expect(permissions.defaults[`api.calendar.calendars.${method}`]).toBe("deny")
    expect(permissions.defaults["api.calendar.events.delete"]).toBe("ask")
    expect(permissions.defaults["api.calendar.calendarList.delete"]).toBe("ask")
    for (const key of ["calendars.patch", "events.insert", "events.patch", "events.move", "events.quickAdd"])
      expect(permissions.defaults[`api.calendar.${key}`]).toBeUndefined()
  })

  it("shares a calendar after session start --grant sharing", async () => {
    const { gcal } = harness(["openid", "email", CALENDAR_READ_SCOPE, ACLS_SCOPE])
    const rule = { kind: "calendar#aclRule", id: "user:a@example.com", role: "reader" }
    const fake = google(() => json(rule))
    const body = JSON.stringify({ role: "reader", scope: { type: "user", value: "a@example.com" } })
    const shared = await gcal(
      [
        ...["personal", "api", "calendar-acl-insert", "--calendar-id", "primary", "--body", body],
        ...["--send-notifications", "false", "--yes", "--json"],
      ],
      fake,
    )
    expect(shared.code).toBe(0)
    expect(answerOf(shared.out).item).toMatchObject({ id: "user:a@example.com", role: "reader" })
    expect(toCalendar(fake.requests)[0]).toMatchObject({ method: "POST", body })
    expect(toCalendar(fake.requests)[0]?.url.searchParams.get("sendNotifications")).toBe("false")
  })

  it("refuses sharing under permissions.api.calendar.acl deny, and giving a calendar away under api deny", async () => {
    const { gcal } = harness(["openid", "email", CALENDAR_READ_SCOPE, ACLS_SCOPE])
    const fake = google()
    const share = ["personal", "api", "calendar-acl-insert", "--calendar-id", "primary", "--body", "{}", "--yes"]
    expect((await gcal(["personal", "config", "set", "permissions.api.calendar.acl", "deny"])).code).toBe(0)
    expect(failure((await gcal([...share, "--json"], fake)).err).code).toBe("permission_error")
    expect((await gcal(["personal", "config", "set", "permissions.api", "deny"])).code).toBe(0)
    expect(failure((await gcal([...share, "--json"], fake)).err).code).toBe("permission_error")
    const give = [
      ...["personal", "api", "calendar-calendars-transfer-ownership", "--calendar-id", "team@example.com"],
      "--use-admin-access",
      "true",
    ]
    const given = await gcal([...give, "--new-data-owner", "a@example.com", "--yes", "--json"], fake)
    expect(failure(given.err).code).toBe("permission_error")
    expect(fake.fetch).not.toHaveBeenCalled()
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
    expect((await gcal(["personal", "api", "call", "calendar.colors.get", "--json"], fake)).code).toBe(0)
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

// Shapes from the Calendar API reference (Event.conferenceData, ConferenceData.entryPoints[]); every value is made up.
const CONFERENCE = {
  conferenceSolution: { key: { type: "addOn" }, name: "Example Meetings" },
  conferenceId: "fixture-conference-1",
  entryPoints: [
    {
      entryPointType: "video",
      uri: "https://meet.example.com/j/123456789?pwd=fixturepwd71#success",
      label: "meet.example.com/j/123456789",
      meetingCode: "123456789",
      passcode: "fixturepass55",
    },
    {
      entryPointType: "phone",
      uri: "tel:+12345678900,,,123456789;fixturepin33",
      label: "+1 234-567-8900",
      pin: "fixturepin33",
      regionCode: "US",
    },
    { entryPointType: "sip", uri: "sip:123456789@sip.example.com;passcode=fixturesip22", password: "fixturepw11" },
    { entryPointType: "more", uri: "https://meet.example.com/more?code=fixturemore44", accessCode: "fixtureaccess66" },
  ],
}
const SECRETS = ["fixturepwd71", "fixturepass55", "fixturepin33", "fixturesip22", "fixturepw11", "fixtureaccess66"]
const MEETING = {
  kind: "calendar#event",
  id: "evtconference1",
  status: "confirmed",
  summary: "Example review",
  start: { dateTime: "2026-11-02T10:00:00Z" },
  end: { dateTime: "2026-11-02T11:00:00Z" },
  conferenceData: CONFERENCE,
}

describe("conference secrets", () => {
  it.each([
    [["api", "calendar-events-list", "--calendar-id", "primary"], { kind: "calendar#events", items: [MEETING] }],
    [
      ["api", "calendar-events-instances", "--calendar-id", "primary", "--event-id", "evtseries1"],
      { kind: "calendar#events", items: [MEETING] },
    ],
    [
      ["api", "call", "calendar.events.get", "--params", '{"calendarId":"primary","eventId":"evtconference1"}'],
      MEETING,
    ],
  ])("never leave Google through %j", async (words, answer) => {
    const { gcal } = harness()
    const shown = await gcal(
      ["personal", ...words, "--json"],
      google(() => json(answer)),
    )
    expect(shown.code).toBe(0)
    for (const secret of SECRETS) expect(shown.out).not.toContain(secret)
    const item = answerOf(shown.out).item
    const points = (item.items?.[0] ?? item).conference_data.entry_points
    expect(points.map((point: { uri: string }) => point.uri)).toEqual([
      "https://meet.example.com/j/123456789",
      "tel:+12345678900",
      "sip:123456789@sip.example.com",
      "https://meet.example.com/more",
    ])
    expect(points[0]).toMatchObject({ label: "meet.example.com/j/123456789", meeting_code: "123456789" })
    expect(points[1]).toMatchObject({ region_code: "US" })
  })

  it("api show says an event's answer loses them; a calendar's answer has none to lose", async () => {
    const { gcal } = harness()
    expect(answerOf((await gcal(["api", "show", "calendar.events.get", "--json"])).out).item.answer).toContain(
      "passcode",
    )
    expect(answerOf((await gcal(["api", "show", "calendar.calendars.get", "--json"])).out).item.answer).toBeUndefined()
  })
})

describe("over MCP", () => {
  const serve = async (options: { readOnly?: boolean; permission?: string } = {}) => {
    const { client } = await mcpClient(
      options.readOnly ? { env: { ...process.env, GCAL_READ_ONLY: "1" } } : {},
      options.permission ? ["--permission", options.permission] : [],
    )
    const search = async (query: string) =>
      (
        (await client.callTool({ name: "gcal_tools_search", arguments: { query } })).structuredContent as {
          items: { command: string }[]
        }
      ).items
    return { client, search }
  }

  it("offers reads, generated writes, sharing and giving a calendar away, but not api call or clearing", async () => {
    const { client, search } = await serve()
    try {
      const commands = async (query: string) => (await search(query)).map((item) => item.command)
      expect(await commands("returns events on the specified calendar")).toContain("api calendar-events-list")
      expect(await commands("deletes an event")).toContain("api calendar-events-delete")
      const sharing = await commands("access control rule")
      for (const method of ["insert", "patch", "update", "delete", "get", "list"])
        expect(sharing).toContain(`api calendar-acl-${method}`)
      expect(await commands("transfers a secondary calendar")).toContain("api calendar-calendars-transfer-ownership")
      const offered = [
        ...(await commands("clears a primary calendar")),
        ...(await commands("call one Google Calendar API method by name")),
      ]
      for (const command of offered) expect(command).not.toMatch(/^api (call|calendar-calendars-clear)/)
      const refused = await client.callTool({
        name: "gcal_write",
        arguments: { command: "api calendar-calendars-clear", arguments: { calendar_id: "primary" } },
      })
      expect(refused.isError).toBe(true)
    } finally {
      await client.close()
    }
  })

  it("lists sharing as unavailable to an agent when the profile denies api", async () => {
    const { client, search } = await serve({ permission: "api=deny" })
    try {
      const insert = (await search("access control rule")).find((item) => item.command === "api calendar-acl-insert")
      expect(insert).toMatchObject({ availability: { available: false } })
      const refused = await client.callTool({
        name: "gcal_write",
        arguments: { command: "api calendar-acl-insert", arguments: { calendar_id: "primary", body: "{}" } },
      })
      expect(refused.isError).toBe(true)
    } finally {
      await client.close()
    }
  })

  it("lists a write as unavailable under the read-only lock, and a denied read as unavailable", async () => {
    const locked = await serve({ readOnly: true })
    const denied = await serve({ permission: "api.calendar.events.list=deny" })
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

// Shapes from the Calendar API reference (Events resource, Recurring events guide); every value is made up.
const SERIES = {
  kind: "calendar#event",
  id: "evtseries1",
  status: "confirmed",
  summary: "Example weekly",
  start: { dateTime: "2026-11-02T10:00:00Z" },
  end: { dateTime: "2026-11-02T11:00:00Z" },
  recurrence: ["RRULE:FREQ=WEEKLY;UNTIL=20270701T170000Z"],
}
const SINGLE = { ...SERIES, id: "evtsingle1", summary: "Example one-off", recurrence: undefined }

describe("the calendar keys hold on api writes", () => {
  const WRITER = ["openid", "email", CALENDAR_READ_SCOPE, EVENTS_SCOPE]
  const writes = (event: unknown = SINGLE) =>
    google((_url, init) => ((init?.method ?? "GET") === "DELETE" ? new Response(null, { status: 204 }) : json(event)))
  const insert = ["personal", "api", "calendar-events-insert", "--calendar-id", "primary", "--body", "{}"]
  const remove = ["personal", "api", "calendar-events-delete", "--calendar-id", "primary", "--event-id", "evtseries1"]
  const methods = (fake: ReturnType<typeof google>) => toCalendar(fake.requests).map(({ method }) => method)

  it.each([
    [[...insert, "--send-updates", "all"]],
    [[...insert, "--send-updates", "externalOnly"]],
    [[...insert, "--send-notifications", "true"]],
    [
      [
        ...["personal", "api", "call", "calendar.events.delete", "--params"],
        '{"calendarId":"primary","eventId":"evtsingle1","sendUpdates":"all"}',
      ],
    ],
    [
      [
        ...["personal", "api", "call", "calendar.events.quickAdd", "--params"],
        '{"calendarId":"primary","text":"Example lunch","sendNotifications":true}',
      ],
    ],
  ])("refuses mailing attendees through %j while events.notify is deny", async (words) => {
    const { gcal } = harness(WRITER)
    const fake = writes()
    const refused = failure((await gcal([...words, "--yes", "--json"], fake)).err)
    expect(refused).toMatchObject({ code: "permission_error", details: { permission: "events.notify" } })
    expect(fake.fetch).not.toHaveBeenCalled()
  })

  it("asks one question naming both keys once events.notify is ask, and mails once it is allow", async () => {
    const { gcal, asked } = harness(WRITER)
    const fake = writes()
    expect((await gcal(["personal", "config", "set", "permissions.events.notify", "ask"])).code).toBe(0)
    expect((await gcal([...insert, "--send-updates", "all"], fake, "y")).code).toBe(0)
    expect(asked).toHaveLength(1)
    expect(asked[0]).toContain("events.notify")
    expect(asked[0]).not.toContain("api.calendar.events.insert")
    expect((await gcal(["personal", "config", "set", "permissions.events.notify", "allow"])).code).toBe(0)
    expect((await gcal([...insert, "--send-updates", "all", "--yes", "--json"], fake)).code).toBe(0)
    expect(toCalendar(fake.requests).map(({ url }) => url.searchParams.get("sendUpdates"))).toEqual(["all", "all"])
  })

  it("sends with sendUpdates=none under the default levels", async () => {
    const { gcal } = harness(WRITER)
    const fake = writes()
    expect((await gcal([...insert, "--send-updates", "none", "--yes", "--json"], fake)).code).toBe(0)
    expect(methods(fake)).toEqual(["POST"])
  })

  it.each([
    [remove],
    [
      [
        ...["personal", "api", "calendar-events-patch", "--calendar-id", "primary", "--event-id", "evtseries1"],
        ...["--body", '{"status":"cancelled"}'],
      ],
    ],
  ])("refuses removing a whole series through %j: Google is only read", async (words) => {
    const { gcal } = harness(WRITER)
    const fake = writes(SERIES)
    const refused = failure((await gcal([...words, "--yes", "--json"], fake)).err)
    expect(refused).toMatchObject({ code: "permission_error", details: { permission: "events.delete.series" } })
    expect(methods(fake)).toEqual(["GET"])
    expect(toCalendar(fake.requests)[0]?.url.pathname).toBe("/calendar/v3/calendars/primary/events/evtseries1")
  })

  it("deletes a single event after the look, and a series without one once events.delete.series is allow", async () => {
    const { gcal } = harness(WRITER)
    const single = writes(SINGLE)
    expect((await gcal([...remove, "--yes", "--json"], single)).code).toBe(0)
    expect(methods(single)).toEqual(["GET", "DELETE"])
    expect((await gcal(["personal", "config", "set", "permissions.events.delete.series", "allow"])).code).toBe(0)
    const series = writes(SERIES)
    expect((await gcal([...remove, "--yes", "--json"], series)).code).toBe(0)
    expect(methods(series)).toEqual(["DELETE"])
  })

  it("names the missing write sign-in before looking at the event", async () => {
    const { gcal } = harness()
    const fake = writes(SERIES)
    expect(failure((await gcal([...remove, "--yes", "--json"], fake)).err).reason).toBe("api.scope-missing")
    expect(fake.fetch).not.toHaveBeenCalled()
  })

  it("previews every key and its level with --dry-run, api call included, and sends nothing", async () => {
    const { gcal } = harness(WRITER)
    const fake = writes()
    const called = await gcal(
      [
        ...["--dry-run", "personal", "api", "call", "calendar.events.delete", "--params"],
        ...['{"calendarId":"primary","eventId":"evtseries1"}', "--json"],
      ],
      fake,
    )
    expect(answerOf(called.out).item.permissions).toEqual([
      { key: "api.calendar.events.delete", level: "ask" },
      { key: "events.delete.series", level: "deny", when: "the event repeats" },
    ])
    expect(answerOf(called.out).item.permission).toEqual({ key: "api.calendar.events.delete", level: "ask" })
    expect(failure((await gcal(["--dry-run", ...insert, "--send-updates", "all", "--json"], fake)).err)).toMatchObject({
      code: "permission_error",
      details: { permission: "events.notify" },
    })
    expect((await gcal(["personal", "config", "set", "permissions.events.notify", "ask"])).code).toBe(0)
    const mailing = await gcal([...insert, "--send-updates", "all", "--dry-run", "--json"], fake)
    expect(answerOf(mailing.out).item.permissions).toEqual([
      { key: "api.calendar.events.insert", level: "allow" },
      { key: "events.notify", level: "ask" },
    ])
    expect(fake.fetch).not.toHaveBeenCalled()
  })

  it("holds over MCP: an agent cannot mail attendees or delete a series", async () => {
    const { env, keyring } = harness(WRITER)
    const fake = writes(SERIES)
    const { client } = await mcpClient({ env, keyring, fetch: fake.fetch })
    try {
      const write = async (command: string, args: Record<string, unknown>) =>
        (await client.callTool({ name: "gcal_write", arguments: { command, arguments: args } })) as {
          isError?: boolean
          content: { text: string }[]
        }
      const mailed = await write("api calendar-events-insert", {
        calendar_id: "primary",
        send_updates: "all",
        body: "{}",
      })
      expect(mailed.isError).toBe(true)
      expect(mailed.content[0]?.text).toContain("events.notify")
      expect(fake.fetch).not.toHaveBeenCalled()
      const deleted = await write("api calendar-events-delete", { calendar_id: "primary", event_id: "evtseries1" })
      expect(deleted.isError).toBe(true)
      expect(deleted.content[0]?.text).toContain("events.delete.series")
      expect(methods(fake)).toEqual(["GET"])
    } finally {
      await client.close()
    }
  })
})

// Shape from the Calendar API reference (Acl resource); every value is made up.
const RULE = { kind: "calendar#aclRule", id: "user:a@example.com", role: "reader" }

describe("sharing.notify holds on api sharing writes", () => {
  const SHARER = ["openid", "email", CALENDAR_READ_SCOPE, ACLS_SCOPE]
  const body = JSON.stringify({ role: "reader", scope: { type: "user", value: "a@example.com" } })
  const insert = ["personal", "api", "calendar-acl-insert", "--calendar-id", "primary", "--body", body]
  const rule = ["--calendar-id", "primary", "--rule-id", "user:a@example.com", "--body", body]
  const sharing = () =>
    google((_url, init) => ((init?.method ?? "GET") === "DELETE" ? new Response(null, { status: 204 }) : json(RULE)))
  const mailParam = (fake: ReturnType<typeof google>) =>
    toCalendar(fake.requests).map(({ url }) => url.searchParams.get("sendNotifications"))

  it.each([
    [insert],
    [[...insert, "--send-notifications", "true"]],
    [["personal", "api", "calendar-acl-patch", ...rule]],
    [["personal", "api", "calendar-acl-update", ...rule]],
    [["personal", "api", "call", "calendar.acl.insert", "--params", '{"calendarId":"primary"}', "--body", body]],
    [
      [
        ...["personal", "api", "call", "calendar.acl.patch", "--params"],
        '{"calendarId":"primary","ruleId":"user:a@example.com","sendNotifications":"true"}',
      ],
    ],
  ])("refuses sharing that mails through %j while sharing.notify is deny, before any request", async (words) => {
    const { gcal } = harness(SHARER)
    const fake = sharing()
    const refused = failure((await gcal([...words, "--yes", "--json"], fake)).err)
    expect(refused).toMatchObject({
      code: "permission_error",
      details: { permission: "sharing.notify" },
    })
    expect(refused.message).toContain("sharing.notify is deny")
    expect(refused.message).toContain("--send-notifications false")
    expect(fake.fetch).not.toHaveBeenCalled()
  })

  it("shares without mail when sendNotifications is false, and sends the request as given", async () => {
    const { gcal } = harness(SHARER)
    const fake = sharing()
    expect((await gcal([...insert, "--send-notifications", "false", "--yes", "--json"], fake)).code).toBe(0)
    const call = ["personal", "api", "call", "calendar.acl.insert", "--params"]
    const params = '{"calendarId":"primary","sendNotifications":false}'
    expect((await gcal([...call, params, "--body", body, "--yes", "--json"], fake)).code).toBe(0)
    expect(mailParam(fake)).toEqual(["false", "false"])
  })

  it("removes access without sharing.notify: Google mails nobody on removal", async () => {
    const { gcal } = harness(SHARER)
    const fake = sharing()
    const removed = await gcal(
      [
        ...["personal", "api", "calendar-acl-delete", "--calendar-id", "primary", "--rule-id", "user:a@example.com"],
        ...["--yes", "--json"],
      ],
      fake,
    )
    expect(removed.code).toBe(0)
    expect(toCalendar(fake.requests).map(({ method }) => method)).toEqual(["DELETE"])
  })

  it("asks one question naming both keys at ask, and leaves Google's default alone at allow", async () => {
    const { gcal, asked } = harness(SHARER)
    const fake = sharing()
    expect((await gcal(["personal", "config", "set", "permissions.sharing.notify", "ask"])).code).toBe(0)
    expect((await gcal(insert, fake, "y")).code).toBe(0)
    expect(asked).toHaveLength(1)
    expect(asked[0]).toContain("api.calendar.acl.insert and sharing.notify")
    expect((await gcal(["personal", "config", "set", "permissions.sharing.notify", "allow"])).code).toBe(0)
    expect((await gcal([...insert, "--yes", "--json"], fake)).code).toBe(0)
    expect(mailParam(fake)).toEqual([null, null])
  })

  it("names the method, not the mail, when the method itself is denied", async () => {
    const { gcal } = harness(SHARER)
    expect((await gcal(["personal", "config", "set", "permissions.api.calendar.acl.insert", "deny"])).code).toBe(0)
    expect(failure((await gcal([...insert, "--yes", "--json"])).err).details).toMatchObject({
      permission: "api.calendar.acl.insert",
    })
  })

  it("previews sharing.notify and its level with --dry-run, and refuses the preview at deny", async () => {
    const { gcal } = harness(SHARER)
    const fake = sharing()
    expect(failure((await gcal([...insert, "--dry-run", "--json"], fake)).err)).toMatchObject({
      code: "permission_error",
      details: { permission: "sharing.notify" },
      message: expect.stringContaining("sharing.notify is deny"),
    })
    expect((await gcal(["personal", "config", "set", "permissions.sharing.notify", "ask"])).code).toBe(0)
    const previewed = await gcal([...insert, "--dry-run", "--json"], fake)
    expect(answerOf(previewed.out).item.permissions).toEqual([
      { key: "api.calendar.acl.insert", level: "ask" },
      { key: "sharing.notify", level: "ask" },
    ])
    const quiet = await gcal([...insert, "--send-notifications", "false", "--dry-run", "--json"], fake)
    expect(answerOf(quiet.out).item.permissions).toEqual([{ key: "api.calendar.acl.insert", level: "ask" }])
    expect(fake.fetch).not.toHaveBeenCalled()
  })

  it("defaults sharing.notify to deny", () => {
    expect(permissions.defaults["sharing.notify"]).toBe("deny")
  })

  it("holds over MCP: an agent cannot share a calendar with mail, and can without", async () => {
    const { env, keyring } = harness(SHARER)
    const fake = sharing()
    const { client } = await mcpClient({ env, keyring, fetch: fake.fetch })
    try {
      const share = async (args: Record<string, unknown>) =>
        (await client.callTool({
          name: "gcal_write",
          arguments: { command: "api calendar-acl-insert", arguments: { calendar_id: "primary", body, ...args } },
        })) as { isError?: boolean; content: { text: string }[] }
      const mailed = await share({})
      expect(mailed.isError).toBe(true)
      expect(mailed.content[0]?.text).toContain("sharing.notify")
      expect(fake.fetch).not.toHaveBeenCalled()
      const quiet = await share({ send_notifications: "false" })
      expect(quiet.isError).toBeFalsy()
      expect(mailParam(fake)).toEqual(["false"])
    } finally {
      await client.close()
    }
  })
})

// Shapes from the Calendar API reference (Events resource: description, location); every value is made up.
const SECRET_TEXT = {
  ...MEETING,
  id: "evttext1",
  description:
    'Agenda<br>Join: <a href="https://meet.example.com/j/123?pwd=fixturelink92">meeting</a><br>Passcode: fixturedesc81',
  location: "https://meet.example.com/j/123?pwd=fixtureloc73",
  attendees: [{ email: "ana@example.com", displayName: "Ana Example", responseStatus: "needsAction" }],
}
const TEXT_SECRETS = ["fixturelink92", "fixturedesc81", "fixtureloc73"]

describe("event text", () => {
  it.each([
    [["api", "calendar-events-list", "--calendar-id", "primary"], { kind: "calendar#events", items: [SECRET_TEXT] }],
    [
      ["api", "calendar-events-instances", "--calendar-id", "primary", "--event-id", "evtseries1"],
      { kind: "calendar#events", items: [SECRET_TEXT] },
    ],
    [["api", "calendar-events-get", "--calendar-id", "primary", "--event-id", "evttext1"], SECRET_TEXT],
    [
      ["api", "calendar-events-insert", "--calendar-id", "primary", "--body", "{}", "--yes"],
      SECRET_TEXT,
      ["openid", "email", CALENDAR_READ_SCOPE, EVENTS_SCOPE],
    ],
  ])("loses passcodes and link queries, and is marked untrusted, through %j", async (words, answer, scopes?) => {
    const { gcal } = harness(scopes)
    const shown = await gcal(
      ["personal", ...words, "--json"],
      google(() => json(answer)),
    )
    expect(shown.code).toBe(0)
    for (const secret of [...TEXT_SECRETS, ...SECRETS]) expect(shown.out).not.toContain(secret)
    const item = answerOf(shown.out).item
    const event = item.items?.[0] ?? item
    expect(event.description).toBe("Agenda\nJoin: https://meet.example.com/j/123 meeting")
    expect(event.location).toBe("https://meet.example.com/j/123")
    const prefix = item.items ? "items." : ""
    expect(item.untrusted).toEqual(
      expect.arrayContaining(
        ["summary", "description", "location", "attendees.display_name"].map((path) => prefix + path),
      ),
    )
  })

  it("leaves a calendar's answer unmarked", async () => {
    const { gcal } = harness()
    const calendar = { kind: "calendar#calendar", id: "primary", summary: "Example", description: "Passcode: kept" }
    const shown = answerOf(
      (
        await gcal(
          ["personal", "api", "calendar-calendars-get", "--calendar-id", "primary", "--json"],
          google(() => json(calendar)),
        )
      ).out,
    ).item
    expect(shown.untrusted).toBeUndefined()
  })
})
