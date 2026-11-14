import { CliError, isCliError, wallClock } from "@wirecat/cli-base"
import { providerWaitMs, readJsonResponse } from "@wirecat/cli-base/http"
import { type EventSink, providerRequest } from "@wirecat/cli-core/cli"
import { type GooglePage, googleError, googlePages } from "@wirecat/cli-core/google"
import * as v from "valibot"

// Every path, parameter and field name below is from Meet's discovery document, revision 20261110
// (https://meet.googleapis.com/$discovery/rest?version=v2); src/testing/meet-discovery.json keeps its names.
const ROOT = "https://meet.googleapis.com/"
export const SERVICE = "Google Meet"
/**
 * The largest page of conference records, transcripts, entries, recordings and smart notes; participants allow 250.
 * Past it the service coerces, as each pageSize description in the discovery document says.
 */
export const LARGEST_PAGE = 100

const LARGEST_ANSWER = 16 * 1024 * 1024

const destination = v.object({ document: v.optional(v.string()) })
const person = v.object({ displayName: v.optional(v.string()) })

export const wireRecord = v.object({
  name: v.string(),
  startTime: v.optional(v.string()),
  endTime: v.optional(v.string()),
  expireTime: v.optional(v.string()),
  space: v.optional(v.string()),
})
// Strings, not Meet's enums: a value Google adds later must not fail the answer.
const autoGeneration = v.optional(v.string())
export const wireSpaceConfig = v.object({
  accessType: v.optional(v.string()),
  entryPointAccess: v.optional(v.string()),
  moderation: v.optional(v.string()),
  artifactConfig: v.optional(
    v.object({
      recordingConfig: v.optional(v.object({ autoRecordingGeneration: autoGeneration })),
      transcriptionConfig: v.optional(v.object({ autoTranscriptionGeneration: autoGeneration })),
      smartNotesConfig: v.optional(v.object({ autoSmartNotesGeneration: autoGeneration })),
    }),
  ),
})
export const wireSpace = v.object({
  name: v.optional(v.string()),
  meetingUri: v.optional(v.string()),
  meetingCode: v.optional(v.string()),
  config: v.optional(wireSpaceConfig),
})
export const wireParticipant = v.object({
  name: v.optional(v.string()),
  earliestStartTime: v.optional(v.string()),
  latestEndTime: v.optional(v.string()),
  signedinUser: v.optional(v.object({ user: v.optional(v.string()), displayName: v.optional(v.string()) })),
  anonymousUser: v.optional(person),
  phoneUser: v.optional(person),
})
const artifact = {
  name: v.optional(v.string()),
  state: v.optional(v.string()),
  startTime: v.optional(v.string()),
  endTime: v.optional(v.string()),
}
export const wireTranscript = v.object({ ...artifact, docsDestination: v.optional(destination) })
export const wireSmartNote = wireTranscript
export const wireRecording = v.object({
  ...artifact,
  driveDestination: v.optional(v.object({ file: v.optional(v.string()) })),
})
export const wireEntry = v.object({
  name: v.optional(v.string()),
  participant: v.optional(v.string()),
  text: v.optional(v.string()),
  languageCode: v.optional(v.string()),
  startTime: v.optional(v.string()),
  endTime: v.optional(v.string()),
})

export type WireRecord = v.InferOutput<typeof wireRecord>
export type WireSpace = v.InferOutput<typeof wireSpace>
export type WireSpaceConfig = v.InferOutput<typeof wireSpaceConfig>
export type WireParticipant = v.InferOutput<typeof wireParticipant>
export type WireTranscript = v.InferOutput<typeof wireTranscript>
export type WireRecording = v.InferOutput<typeof wireRecording>
export type WireEntry = v.InferOutput<typeof wireEntry>

const pageOf = <T>(key: string, item: v.GenericSchema<unknown, T>) =>
  v.pipe(
    v.object({ [key]: v.optional(v.array(item)), nextPageToken: v.optional(v.string()) }),
    v.transform((page): GooglePage<T> => {
      const { [key]: items, nextPageToken } = page as Record<string, unknown>
      return { items: (items as T[] | undefined) ?? [], nextPageToken: (nextPageToken as string | undefined) ?? null }
    }),
  )

