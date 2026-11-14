import { readFileSync } from "node:fs"

interface Parameter {
  location: "path" | "query"
  type: string
  required?: boolean
  pattern?: string
}
interface Method {
  httpMethod: string
  flatPath: string
  parameters: Record<string, Parameter>
  request?: string
  response: string
  pageSize?: { default: number; max: number }
}
interface Property {
  type?: string
  $ref?: string
  enum?: string[]
  items?: { type?: string; $ref?: string }
  readOnly?: boolean
}
interface Discovery {
  rootUrl: string
  methods: Record<string, Method>
  schemas: Record<string, { properties: Record<string, Property> }>
}

/** The token the tests' saved sign-ins hold; spelled so gitleaks lets it through, never a real one. */
export const MEET_ACCESS = "fixture-access-token-7Kp2"

/** Meet's own names, from its discovery document; nothing here is typed from memory (WC-TEST-19). */
const DISCOVERY = JSON.parse(readFileSync(new URL("./meet-discovery.json", import.meta.url), "utf8")) as Discovery

/** The fields `conferenceRecords.list` filters by, from its `filter` parameter's description. */
const FILTER_FIELDS = new Set(["space.meeting_code", "space.name", "start_time", "end_time"])

type Json = Record<string, unknown>

export interface Conference {
  record: Json
  participants?: Json[]
  transcripts?: { transcript: Json; entries?: Json[] }[]
  recordings?: Json[]
  smartNotes?: Json[]
}

export interface FakeMeetOptions {
  conferences?: Conference[]
  spaces?: Json[]
  /** Spaces this account may not read: `spaces.get` answers 403, as for a meeting someone else owns. */
  hiddenSpaces?: string[]
  /** Answers `spaces.create` with these names, in order; seeded `spaces` were not created by this app. */
  newSpaces?: string[]
  /** Every Meet request, or each one whose path matches, answers this status with Google's error body. */
  failWith?: { status: number; body: Json; headers?: Record<string, string>; path?: RegExp }
  /** The access tokens Meet takes; any other answers 401. */
  tokens?: string[]
}

export interface Call {
  method: string
  path: string
  query: Record<string, string>
  authorization: string | null
  body?: unknown
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } })

/** Google's error body: https://cloud.google.com/apis/design/errors#http_mapping */
export const googleFailure = (code: number, status: string, message: string, details: Json[] = []) => ({
  error: { code, message, status, ...(details.length > 0 ? { details } : {}) },
})

/**
 * What is wrong with `value` as Meet's `schema`, or undefined. A request body also may not set an output-only field;
 * Google ignores one (https://google.aip.dev/203), so refusing it is stricter than Google, and catches a field gcal
 * means to set but cannot.
 */
const shapeProblem = (schema: string, value: unknown, where: string, request = false): string | undefined => {
  const properties = DISCOVERY.schemas[schema]?.properties
  if (!properties) return `meet-discovery.json has no schema ${schema}`
  if (typeof value !== "object" || value === null || Array.isArray(value)) return `${where} is not an object`
  for (const [key, child] of Object.entries(value as Json)) {
    const property = properties[key]
    if (!property) return `${where}.${key} is not a field of Meet's ${schema}`
    if (request && property.readOnly) return `${where}.${key} is output only in Meet's ${schema}`
    const kind = property.$ref ? "object" : property.type === "array" ? "array" : property.type
    const actual = Array.isArray(child) ? "array" : typeof child === "number" ? "integer" : typeof child
    if (kind && kind !== actual) return `${where}.${key} is a ${actual}; Meet's ${schema}.${key} is a ${kind}`
    if (property.enum && !property.enum.includes(String(child)))
      return `${where}.${key} = ${String(child)} is not one of Meet's ${schema}.${key} values`
    if (property.$ref) {
      const problem = shapeProblem(property.$ref, child, `${where}.${key}`, request)
      if (problem) return problem
    }
  }
  return undefined
}

/** Throws at setup when a seeded answer holds a field Meet's schema does not: the fake answers only real names. */
const checkShape = (schema: string, value: unknown, where: string): void => {
  const problem = shapeProblem(schema, value, where)
  if (problem) throw new Error(problem)
}

