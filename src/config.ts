import { CALENDAR_WRITE_DEFAULTS, CALENDAR_WRITE_KEYS, type CalendarWrite } from "@wirecat/cli-core/calendar"
import { type Configuration, commandPathKey, commandPermissions, settingsFor } from "@wirecat/cli-core/cli"
import type { Level } from "@wirecat/cli-core/sends"
import * as v from "valibot"
import { SHARING_NOTIFY_KEY } from "./api-keys.js"
import { operations } from "./generated/manifest.js"
import { IDENTITY } from "./identity.js"

/** Deleting every event of the main calendar stays with the owner at a terminal. */
export const OWNER_ONLY = /^calendar\.calendars\.clear$/

/**
 * Losing a whole calendar is denied until the owner allows it (NEED-2051): `ask` runs without a question over MCP.
 * Sharing stays `ask` (NEED-1857).
 */
const DENIED = /^calendar\.calendars\.(clear|delete|transferOwnership)$/
const SHARING = /^calendar\.acl\.(insert|patch|update)$/

export const apiKey = (method: string): string => `api.${method}`

/** The generated method each shared write calls, so denying `api` cannot be bypassed through `events create`. */
const WRITE_METHODS: Record<CalendarWrite, string[]> = {
  create: ["calendar.events.insert"],
  "quick-add": ["calendar.events.quickAdd"],
  import: ["calendar.events.import"],
  // A switch between timed and all-day replaces the event with events.update.
  update: ["calendar.events.patch", "calendar.events.update"],
  delete: ["calendar.events.delete"],
  respond: ["calendar.events.patch"],
  move: ["calendar.events.move"],
}

export const writeKeys = (write: CalendarWrite): string[] => WRITE_METHODS[write].map(apiKey)

/** As the shared writes (WC-PERM-22): an ordinary change is allowed, a delete and a share ask, a lost calendar is denied. */
const apiDefault = ({ id, effect }: (typeof operations)[number]): Level => {
  if (DENIED.test(id)) return "deny"
  return effect === "destructive" || SHARING.test(id) ? "ask" : "allow"
}

const keyOf = (path: readonly string[]) => {
  if (path[0] !== "api" || path[1] === undefined) return commandPathKey(path)
  // `list` and `show` never reach Google. `call` names its method only in its arguments, so it checks
  // api.<method> itself once it knows which.
  if (["call", "list", "show"].includes(path[1])) return null
  const operation = operations.find((one) => one.command === path[1])
  return operation ? apiKey(operation.id) : commandPathKey(path)
}

const WRITE_COMMANDS: Record<string, CalendarWrite> = {
  "events create": "create",
  "events import": "import",
  "events update": "update",
  "events delete": "delete",
  "events respond": "respond",
  "events move": "move",
}

export const permissions = commandPermissions({
  keyOf,
  // A preview shows the api.* keys the write checks too; `create --text` checks quickAdd's, which a path cannot tell.
  alsoChecks: (path) => {
    const write = WRITE_COMMANDS[path.join(" ")]
    return write ? writeKeys(write) : []
  },
  extra: [...operations.map((operation) => apiKey(operation.id)), ...CALENDAR_WRITE_KEYS, SHARING_NOTIFY_KEY],
  defaults: {
    ...Object.fromEntries(
      operations
        .filter((operation) => operation.effect !== "read" && apiDefault(operation) !== "allow")
        .map((operation) => [apiKey(operation.id), apiDefault(operation)]),
    ),
    ...CALENDAR_WRITE_DEFAULTS,
    [SHARING_NOTIFY_KEY]: "deny",
  },
})

export const configuration: Configuration = settingsFor(IDENTITY, {
  permissions,
  // Only the id: the secret comes from GCAL_GOOGLE_CLIENT_SECRET, as cli-core's oauthApp reads it.
  profile: { google_client_id: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))) },
})

/** Settings only the owner changes, at a terminal: which Google app a sign-in trusts. */
export const OWNER_ONLY_SETTINGS = { settings: ["google_client_id"] }
