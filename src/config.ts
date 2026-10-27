import { type Configuration, commandPathKey, commandPermissions, settingsFor } from "@wirecat/cli-core/cli"
import type { Level } from "@wirecat/cli-core/sends"
import { operations } from "./generated/manifest.js"
import { IDENTITY } from "./identity.js"

/** Sharing a calendar, emptying it and giving it away stay with the owner at a terminal (NEED-1857). */
export const OWNER_ONLY = /^calendar\.(acl\.|calendars\.clear$|calendars\.transferOwnership$)/

export const apiKey = (method: string): string => `api.${method}`

const apiDefault = (id: string): Level => (OWNER_ONLY.test(id) ? "deny" : "ask")

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
    extra: operations.map((operation) => apiKey(operation.id)),
    defaults: Object.fromEntries(
      operations
        .filter((operation) => operation.effect !== "read")
        .map((operation) => [apiKey(operation.id), apiDefault(operation.id)]),
    ),
  }),
})

export const permissions = configuration.permissions as NonNullable<Configuration["permissions"]>