/** Whether `path` (`config.accessType`) names a field of `schema`, through its nested messages. */
const isFieldPath = (schema: string, path: string[]): boolean => {
  const [head, ...rest] = path
  const property = head === undefined ? undefined : DISCOVERY.schemas[schema]?.properties[head]
  if (!property) return false
  if (rest.length === 0) return true
  return property.$ref !== undefined && isFieldPath(property.$ref, rest)
}

const valueAt = (value: Json, path: string[]): unknown =>
  path.reduce<unknown>((at, key) => (at && typeof at === "object" ? (at as Json)[key] : undefined), value)

/** Sets, or with `undefined` clears, the field at `path`, as a field mask does (https://google.aip.dev/134). */
const setAt = (target: Json, path: string[], value: unknown): void => {
  const [head, ...rest] = path
  if (head === undefined) return
  if (rest.length === 0) {
    if (value === undefined) delete target[head]
    else target[head] = value
    return
  }
  if (typeof target[head] !== "object" || target[head] === null) target[head] = {}
  setAt(target[head] as Json, rest, value)
}

const routes = Object.entries(DISCOVERY.methods).map(([id, method]) => ({
  id,
  method,
  pattern: new RegExp(`^/${method.flatPath.replace(/\{[^}]+\}/g, "([^/]+)")}$`),
}))

/** One `field op "value"` or `field IS NULL` term of the list's EBNF filter, or a refusal. */
const termOf = (term: string) => {
  const isNull = /^([a-z_.]+)\s+IS\s+NULL$/.exec(term)
  if (isNull) return { field: isNull[1] as string, op: "IS NULL", value: "" }
  const compared = /^([a-z_.]+)\s*(>=|<=|!=|=|<|>)\s*"([^"]*)"$/.exec(term)
  if (!compared) return undefined
  return { field: compared[1] as string, op: compared[2] as string, value: compared[3] as string }
}

const compare = (left: string | undefined, op: string, right: string) => {
  if (op === "IS NULL") return left === undefined
  if (left === undefined) return false
  const [a, b] = left.includes("T") ? [Date.parse(left), Date.parse(right)] : [left, right]
  return op === "="
    ? a === b
    : op === "!="
      ? a !== b
      : op === "<"
        ? a < b
        : op === "<="
          ? a <= b
          : op === ">"
            ? a > b
            : a >= b
}

/**
 * Meet's API as its discovery document describes it. It refuses an unknown path or query parameter, a filter on a
 * field the list does not filter by, a page token used with another filter, and a request body with a field Meet's
 * schema does not have, each with Google's error body; a `pageSize` past the maximum is coerced, as the parameter's
 * description says. It changes only the spaces it created itself, as `meetings.space.created` allows.
 */
