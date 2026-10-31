import { CALENDAR_WRITE_DEFAULTS, CALENDAR_WRITE_KEYS, type CalendarWrite } from "@wirecat/cli-core/calendar"
import { type Configuration, commandPathKey, commandPermissions, settingsFor } from "@wirecat/cli-core/cli"
import type { Level } from "@wirecat/cli-core/sends"
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

export const apiKey = (method: string): string => `api.${method}`

/** The generated method each shared write calls, so denying `api` cannot be bypassed through `events create`. */
const WRITE_METHODS: Record<CalendarWrite, string[]> = {
  create: ["calendar.events.insert"],
  // A switch between timed and all-day replaces the event with events.update.
  update: ["calendar.events.patch", "calendar.events.update"],
  delete: ["calendar.events.delete"],
  respond: ["calendar.events.patch"],
  move: ["calendar.events.move"],
}

export const writeKeys = (write: CalendarWrite): string[] => WRITE_METHODS[write].map(apiKey)

const apiDefault = (id: string): Level => (DENIED.test(id) ? "deny" : "ask")

const keyOf = (path: readonly string[]) => {
  if (path[0] !== "api" || path[1] === undefined) return commandPathKey(path)
  // `list` and `show` never reach Google. `call` names its method only in its arguments, so it checks
  // api.<method> itself once it knows which.
  if (["call", "list", "show"].includes(path[1])) return null
  const operation = operations.find((one) => one.command === path[1])
  return operation ? apiKey(operation.id) : commandPathKey(path)
}

export const configuration: Configuration = settingsFor(IDENTITY, {
  permissions: commandPermissions({
    keyOf,
    extra: [...operations.map((operation) => apiKey(operation.id)), ...CALENDAR_WRITE_KEYS, SHARING_NOTIFY_KEY],
    defaults: {
      ...Object.fromEntries(
        operations
          .filter((operation) => operation.effect !== "read")
          .map((operation) => [apiKey(operation.id), apiDefault(operation.id)]),
      ),
      ...CALENDAR_WRITE_DEFAULTS,
      [SHARING_NOTIFY_KEY]: "deny",
    },
  }),
})

export const permissions = configuration.permissions as NonNullable<Configuration["permissions"]>
