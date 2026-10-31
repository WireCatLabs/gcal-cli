import { CliError } from "@wirecat/cli-base"
import { operations } from "./api-contract.js"
import { metadata } from "./generated/metadata.js"

const SCOPE = "https://www.googleapis.com/auth/"
/** Narrowest first: the scope `api list` names is the one gcal would ask Google for. */
const READ_PREFERENCE = ["calendar.readonly", "calendar.acls.readonly", "calendar"].map((name) => SCOPE + name)
const WRITE_PREFERENCE = [
  "calendar.events",
  "calendar.calendarlist",
  "calendar.calendars",
  "calendar.acls",
  "calendar",
].map((name) => SCOPE + name)

export interface ApiMethod {
  name: string
  mutates: boolean
  destructive: boolean
  scope: string
}

const SCOPES: Readonly<Record<string, readonly string[]>> = metadata.scopes

export const scopesOf = (name: string): readonly string[] => SCOPES[name] ?? []

/** The methods gcal can call; `service` keeps those of one Google service, as `api list service:calendar` asks. */
export const apiMethods = (service?: string): ApiMethod[] => {
  const chosen = service === undefined ? operations : operations.filter(({ id }) => id.startsWith(`${service}.`))
  return chosen.map((operation) => {
    const scopes = scopesOf(operation.id)
    const preference = operation.effect === "read" ? READ_PREFERENCE : WRITE_PREFERENCE
    const scope = preference.find((candidate) => scopes.includes(candidate))
    if (!scope) throw new CliError("configuration_error", "generated method has no supported OAuth scope")
    return {
      name: operation.id,
      mutates: operation.effect !== "read",
      destructive: operation.effect === "destructive",
      scope,
    }
  })
}

export const apiMethod = (name: string): ApiMethod => {
  const found = apiMethods().find((method) => method.name === name)
  if (!found)
    throw new CliError("validation_error", "unknown Google Calendar method", {
      reason: "api.unknown-method",
    })
  return found
}

/** Only scalars and lists of scalars: anything else would be sent as "[object Object]". */
export const validateApiParams = (params: Record<string, unknown>): void => {
  if (
    !params ||
    typeof params !== "object" ||
    Array.isArray(params) ||
    Object.values(params).some((value) =>
      Array.isArray(value)
        ? value.some((item) => item !== null && typeof item === "object")
        : value !== null && typeof value === "object",
    )
  )
    throw new CliError("validation_error", "API parameters must be scalar values or scalar arrays")
}
