import { realpathSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { pathToFileURL } from "node:url"

// The previous release writes the state with its own modules and its own cli-core: a sync from a fake Google, as
// `gcal sync` makes one, so the candidate reopens the schema, rows and sync cursor that release left.
const entry = realpathSync(process.argv[2])
const fromPrevious = createRequire(entry)
const previous = (path) => import(pathToFileURL(join(dirname(entry), "..", path)).href)
const core = (name) => import(pathToFileURL(fromPrevious.resolve(`@wirecat/cli-core/${name}`)).href)

if (!process.env.WIRECAT_CONTRACT_DENIED) throw new Error("requires the isolated contract runner")

const [{ IDENTITY }, { openGcalStore, PROVIDER }, { googleCalendarSource }, { rememberAccount }, { syncCalendars }] =
  await Promise.all([
    previous("identity.js"),
    previous("store.js"),
    previous("calendar-source.js"),
    core("cli"),
    core("calendar"),
  ])

const account = "synthetic.owner@example.com"
const calendarId = "synthetic-calendar@example.com"
const now = Date.parse("2026-10-01T10:00:00Z")
const syncCursor = "synthetic-cursor-1"

const google = {
  "calendar.calendarList.list": () => ({
    items: [
      {
        id: calendarId,
        summary: "Synthetic Contract Calendar",
        timeZone: "Europe/Madrid",
        accessRole: "owner",
        primary: true,
      },
    ],
  }),
  "calendar.events.list": () => ({
    items: [
      {
        id: "syntheticsingle1",
        status: "confirmed",
        summary: "wirecat-synthetic-event-canary",
        location: "Synthetic Room",
        start: { dateTime: "2026-10-02T09:00:00+02:00", timeZone: "Europe/Madrid" },
        end: { dateTime: "2026-10-02T10:00:00+02:00", timeZone: "Europe/Madrid" },
        attendees: [
          { email: account, self: true, responseStatus: "accepted" },
          { email: "synthetic.guest@example.com", displayName: "Synthetic Guest", responseStatus: "needsAction" },
        ],
        organizer: { email: account },
        updated: "2026-09-30T10:00:00Z",
      },
      {
        id: "syntheticallday1",
        status: "confirmed",
        summary: "Synthetic all-day",
        start: { date: "2026-10-05" },
        end: { date: "2026-10-06" },
        updated: "2026-09-30T10:00:00Z",
      },
    ],
    nextSyncToken: syncCursor,
  }),
}

const api = { call: async (method) => google[method]?.() ?? {} }

rememberAccount(IDENTITY, "contract", account, process.env)
const store = await openGcalStore(process.env)
try {
  const key = { provider: PROVIDER.name, account }
  await store.accounts.saveProfile(IDENTITY.command, "contract", key)
  const accountId = await store.accounts.saveAccount(key, { name: null })
  const report = await syncCalendars(googleCalendarSource(api), store.calendar, { accountId, now })
  if (!report.complete) throw new Error("the previous release's sync did not complete")
} finally {
  await store.close()
}
process.stdout.write(`${JSON.stringify({ seeded: true })}\n`)
