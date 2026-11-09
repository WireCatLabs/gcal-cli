import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring } from "@wirecat/cli-base"
import { rememberAccount } from "@wirecat/cli-core/cli"
import { expect, it } from "vitest"
import { CALENDAR_READ_SCOPE, sessionStorage } from "./google.js"
import { IDENTITY } from "./identity.js"
import { run } from "./program.js"
import { openGcalStore } from "./store.js"
import { fakeGoogleCalendar } from "./testing/google-calendar.js"

const harness = () => {
  const keyring = memoryKeyring()
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
    GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
    MESSAGING_STORE: join(mkdtempSync(join(tmpdir(), "store-")), "wirecat.db"),
  }
  sessionStorage(env, "personal", keyring).write({
    tokens: {
      accessToken: "fixture-access-token-Qm4z",
      refreshToken: "fixture-refresh",
      expiresAt: Date.now() + 3_600_000,
      scopes: [CALENDAR_READ_SCOPE],
    },
    client: { clientId: "fixture-client.apps" },
  })
  rememberAccount(IDENTITY, "personal", "owner@example.com", env)
  const google = fakeGoogleCalendar()
  const gcal = async (...argv: string[]) => {
    const out: string[] = []
    const err: string[] = []
    const tty = argv[0] === "--tty"
    const code = await run(tty ? argv.slice(1) : argv, {
      streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
      tty,
      env,
      keyring,
      fetch: google.fetch as typeof fetch,
    })
    return { code, out: out.join("\n"), err: err.join("\n") }
  }
  return { gcal, env, google }
}

const seedMessage = async (env: NodeJS.ProcessEnv) => {
  const store = await openGcalStore(env)
  try {
    const telegram = { provider: "telegram", account: "500" }
    await store.chats.saveChats(telegram, [
      { id: "c1", title: "Team", kind: "group", unreadCount: null, lastMessageAt: null, participantsCount: null },
    ])
    await store.messages.saveMessages(
      telegram,
      "c1",
      [
        {
          id: "m1",
          chatId: "c1",
          senderId: "ana",
          senderName: "Ana",
          timestamp: "2026-01-21T10:00:00.000Z",
          editedAt: null,
          text: "agenda for the weekly planning is in the doc",
          outgoing: false,
          attachments: [],
          replyTo: null,
          forwardedFrom: null,
          reactions: null,
        },
      ],
      { via: "test" },
    )
    await store.searchIndex.fillSearchIndex()
  } finally {
    await store.close()
  }
}

it("search all finds a stored message and the synced meeting, and names the accounts it read", async () => {
  const { gcal, env, google } = harness()
  expect((await gcal("personal", "sync", "--json")).code).toBe(0)
  await seedMessage(env)
  const reads = google.requests.length

  const answer = await gcal("personal", "search", "all", "planning", "--json")
  expect(answer.code).toBe(0)
  const { items, meta } = JSON.parse(answer.out)
  expect(new Set(items.map(({ kind }: { kind: string }) => kind))).toEqual(new Set(["message", "event"]))
  expect(items.find(({ kind }: { kind: string }) => kind === "message")).toMatchObject({
    provider: "telegram",
    untrusted: expect.arrayContaining(["excerpt", "sender_name"]),
  })
  expect(meta.accounts).toEqual(expect.arrayContaining(["telegram:500", "google-calendar:owner@example.com"]))
  expect(meta.issues).toBeUndefined()
  expect(google.requests.length).toBe(reads)

  const text = await gcal("--tty", "personal", "search", "all", "planning")
  expect(text.code).toBe(0)
  expect(text.err).toMatch(/searched: .*telegram:500/)
  expect(text.out).toContain("event · google-calendar · Weekly planning")
  expect(text.out).toContain("message · telegram · Team")

  const compact = await gcal("--tty", "personal", "search", "all", "planning", "--compact")
  expect(compact.code).toBe(0)
  expect(compact.out).toContain("event:")

  const events = await gcal("personal", "search", "all", "planning", "--only", "events", "--exact", "--json")
  expect(JSON.parse(events.out).items.map(({ kind }: { kind: string }) => kind)).toEqual(["event"])
  const second = await gcal("personal", "search", "all", "planning", "--limit", "1", "--page", "2", "--json")
  expect(JSON.parse(second.out).items).toHaveLength(1)
  const zoned = await gcal("personal", "search", "all", "planning", "--timezone", "Europe/Madrid", "--json")
  expect(zoned.code).toBe(0)
  const meetings = await gcal("personal", "search", "all", "planning", "--max-meetings", "5", "--json")
  expect(meetings.code).toBe(2)
  expect(meetings.err).toContain("unknown option '--max-meetings'")
})

it("search all refuses mail, which memo searches, and keeps a locked profile to its own calendar", async () => {
  const { gcal, env } = harness()
  const mail = await gcal("personal", "search", "all", "invoice", "--only", "mail", "--json")
  expect(mail.code).toBe(2)
  expect(mail.err).toContain("memo search mail")
  env.GCAL_PROFILE_LOCK = "personal"
  const locked = await gcal("personal", "search", "all", "planning", "--source", "telegram", "--json")
  expect(locked.err).toContain("profile.locked")
})

it("search all obeys permissions.search.all", async () => {
  const { gcal, env } = harness()
  const file = join(env.GCAL_CONFIG_DIR ?? "", "config.json")
  writeFileSync(file, JSON.stringify({ defaults: { permissions: { "search.all": "deny" } } }))
  const denied = await gcal("personal", "search", "all", "planning", "--json")
  expect(denied.code).not.toBe(0)
  expect(denied.err).toContain("search.all")
})
