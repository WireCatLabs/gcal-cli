import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring } from "@wirecat/cli-base"
import { rememberAccount } from "@wirecat/cli-core/cli"
import { describe, expect, it } from "vitest"
import { CALENDAR_READ_SCOPE, sessionStorage } from "./google.js"
import { IDENTITY } from "./identity.js"
import { run } from "./program.js"
import { fakeGoogleCalendar } from "./testing/google-calendar.js"

const TOKEN = "privateFeedToken9Qz"
const FEED = `https://feeds.example.com/private-${TOKEN}/basic.ics`

const feedText = (...events: string[][]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", "X-WR-CALNAME:Example league", ...events.flat(), "END:VCALENDAR", ""].join("\r\n")

const day = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10).replaceAll("-", "")

const MATCH = [
  "BEGIN:VEVENT",
  "UID:match-1@example.com",
  `DTSTART:${day(3)}T180000Z`,
  `DTEND:${day(3)}T200000Z`,
  "SUMMARY:Example match",
  "END:VEVENT",
]
const TRAINING = [
  "BEGIN:VEVENT",
  "UID:training@example.com",
  `DTSTART;TZID=Europe/Madrid:${day(1)}T190000`,
  `DTEND;TZID=Europe/Madrid:${day(1)}T203000`,
  "RRULE:FREQ=WEEKLY;COUNT=4",
  "SUMMARY:Example training",
  "END:VEVENT",
]

/** Every file under the folders, the store included, holds no copy of the feed's token. */
const holdsToken = (...folders: string[]): string[] =>
  folders.flatMap((folder) =>
    readdirSync(folder, { recursive: true, encoding: "utf8" })
      .map((name) => join(folder, name))
      .filter((path) => statSync(path).isFile() && readFileSync(path).includes(TOKEN)),
  )

const harness = () => {
  const keyring = memoryKeyring()
  const folders = {
    GCAL_CONFIG_DIR: mkdtempSync(join(tmpdir(), "config-")),
    GCAL_STATE_DIR: mkdtempSync(join(tmpdir(), "state-")),
    store: mkdtempSync(join(tmpdir(), "store-")),
  }
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GCAL_CONFIG_DIR: folders.GCAL_CONFIG_DIR,
    GCAL_STATE_DIR: folders.GCAL_STATE_DIR,
    MESSAGING_STORE: join(folders.store, "wirecat.db"),
  }
  sessionStorage(env, "personal", keyring).write({
    tokens: {
      accessToken: "fixture-access-token-7Kp2",
      refreshToken: "fixture-refresh",
      expiresAt: Date.now() + 3_600_000,
      scopes: [CALENDAR_READ_SCOPE],
    },
    client: { clientId: "fixture-client.apps" },
  })
  rememberAccount(IDENTITY, "personal", "owner@example.com", env)
  const google = fakeGoogleCalendar()
  const feed = {
    text: feedText(MATCH, TRAINING),
    status: 200,
    asked: 0,
    etag: null as string | null,
    conditional: [] as (string | undefined)[],
  }
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input))
    if (url.hostname !== "feeds.example.com") return google.fetch(input, init)
    feed.asked++
    const sent = new Headers(init?.headers).get("if-none-match") ?? undefined
    feed.conditional.push(sent)
    if (feed.etag !== null && sent === feed.etag) return new Response(null, { status: 304 })
    return new Response(feed.status === 200 ? feed.text : null, {
      status: feed.status,
      headers: feed.etag === null ? {} : { etag: feed.etag },
    })
  }
  const gcal = async (...argv: string[]) => {
    const out: string[] = []
    const err: string[] = []
    const code = await run([...argv, "--json"], {
      streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
      env,
      keyring,
      fetch: fetch as typeof globalThis.fetch,
    })
    return { code, out: out.join("\n"), err: err.join("\n") }
  }
  const json = async (...argv: string[]) => {
    const answer = await gcal(...argv)
    if (answer.code !== 0) throw new Error(`${argv.join(" ")} exited ${answer.code}: ${answer.err}`)
    return JSON.parse(answer.out)
  }
  const errorOf = async (...argv: string[]) => {
    const answer = await gcal(...argv)
    expect(answer.code).not.toBe(0)
    expect(`${answer.out}${answer.err}`).not.toContain(TOKEN)
    return JSON.parse(answer.err.trim().split("\n").at(-1) ?? "{}").error
  }
  return { gcal, json, errorOf, google, feed, keyring, env, folders: Object.values(folders) }
}