export const fakeMeet = ({
  conferences = [],
  spaces = [],
  hiddenSpaces = [],
  newSpaces = ["spaces/created-1", "spaces/created-2"],
  failWith,
  tokens = [MEET_ACCESS],
}: FakeMeetOptions = {}) => {
  for (const one of conferences) {
    checkShape("ConferenceRecord", one.record, "record")
    for (const participant of one.participants ?? []) checkShape("Participant", participant, "participant")
    for (const { transcript, entries = [] } of one.transcripts ?? []) {
      checkShape("Transcript", transcript, "transcript")
      for (const entry of entries) checkShape("TranscriptEntry", entry, "entry")
    }
    for (const recording of one.recordings ?? []) checkShape("Recording", recording, "recording")
    for (const note of one.smartNotes ?? []) checkShape("SmartNote", note, "smartNote")
  }
  for (const space of spaces) checkShape("Space", space, "space")

  const calls: Call[] = []
  const refusals: string[] = []
  const refuse = (why: string, response: Response) => {
    refusals.push(why)
    return response
  }
  const invalid = (why: string) => refuse(why, json(googleFailure(400, "INVALID_ARGUMENT", why), 400))
  const notFound = () => json(googleFailure(404, "NOT_FOUND", "Requested entity was not found."), 404)

  const conference = (id: string) => conferences.find((one) => one.record.name === `conferenceRecords/${id}`)
  /** The spaces this app made: only these may it change under meetings.space.created. */
  const created: Json[] = []
  const codes = ["abc-mnop-xyz", "def-qrst-uvw"]

  const createSpace = (body: Json) => {
    const name = newSpaces[created.length]
    if (!name) return refuse("the test gave no more names for new spaces", notFound())
    const code = codes[created.length] ?? `ghi-jklm-${"n".repeat(created.length)}`
    const space = {
      name,
      meetingUri: `https://meet.google.com/${code}`,
      meetingCode: code,
      config: { entryPointAccess: "ALL", ...((body.config as Json | undefined) ?? {}) },
    }
    created.push(space)
    return json(space)
  }

  /**
   * Google leaves `updateMask` optional and then updates every field the body sets; this fake refuses a patch without
   * one, or with `*`, which clears every field left out: stricter than Google, so gcal always names its fields.
   */
  const patchSpace = (id: string, body: Json, query: URLSearchParams) => {
    const mask = query.get("updateMask")
    if (!mask || mask.split(",").includes("*")) return invalid("gcal names the fields a patch changes in updateMask")
    const paths = mask.split(",").map((path) => path.trim().split("."))
    // Inferred, not documented: Google is expected to refuse a mask path that names no field of Space.
    const unknown = paths.find((path) => !isFieldPath("Space", path))
    if (unknown) return invalid(`updateMask names no field of Space: ${unknown.join(".")}`)
    const space = created.find((one) => one.name === `spaces/${id}`)
    if (!space) {
      // Google's docs do not say whether another app's space answers 403 or 404; the fake answers 403 for a space it
      // knows and 404 for one it does not.
      if (spaces.some((one) => one.name === `spaces/${id}`))
        return json(googleFailure(403, "PERMISSION_DENIED", "The caller does not have permission"), 403)
      return notFound()
    }
    for (const path of paths) setAt(space, path, valueAt(body, path))
    return json(space)
  }

  /**
   * A page of `items` under `key`. The token names where the next page starts and the filter it was made for: AIP-158
   * says the other request fields must match the call that made the token (https://google.aip.dev/158).
   */
  const paged = (key: string, items: Json[], method: Method, query: URLSearchParams, filter = "") => {
    const asked = Number(query.get("pageSize") ?? 0)
    if (asked < 0) return invalid("pageSize must not be negative (https://google.aip.dev/158)")
    const size = asked > 0 ? Math.min(asked, method.pageSize?.max ?? asked) : (method.pageSize?.default ?? 10)
    let start = 0
    const token = query.get("pageToken")
    if (token) {
      const [at, made] = Buffer.from(token, "base64url").toString().split("\n")
      if (made !== filter || !/^\d+$/.test(at ?? "")) return invalid("page token does not match the request")
      start = Number(at)
    }
    const end = start + size
    return json({
      [key]: items.slice(start, end),
      ...(end < items.length ? { nextPageToken: Buffer.from(`${end}\n${filter}`).toString("base64url") } : {}),
    })
  }

  const listRecords = (method: Method, query: URLSearchParams) => {
    const filter = query.get("filter") ?? ""
    const terms = filter === "" ? [] : filter.split(" AND ").map((term) => termOf(term.trim()))
    for (const term of terms) {
      if (!term) return invalid(`filter is not in Meet's EBNF form: ${filter}`)
      if (!FILTER_FIELDS.has(term.field)) return invalid(`conferenceRecords.list cannot filter by ${term.field}`)
    }
    const fieldOf = (record: Json, field: string) => {
      if (field === "start_time") return record.startTime as string | undefined
      if (field === "end_time") return record.endTime as string | undefined
      if (field === "space.name") return record.space as string | undefined
      const space = spaces.find((one) => one.name === record.space)
      return space?.meetingCode as string | undefined
    }
    const records = conferences
      .map((one) => one.record)
      .filter((record) => terms.every((term) => term && compare(fieldOf(record, term.field), term.op, term.value)))
      .sort((a, b) => Date.parse(String(b.startTime)) - Date.parse(String(a.startTime)))
    return paged("conferenceRecords", records, method, query, filter)
  }

  const answer = (id: string, method: Method, ids: string[], query: URLSearchParams, body: Json): Response => {
    const [recordId = "", childId = ""] = ids
    const found = conference(recordId)
    switch (id) {
      case "conferenceRecords.list":
        return listRecords(method, query)
      case "conferenceRecords.get":
        return found ? json(found.record) : notFound()
      case "spaces.get": {
        const name = `spaces/${recordId}`
        if (hiddenSpaces.includes(name))
          return json(googleFailure(403, "PERMISSION_DENIED", "The caller does not have permission"), 403)
        const space = [...created, ...spaces].find((one) => one.name === name || one.meetingCode === recordId)
        return space ? json(space) : notFound()
      }
      case "spaces.create":
        return createSpace(body)
      case "spaces.patch":
        return patchSpace(recordId, body, query)
      case "conferenceRecords.participants.list":
        return found ? paged("participants", found.participants ?? [], method, query) : notFound()
      case "conferenceRecords.transcripts.list":
        return found
          ? paged(
              "transcripts",
              (found.transcripts ?? []).map((one) => one.transcript),
              method,
              query,
            )
          : notFound()
      case "conferenceRecords.transcripts.entries.list": {
        const transcript = found?.transcripts?.find(
          (one) => one.transcript.name === `conferenceRecords/${recordId}/transcripts/${childId}`,
        )
        return transcript ? paged("transcriptEntries", transcript.entries ?? [], method, query) : notFound()
      }
      case "conferenceRecords.recordings.list":
        return found ? paged("recordings", found.recordings ?? [], method, query) : notFound()
      case "conferenceRecords.smartNotes.list":
        return found ? paged("smartNotes", found.smartNotes ?? [], method, query) : notFound()
      default:
        return refuse(`the fake does not answer ${id}`, notFound())
    }
  }

  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(String(input instanceof Request ? input.url : input))
    const authorization = new Headers(init?.headers).get("authorization")
    let body: unknown
    try {
      body = init?.body === undefined || init.body === null ? undefined : JSON.parse(String(init.body))
    } catch {
      body = Symbol("not JSON")
    }
    calls.push({
      method: init?.method ?? "GET",
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      authorization,
      ...(body === undefined ? {} : { body }),
    })
    if (`${url.origin}/` !== DISCOVERY.rootUrl) return refuse(`not Meet's host: ${url.origin}`, notFound())
    if (!tokens.some((token) => authorization === `Bearer ${token}`))
      return json(googleFailure(401, "UNAUTHENTICATED", "Request had invalid authentication credentials."), 401)
    if (failWith && (!failWith.path || failWith.path.test(url.pathname)))
      return json(failWith.body, failWith.status, failWith.headers)
    const route = routes.find(
      (one) => one.pattern.test(url.pathname) && one.method.httpMethod === (init?.method ?? "GET"),
    )
    if (!route) return refuse(`no Meet method at ${init?.method ?? "GET"} ${url.pathname}`, notFound())
    const ids = (route.pattern.exec(url.pathname) ?? []).slice(1).map(decodeURIComponent)
    for (const key of url.searchParams.keys()) {
      const parameter = route.method.parameters[key]
      if (parameter?.location !== "query") return invalid(`Unknown name "${key}": Cannot bind query parameter.`)
      if (parameter.type === "integer" && !/^-?\d+$/.test(url.searchParams.get(key) ?? ""))
        return invalid(`Invalid value at '${key}' (TYPE_INT32)`)
    }
    if (route.method.request) {
      if (typeof body === "symbol") return invalid("Invalid JSON payload received.")
      if (new Headers(init?.headers).get("content-type") !== "application/json")
        return invalid("a request body must be sent as application/json")
      const problem = shapeProblem(route.method.request, body ?? {}, "body", true)
      if (problem) return invalid(`Invalid JSON payload received. ${problem}`)
    } else if (body !== undefined) return invalid(`${route.id} takes no request body`)
    return answer(route.id, route.method, ids, url.searchParams, (body as Json | undefined) ?? {})
  }

  return { fetch, calls, refusals }
}
