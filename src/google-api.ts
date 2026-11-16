import { CliError, isCliError } from "@wirecat/cli-base"
import { providerWaitMs, readJsonResponse } from "@wirecat/cli-base/http"
import { type EventSink, providerRequest } from "@wirecat/cli-core/cli"
import { googleError } from "@wirecat/cli-core/google"
import * as v from "valibot"
import { type ApiContract, CALENDAR, operationOf, validateRequest } from "./api-contract.js"
import { validateApiParams } from "./api-methods.js"
import {
  ACLS_SCOPE,
  EVENTS_SCOPE,
  type Grant,
  grantMissing,
  grantsOf,
  MEET_READ_SCOPE,
  MEET_WRITE_SCOPE,
} from "./grants.js"

const MAX_BYTES = 50 * 1024 * 1024
const TIMEOUT_MS = 30_000

export interface CallOptions {
  /** Request headers beside gcal's own, such as `If-Match`; they never replace the token or the content type. */
  headers?: Record<string, string>
}

export interface GoogleApi {
  call(
    method: string,
    params?: Record<string, unknown>,
    body?: Record<string, unknown>,
    options?: CallOptions,
  ): Promise<unknown>
}

export interface GoogleApiOptions {
  fetch: typeof fetch
  /** The scopes the saved sign-in holds, read without a network call. */
  scopes: () => readonly string[] | undefined
  accessToken: () => Promise<string>
  signal?: AbortSignal | undefined
  /** The run's own sink; without it the request is timed but not recorded. */
  events?: EventSink | undefined
  /** The clock a `Retry-After` date is measured against. */
  now?: () => Date
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null

/** cli-core's Google refusals, and the one only Calendar sends: a guest changing what the organizer owns. */
const refusal = (contract: ApiContract, failure: Parameters<typeof googleError>[0]): CliError => {
  const error = isRecord(failure.body) ? failure.body.error : undefined
  const reasons = isRecord(error) && Array.isArray(error.errors) ? error.errors.map((item) => item?.reason) : []
  if (reasons.includes("forbiddenForNonOrganizer"))
    return new CliError(
      "permission_error",
      "only the organizer can change this; change your own copy's fields only, such as your answer or reminders",
      { reason: "event.organizer-only", status: failure.status },
    )
  return googleError({
    ...failure,
    service: contract.name,
    ...(contract.errorsGuide ? { errorsGuide: contract.errorsGuide } : {}),
  })
}

const scopeNames = (scopes: readonly string[]) =>
  scopes.map((scope) => scope.replace("https://www.googleapis.com/auth/", "")).join(" or ")

const GRANT_OF: [scope: string, grant: Grant | Grant[], what: (scopes: readonly string[]) => string][] = [
  [
    EVENTS_SCOPE,
    "write",
    () => "this method changes Google Calendar events, and this profile signed in with read access only",
  ],
  [ACLS_SCOPE, "sharing", (scopes) => `this method reads or changes who can see a calendar (${scopeNames(scopes)})`],
  [MEET_READ_SCOPE, "meetings", () => "this profile signed in without access to Google Meet"],
  [MEET_WRITE_SCOPE, ["write", "meetings"], () => "this method makes or changes a Google Meet space"],
]

/** Refuses a method the saved sign-in cannot call; with no saved scopes Google decides. */
export const refuseMissingScope = (
  name: string,
  granted: readonly string[] | undefined,
  contract: ApiContract = CALENDAR,
): void => {
  const scopes = contract.scopes[name] ?? []
  if (!granted || scopes.some((scope) => granted.includes(scope))) return
  const covered = GRANT_OF.find(([scope]) => scopes.includes(scope))
  if (covered) throw grantMissing(covered[1], covered[2](scopes), grantsOf(granted))
  throw new CliError(
    "permission_error",
    `this method needs a Google permission gcal does not ask for at sign-in (${scopeNames(scopes)})`,
    { reason: "oauth.scope-missing", sent: false },
  )
}

const listOf = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(String)
    : typeof value === "string"
      ? value.split(",").map((item) => item.trim())
      : [String(value)]

/** `new URL` folds a `.` or `..` segment into its parent, so such an id would call another endpoint. */
const segmentOf = (key: string, value: unknown) => {
  const text = value === undefined || value === null ? "" : String(value)
  if (text === "" || text === "." || text === "..")
    throw new CliError("validation_error", `${key} must name one item; an empty, "." or ".." id is refused`, {
      reason: "api.bad-path-id",
      sent: false,
    })
  return encodeURIComponent(text)
}

/** `rootUrl + servicePath + path`, path parameters encoded whole, so an id never adds a segment or a query. */
const requestUrl = (contract: ApiContract, name: string, params: Record<string, unknown>) => {
  const operation = operationOf(name, contract)
  if (operation.binding.kind !== "http") throw new CliError("configuration_error", "generated method is not HTTP")
  const service = contract.services[operation.tags[0] ?? ""]
  if (!service) throw new CliError("configuration_error", "generated method names no known Google service")
  if (operation.binding.path.includes("{+"))
    throw new CliError("configuration_error", "generated method has a reserved path expansion gcal does not send")
  const where = new Map(operation.parameters.map((parameter) => [parameter.name, parameter]))
  const path = operation.binding.path.replace(/\{([^}]+)\}/g, (_, key: string) => segmentOf(key, params[key]))
  const url = new URL(service.servicePath + path, service.rootUrl)
  for (const [key, value] of Object.entries(params)) {
    const parameter = where.get(key)
    if (value === undefined || value === null || parameter?.in !== "query") continue
    for (const item of parameter.schema.type === "array" ? listOf(value) : [String(value)])
      url.searchParams.append(key, item)
  }
  return {
    url,
    method: operation.binding.method,
    mutates: operation.effect !== "read",
    // The template, not the address: a run record never holds a calendar or event id.
    operation: `${operation.binding.method} /${service.servicePath}${operation.binding.path}`,
    response: operation.response?.schema,
  }
}