describe("feeds", () => {
  it("follows a feed as a read-only calendar: synced beside Google, listed and found, the address never shown", async () => {
    const { gcal, json, feed, folders } = harness()
    const added = await gcal("personal", "calendars", "add", FEED.replace("https://", "webcal://"))
    expect(added.code).toBe(0)
    expect(`${added.out}${added.err}`).not.toContain(TOKEN)
    const calendar = JSON.parse(added.out).item
    expect(calendar).toMatchObject({ title: "Example league", access_role: "reader", synced: true, events: 2 })

    const report = (await json("personal", "sync")).item
    expect(report).toMatchObject({ complete: true, feeds: [{ calendar_id: Number(calendar.id), events: 2 }] })
    expect(feed.asked).toBe(2)
    const events = (await json("personal", "events", "list", `calendar:${calendar.id}`)).items
    expect(events.map(({ title }: { title: string }) => title)).toEqual(
      expect.arrayContaining(["Example match", "Example training"]),
    )
    expect(events.filter(({ title }: { title: string }) => title === "Example training")).toHaveLength(4)
    const found = (await json("personal", "search", "events", "match")).items
    expect(found.map(({ title }: { title: string }) => title)).toContain("Example match")
    expect((await json("personal", "calendars", "list")).items.map(({ title }: { title: string }) => title)).toContain(
      "Example league",
    )
    expect(holdsToken(...folders)).toEqual([])
  })

  it("refuses a write to a feed's event before Google is asked, and a feed that went away names no address", async () => {
    const { json, errorOf, google, feed } = harness()
    const calendar = (await json("personal", "calendars", "add", FEED, "--title", "League")).item
    await json("personal", "sync")
    const match = (await json("personal", "events", "list", `calendar:${calendar.id}`)).items.find(
      ({ title }: { title: string }) => title === "Example match",
    )
    const asked = google.requests.length
    expect(await errorOf("personal", "events", "delete", `event:${match.id}`, "--yes")).toMatchObject({
      code: "permission_error",
      reason: "calendar.read-only",
    })
    expect(google.requests.length).toBe(asked)

    feed.status = 404
    const partial = await json("personal", "sync")
    expect(partial.meta).toMatchObject({
      complete: false,
      issues: [{ code: "provider_error", reason: "sync.partial" }],
    })
    expect(partial.item.hint).toContain(`feed ${calendar.id} answered HTTP 404`)
    expect(JSON.stringify(partial)).not.toContain(TOKEN)
    expect(await errorOf("personal", "calendars", "add", `${FEED}?other=1`)).toMatchObject({ reason: "feed.gone" })
  })

  it("GCAL_READ_ONLY refuses calendars add before the feed is read or kept", async () => {
    const { errorOf, env, feed, keyring } = harness()
    env.GCAL_READ_ONLY = "1"
    expect((await errorOf("personal", "calendars", "add", FEED)).code).toBe("permission_error")
    expect(feed.asked).toBe(0)
    expect(keyring.get(IDENTITY.appName, "feeds:personal")).toBeNull()
  })

  it("remove forgets the address in the keyring and deletes the feed's events, cancelled ones included", async () => {
    const { json, errorOf, keyring } = harness()
    const calendar = (await json("personal", "calendars", "add", FEED)).item
    await json("personal", "sync")
    expect(keyring.get(IDENTITY.appName, "feeds:personal")).not.toBeNull()
    const titles = async () =>
      (await json("personal", "events", "list", "starts_at>=today")).items.map(({ title }: { title: string }) => title)
    expect(await titles()).toContain("Example match")
    const removed = (await json("personal", "calendars", "remove", calendar.id)).item
    expect(removed).toMatchObject({ synced: false, events: expect.any(Number) })
    expect(removed.events).toBeGreaterThan(0)
    expect(keyring.get(IDENTITY.appName, "feeds:personal")).toBeNull()
    expect(await titles()).not.toContain("Example match")
    expect(await titles()).not.toContain("Example training")
    expect(await errorOf("personal", "events", "list", `calendar:${calendar.id}`)).toMatchObject({ code: "not_found" })
  })

  it("asks the feed whether it changed, and keeps its events when the server answers 304", async () => {
    const { json, feed } = harness()
    feed.etag = '"v1"'
    await json("personal", "calendars", "add", FEED)
    await json("personal", "sync")
    const again = (await json("personal", "sync")).item
    expect(feed.conditional).toEqual([undefined, undefined, '"v1"'])
    expect(again.feeds).toEqual([expect.objectContaining({ unchanged: true })])
    const titles = (await json("personal", "events", "list", "starts_at>=today")).items.map(
      ({ title, status }: { title: string; status: string }) => `${title} ${status}`,
    )
    expect(titles).toContain("Example match confirmed")
  })

  it("warns once on stderr for an http:// feed, without the address, and follows it", async () => {
    const { gcal } = harness()
    const added = await gcal("personal", "calendars", "add", FEED.replace("https://", "http://"))
    expect(added.code, added.err).toBe(0)
    expect(added.err.match(/unencrypted/g)).toHaveLength(1)
    expect(added.err).not.toContain(TOKEN)
    const quiet = await gcal("personal", "calendars", "add", FEED)
    expect(quiet.err).not.toContain("unencrypted")
  })
})
