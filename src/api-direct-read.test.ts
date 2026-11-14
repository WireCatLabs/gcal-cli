import { existsSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring } from "@wirecat/cli-base"
import { describe, expect, it, vi } from "vitest"
import { CALENDAR_READ_SCOPE, sessionStorage } from "./google.js"
import { run } from "./program.js"

const FIELDS = "items(id,attachments(fileId,mimeType),conferenceData/conferenceSolution/name,organizer/self)"
const EVENTS = {
  items: [
    {
      id: "evtfixture1",
      attachments: [{ fileId: "file-fixture-1", mimeType: "application/pdf" }],
      conferenceData: { conferenceSolution: { name: "Google Meet" } },
      organizer: { self: true },
    },
  ],
}

const openAppStore = vi.hoisted(() => vi.fn())
vi.mock("@wirecat/cli-core/cli", async (actual) => ({
  ...(await actual<typeof import("@wirecat/cli-core/cli")>()),
  openAppStore,
}))

const harness = () => {
  const keyring = memoryKeyring()
  const store = join(mkdtempSync(join(tmpdir(), "store-")), "wirecat.db")
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
    GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
    MESSAGING_STORE: store,
  }
  sessionStorage(env, "personal", keyring).write({
    tokens: {
      accessToken: "fixture-access",
      refreshToken: "fixture-refresh",
      expiresAt: Date.now() + 3_600_000,
      scopes: ["openid", "email", CALENDAR_READ_SCOPE],
    },
    client: { clientId: "fixture-client.apps", clientSecret: "fixture-secret" },
  })
  const urls: URL[] = []
  const fetch = vi.fn(async (input: string | URL | Request) => {
    urls.push(new URL(String(input)))
    return new Response(JSON.stringify(EVENTS), { headers: { "content-type": "application/json" } })
  })
  const gcal = async (argv: string[]) => {
    const out: string[] = []
    const err: string[] = []
    const code = await run(argv, {
      streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
      tty: false,
      env,
      keyring,
      fetch,
    })
    return { code, out: out.join("\n"), err: err.join("\n") }
  }
  const storeOpened = () => openAppStore.mock.calls.length > 0 || existsSync(store)
  return { gcal, urls, storeOpened }
}

describe("reading Google Calendar directly", () => {
  it("sends fields from --params under --json, returns Google's answer and never opens the store", async () => {
    const { gcal, urls, storeOpened } = harness()
    const params = JSON.stringify({ calendarId: "primary", fields: FIELDS })
    const answer = await gcal(["personal", "api", "call", "calendar.events.list", "--params", params, "--json"])
    expect(answer.err).toBe("")
    expect(answer.code).toBe(0)
    expect(urls.at(-1)?.searchParams.get("fields")).toBe(FIELDS)
    expect(JSON.parse(answer.out).item.items[0]).toMatchObject({ attachments: [{ file_id: "file-fixture-1" }] })
    expect(storeOpened()).toBe(false)
  })

  it("sends the generated command's --fields to Google under --json", async () => {
    const { gcal, urls, storeOpened } = harness()
    const answer = await gcal([
      "personal",
      "api",
      "calendar-events-list",
      "--calendar-id",
      "primary",
      "--fields",
      FIELDS,
      "--json",
    ])
    expect(answer.err).toBe("")
    expect(answer.code).toBe(0)
    expect(urls.at(-1)?.searchParams.get("fields")).toBe(FIELDS)
    expect(storeOpened()).toBe(false)
  })
})