/** A resource name's own id: `new URL` folds a `.` or `..` segment, and a `/` would reach another method. */
const segment = (what: string, value: string): string => {
  if (value === "" || value === "." || value === ".." || /[/?#\\\s]/.test(value))
    throw new CliError("validation_error", `${what} must be one id, with no "/", "?", "#" or space`, {
      reason: "api.bad-path-id",
      sent: false,
    })
  return encodeURIComponent(value)
}

export const idOf = (prefix: string, name: string): string =>
  name.startsWith(`${prefix}/`) ? name.slice(prefix.length + 1) : name

/** A resource name Google sent: any other shape is Google's fault, not the caller's. */
export const ownId = (prefix: string, name: string): string => {
  const id = name.startsWith(`${prefix}/`) ? name.slice(prefix.length + 1) : ""
  if (id === "" || id === "." || id === ".." || /[/?#\\\s]/.test(id))
    throw new CliError("invalid_response", `${SERVICE} sent a ${prefix} name in a shape it does not document`)
  return id
}

export interface MeetApiOptions {
  /** cli-base's hostFetch: it holds the host list and the 30 s deadline, and names its own failures. */
  fetch: typeof fetch
  accessToken: () => Promise<string>
  signal?: AbortSignal | undefined
  events?: EventSink | undefined
}

interface Request {
  method?: "GET" | "POST" | "PATCH"
  /** The method's path with its ids as `{name}`: the run record keeps this, never a meeting's id. */
  template: string
  ids?: Record<string, string>
  query?: Record<string, string | number | undefined>
  body?: Record<string, unknown>
}

const unknownOutcome = () =>
  new CliError("outcome_unknown", `${SERVICE} did not answer a write; check it before repeating the write`, {
    retryable: false,
  })

/** Google Meet over plain fetch: the token in the Authorization header only, nothing retried. */
export const meetApi = (options: MeetApiOptions) => {
  const { signal } = options
  const read = signal ? { signal } : {}

  const send = async <T>(
    { method = "GET", template, ids = {}, query = {}, body }: Request,
    answer: v.GenericSchema<unknown, T>,
  ): Promise<T> => {
    const mutates = method !== "GET"
    const url = new URL(
      template.replace(/\{(\w+)\}/g, (_, name: string) => segment(name, ids[name] ?? "")),
      ROOT,
    )
    for (const [key, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(key, String(value))
    const token = await options.accessToken()
    const answered = providerRequest(`${method} /${template}`, options.events, { method, transport: "http" })
    let response: Response
    try {
      response = await options.fetch(url, {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/json",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        // A redirect would carry the token to an address we did not choose.
        redirect: "error",
        ...read,
      })
    } catch (error) {
      // A cut write may have reached Google, and a caller told "cancelled" would send it again (WC-LIFE-9).
      const failure = mutates
        ? unknownOutcome()
        : isCliError(error)
          ? error
          : signal?.aborted
            ? new CliError("cancelled", `the ${SERVICE} request was stopped`)
            : new CliError("provider_unavailable", `${SERVICE} could not be reached`, { retryable: true })
      answered({ error, errorCode: failure.code })
      throw failure
    }
    if (!response.ok) {
      const failed = await readJsonResponse(response, { maxBytes: 64 * 1024, ...read }).catch(() => undefined)
      const failure = googleError({
        status: response.status,
        body: failed,
        mutates,
        retryAfterMs: providerWaitMs(response.headers, wallClock),
        service: SERVICE,
      })
      answered({ status: response.status, errorCode: failure.code })
      throw failure
    }
    let data: unknown
    try {
      data = await readJsonResponse(response, { maxBytes: LARGEST_ANSWER, ...read })
    } catch (error) {
      const failure =
        mutates && signal?.aborted
          ? unknownOutcome()
          : isCliError(error) && error.code !== "invalid_response"
            ? error
            : new CliError("invalid_response", `${SERVICE} answered with something other than bounded JSON`)
      answered({ status: response.status, errorCode: failure.code })
      throw failure
    }
    const parsed = v.safeParse(answer, data)
    if (!parsed.success) {
      answered({ status: response.status, errorCode: "invalid_response" })
      throw new CliError("invalid_response", `${SERVICE}'s answer does not have the documented shape`)
    }
    answered({ status: response.status })
    return parsed.output
  }
  const get = <T>(request: Omit<Request, "method" | "body">, answer: v.GenericSchema<unknown, T>) =>
    send(request, answer)

  const all = <T>(
    what: string,
    template: string,
    ids: Record<string, string>,
    key: string,
    item: v.GenericSchema<unknown, T>,
  ) => {
    const page = pageOf(key, item)
    return googlePages<T>(what, (pageToken) =>
      get({ template, ids, query: { pageSize: LARGEST_PAGE, pageToken } }, page),
    )
  }

  const records = pageOf("conferenceRecords", wireRecord)

  return {
    /** conferenceRecords.list: newest first, only meetings this account organized. */
    records: (query: { filter?: string | undefined; pageSize: number; pageToken?: string | undefined }) =>
      get({ template: "v2/conferenceRecords", query }, records),
    /** conferenceRecords.get */
    record: (id: string) => get({ template: "v2/conferenceRecords/{record}", ids: { record: id } }, wireRecord),
    /** spaces.get */
    space: (id: string) => get({ template: "v2/spaces/{space}", ids: { space: id } }, wireSpace),
    /** spaces.create: a new meeting space, with Google's defaults for every setting left out. */
    createSpace: (config: WireSpaceConfig) =>
      send({ method: "POST", template: "v2/spaces", body: { config } }, wireSpace),
    /** spaces.patch: only the fields `paths` names change; never `*`, which clears every field left out. */
    patchSpace: (id: string, config: WireSpaceConfig, paths: readonly string[]) =>
      send(
        {
          method: "PATCH",
          template: "v2/spaces/{space}",
          ids: { space: id },
          query: { updateMask: paths.join(",") },
          body: { config },
        },
        wireSpace,
      ),
    participants: (record: string) =>
      all("participants", "v2/conferenceRecords/{record}/participants", { record }, "participants", wireParticipant),
    transcripts: (record: string) =>
      all("transcripts", "v2/conferenceRecords/{record}/transcripts", { record }, "transcripts", wireTranscript),
    recordings: (record: string) =>
      all("recordings", "v2/conferenceRecords/{record}/recordings", { record }, "recordings", wireRecording),
    smartNotes: (record: string) =>
      all("smart notes", "v2/conferenceRecords/{record}/smartNotes", { record }, "smartNotes", wireSmartNote),
    entries: (record: string, transcript: string) =>
      all(
        "transcript entries",
        "v2/conferenceRecords/{record}/transcripts/{transcript}/entries",
        { record, transcript },
        "transcriptEntries",
        wireEntry,
      ),
  }
}

export type MeetApi = ReturnType<typeof meetApi>