/** A method's answer as its generated type: `call` returns it unknown, so the schema both checks and names it. */
export const answerOf = <T>(schema: v.GenericSchema<unknown, T>, data: unknown, contract = CALENDAR): T => {
  const parsed = v.safeParse(schema, data)
  if (!parsed.success)
    throw new CliError("invalid_response", `${contract.name}'s answer does not match the API contract`)
  return parsed.output
}

const unknownOutcome = () =>
  new CliError("outcome_unknown", "Google write has no certain outcome; check Google before repeating it", {
    retryable: false,
  })

/** A generated Google API over plain fetch: the token goes in the Authorization header only, never into an address. */
export const googleApi = (options: GoogleApiOptions, contract: ApiContract = CALENDAR): GoogleApi => ({
  call: async (name, params = {}, body, { headers = {} } = {}) => {
    validateApiParams(params)
    if (body !== undefined && (!body || typeof body !== "object" || Array.isArray(body)))
      throw new CliError("validation_error", "API request body must be a JSON object")
    validateRequest(name, params, body, contract)
    refuseMissingScope(name, options.scopes(), contract)
    const request = requestUrl(contract, name, params)
    const { mutates } = request
    const token = await options.accessToken()
    // Not AbortSignal.timeout: its timer holds the run's async context until the deadline (tg-cli #827).
    const deadline = new AbortController()
    const timer = setTimeout(() => deadline.abort(new DOMException("timed out", "TimeoutError")), TIMEOUT_MS)
    timer.unref()
    const signal = options.signal ? AbortSignal.any([options.signal, deadline.signal]) : deadline.signal
    const answered = providerRequest(request.operation, options.events)
    try {
      let response: Response
      try {
        response = await options.fetch(request.url, {
          method: request.method,
          headers: {
            ...headers,
            authorization: `Bearer ${token}`,
            accept: "application/json",
            ...(body === undefined ? {} : { "content-type": "application/json" }),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal,
          redirect: "error",
        })
      } catch (error) {
        // A cut write may have reached Google, and a caller told "cancelled" would send it again (WC-LIFE-9).
        if (mutates) {
          answered({ error, errorCode: "outcome_unknown" })
          throw unknownOutcome()
        }
        const stopped = options.signal?.aborted
        answered({ error, errorCode: stopped ? "cancelled" : "provider_unavailable" })
        if (stopped) throw new CliError("cancelled", `the ${contract.name} request was stopped`)
        throw new CliError("provider_unavailable", `${contract.name} did not answer; no request details were logged`, {
          retryable: true,
        })
      }
      if (!response.ok) {
        answered({ status: response.status, errorCode: "provider_error" })
        const failure = await readJsonResponse(response, { maxBytes: 64 * 1024, signal }).catch(() => undefined)
        throw refusal(contract, {
          status: response.status,
          body: failure,
          mutates,
          retryAfterMs: providerWaitMs(response.headers, options.now ?? (() => new Date())),
        })
      }
      answered({ status: response.status })
      if (response.status === 204 || response.headers.get("content-length") === "0") return null
      let data: unknown
      try {
        data = await readJsonResponse(response, { maxBytes: MAX_BYTES, signal })
      } catch (error) {
        if (mutates && signal.aborted) throw unknownOutcome()
        if (isCliError(error) && error.code !== "invalid_response") throw error
        throw new CliError("invalid_response", `${contract.name} answered with something other than bounded JSON`)
      }
      const schema = request.response ? contract.schemas[request.response] : undefined
      if (schema && !v.safeParse(schema, data).success)
        throw new CliError("invalid_response", `${contract.name}'s answer does not match the API contract`)
      return data
    } finally {
      clearTimeout(timer)
    }
  },
})
