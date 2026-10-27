import { CliError, isCliError } from "@wirecat/cli-base"
import { providerWaitMs, readJsonResponse } from "@wirecat/cli-base/http"
import { type EventSink, providerRequest } from "@wirecat/cli-core/cli"
import * as v from "valibot"
import { operationOf, schemas, validateRequest } from "./api-contract.js"
import { apiMethod, scopesOf, validateApiParams } from "./api-methods.js"
import { googleError } from "./errors.js"
import { metadata } from "./generated/metadata.js"
import { ACLS_SCOPE, EVENTS_SCOPE } from "./grants.js"

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
}

const scopeNames = (name: string) =>
  scopesOf(name)
    .map((scope) => scope.replace("https://www.googleapis.com/auth/", ""))
    .join(" or ")

/** A method no `--grant` covers is named by its scopes instead. */
const scopeMissing = (name: string) =>
  scopesOf(name).includes(EVENTS_SCOPE)
    ? new CliError(
        "permission_error",
        "this method changes Google Calendar events, and this profile signed in with read access only",
        { reason: "api.scope-missing", grant: "write", sent: false },
      )
    : scopesOf(name).includes(ACLS_SCOPE)
      ? new CliError("permission_error", `this method reads or changes who can see a calendar (${scopeNames(name)})`, {
          reason: "api.scope-missing",
          grant: "sharing",
          sent: false,
        })
      : new CliError(
          "permission_error",
          `this method needs a Google permission gcal does not ask for at sign-in (${scopeNames(name)})`,
          { reason: "api.scope-missing", sent: false },
        )

/** Refuses a method the saved sign-in cannot call; with no saved scopes Google decides. */
export const refuseMissingScope = (name: string, granted: readonly string[] | undefined): void => {
  if (granted && !scopesOf(name).some((scope) => granted.includes(scope))) throw scopeMissing(name)
}

const listOf = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(String)
    : typeof value === "string"
      ? value.split(",").map((item) => item.trim())
      : [String(value)]

/** `rootUrl + servicePath + path`, path parameters encoded whole, so an id never adds a segment or a query. */
const requestUrl = (name: string, params: Record<string, unknown>) => {
  const operation = operationOf(name)
  if (operation.binding.kind !== "http") throw new CliError("configuration_error", "generated method is not HTTP")
  const services = metadata.services as Record<string, { rootUrl: string; servicePath: string }>
  const service = services[operation.tags[0] ?? ""]
  if (!service) throw new CliError("configuration_error", "generated method names no known Google service")
  if (operation.binding.path.includes("{+"))
    throw new CliError("configuration_error", "generated method has a reserved path expansion gcal does not send")
  const where = new Map(operation.parameters.map((parameter) => [parameter.name, parameter]))
  const path = operation.binding.path.replace(/\{([^}]+)\}/g, (_, key: string) =>
    encodeURIComponent(String(params[key])),
  )
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
    // The template, not the address: a run record never holds a calendar or event id.
    operation: `${operation.binding.method} /${service.servicePath}${operation.binding.path}`,
    response: operation.response?.schema,
  }
}

/** Google Calendar over plain fetch: the token goes in the Authorization header only, never into an address. */
export const googleApi = (options: GoogleApiOptions): GoogleApi => ({
  call: async (name, params = {}, body, { headers = {} } = {}) => {
    const { mutates } = apiMethod(name)
    validateApiParams(params)
    if (body !== undefined && (!body || typeof body !== "object" || Array.isArray(body)))
      throw new CliError("validation_error", "API request body must be a JSON object")
    validateRequest(name, params, body)
    refuseMissingScope(name, options.scopes())
    const request = requestUrl(name, params)
    const token = await options.accessToken()
    const timeout = AbortSignal.timeout(TIMEOUT_MS)
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
    const answered = providerRequest(request.operation, options.events)
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
      answered({ error, errorCode: mutates ? "outcome_unknown" : "provider_unavailable" })
      if (options.signal?.aborted) throw new CliError("cancelled", "the Google Calendar request was stopped")
      if (mutates)
        throw new CliError("outcome_unknown", "Google write has no certain outcome; check Google before repeating it", {
          retryable: false,
        })
      throw new CliError("provider_unavailable", "Google Calendar did not answer; no request details were logged", {
        retryable: true,
      })
    }
    if (!response.ok) {
      answered({ status: response.status, errorCode: "provider_error" })
      const failure = await readJsonResponse(response, { maxBytes: 64 * 1024, signal }).catch(() => undefined)
      throw googleError({
        status: response.status,
        body: failure,
        mutates,
        retryAfterMs: providerWaitMs(response.headers, () => new Date()),
      })
    }
    answered({ status: response.status })
    if (response.status === 204 || response.headers.get("content-length") === "0") return null
    let data: unknown
    try {
      data = await readJsonResponse(response, { maxBytes: MAX_BYTES, signal })
    } catch (error) {
      if (isCliError(error) && error.code !== "invalid_response") throw error
      throw new CliError("invalid_response", "Google Calendar answered with something other than bounded JSON")
    }
    const schema = request.response ? (schemas as Record<string, v.GenericSchema>)[request.response] : undefined
    if (schema && !v.safeParse(schema, data).success)
      throw new CliError("invalid_response", "Google Calendar's answer does not match the API contract")
    return data
  },
})
