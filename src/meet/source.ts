import { CliError, isCliError } from "@wirecat/cli-base"
import type {
  FoundMeetings,
  FullMeeting,
  MeetingDocumentInput,
  MeetingSource,
  MeetingWindow,
  SourceMeeting,
  SourceParticipant,
  TranscriptLine,
} from "@wirecat/cli-core/meetings"
import {
  idOf,
  LARGEST_PAGE,
  type MeetApi,
  ownId,
  type WireEntry,
  type WireParticipant,
  type WireRecord,
  type WireRecording,
  type WireSpace,
  type WireTranscript,
} from "./api.js"

export const MEET_PROVIDER_NAME = "google-meet"
const DAY_MS = 86_400_000
const READY = "FILE_GENERATED"

/**
 * A part of a call this account may not read is left out: a space someone else owns, Gemini notes the account has
 * no plan for. A missing scope, a turned-off API, a rate limit or a failure at Google still fails the read.
 */
const unreadable = (error: unknown): boolean =>
  isCliError(error) &&
  (error.code === "not_found" || (error.code === "permission_error" && error.details.reason === "access.denied"))

const orNull = <T>(read: Promise<T>): Promise<T | null> =>
  read.catch((error: unknown) => {
    if (unreadable(error)) return null
    throw error
  })

/**
 * Meet's filter takes RFC 3339 times in double quotes: https://developers.google.com/workspace/meet/api/guides/conferences.
 * Both ends of cli-core's window are inclusive, as `>=` and `<=` are.
 */
export const filterOf = ({ from, to }: MeetingWindow): string | undefined => {
  const terms = [
    ...(from === undefined ? [] : [`start_time>="${new Date(from).toISOString()}"`]),
    ...(to === undefined ? [] : [`start_time<="${new Date(to).toISOString()}"`]),
  ]
  return terms.length > 0 ? terms.join(" AND ") : undefined
}

const msOf = (at: string | undefined): number | null => {
  const ms = at === undefined ? Number.NaN : Date.parse(at)
  return Number.isFinite(ms) ? ms : null
}

const KINDS = [
  ["signedinUser", "signed_in"],
  ["anonymousUser", "anonymous"],
  ["phoneUser", "phone"],
] as const

const nameOf = (participant: WireParticipant): string | null => {
  const [key] = KINDS.find(([key]) => participant[key] !== undefined) ?? []
  return (key ? participant[key]?.displayName : undefined) ?? null
}

/**
 * A signed-in person is `users/{id}` in every call, so their rows join; a guest or a caller is known only by the name
 * typed in this call, so it never joins a person of another call.
 */
const participantOf = (participant: WireParticipant): SourceParticipant => {
  const [, kind] = KINDS.find(([key]) => participant[key] !== undefined) ?? [undefined, "unknown"]
  const user = participant.signedinUser?.user
  const joinedAt = msOf(participant.earliestStartTime)
  const leftAt = msOf(participant.latestEndTime)
  return {
    identityExternalId: user ?? null,
    email: null,
    displayName: nameOf(participant),
    externalId: user ? (participant.name ?? null) : null,
    role: null,
    joinedAt,
    leftAt,
    durationMs: joinedAt !== null && leftAt !== null ? leftAt - joinedAt : null,
    sessions: null,
    metadata: { kind },
  }
}

const linesOf = (record: WireRecord, entries: WireEntry[], speakers: Map<string, string | null>): TranscriptLine[] => {
  const start = msOf(record.startTime) ?? 0
  return entries.flatMap((entry) => {
    const from = msOf(entry.startTime)
    if (!entry.text || from === null) return []
    const to = msOf(entry.endTime) ?? from
    return [
      {
        startMs: Math.max(0, from - start),
        endMs: Math.max(0, to - start),
        speaker: (entry.participant ? speakers.get(entry.participant) : undefined) ?? null,
        text: entry.text,
      },
    ]
  })
}

const documentsOf = (
  transcripts: WireTranscript[],
  recordings: WireRecording[],
  notes: WireTranscript[],
): MeetingDocumentInput[] => [
  ...transcripts.flatMap((one) =>
    one.docsDestination?.document ? [{ fileId: one.docsDestination.document, role: "transcript" as const }] : [],
  ),
  ...recordings.flatMap((one) =>
    one.driveDestination?.file ? [{ fileId: one.driveDestination.file, role: "recording" as const }] : [],
  ),
  ...notes.flatMap((one) =>
    one.docsDestination?.document ? [{ fileId: one.docsDestination.document, role: "notes" as const }] : [],
  ),
]

const notReady = () =>
  new CliError("provider_error", "Google Meet has not finished the transcript yet; the next sync reads it again", {
    retryable: true,
  })

/**
 * Google Meet's conference records as a meetings source. One record is one call in a meeting space: the space is the
 * series, the space's link gives the `meet:<code>` join key that ties the call to its calendar entry, and the record's
 * id is the occurrence's id in sync, list and show alike. Meet gives a call no title; the calendar entry carries it.
 *
 * `api` is asked for on the first request, so a profile without `--grant meetings` is refused before anything is sent.
 */
export const googleMeetSource = (api: () => MeetApi): MeetingSource => {
  const spaces = new Map<string, Promise<WireSpace | null>>()
  const space = (name: string | undefined): Promise<WireSpace | null> => {
    if (!name) return Promise.resolve(null)
    let found = spaces.get(name)
    if (!found) {
      found = orNull(api().space(ownId("spaces", name)))
      spaces.set(name, found)
    }
    return found
  }

  // pull asks for participants, the transcript and the documents one by one; each list is read once per run.
  const reads = new Map<string, Map<string, Promise<unknown>>>()
  const once = <T>(record: string, part: string, read: () => Promise<T>): Promise<T> => {
    const parts = reads.get(record) ?? new Map<string, Promise<unknown>>()
    reads.set(record, parts)
    let found = parts.get(part) as Promise<T> | undefined
    if (!found) {
      found = read()
      parts.set(part, found)
    }
    return found
  }
  const records = new Map<string, WireRecord>()
  const recordOf = async (id: string) => {
    const known = records.get(id)
    if (known) return known
    const record = await api().record(id)
    records.set(id, record)
    return record
  }
  const participants = (id: string) => once(id, "participants", () => api().participants(id))
  const transcripts = (id: string) => once(id, "transcripts", () => api().transcripts(id))
  const recordings = (id: string) => once(id, "recordings", () => api().recordings(id))
  const notes = (id: string) => once(id, "notes", async () => (await orNull(api().smartNotes(id))) ?? [])

  const meetingOf = async (record: WireRecord): Promise<SourceMeeting | undefined> => {
    if (!record.startTime) return undefined
    const id = ownId("conferenceRecords", record.name)
    records.set(id, record)
    const spaceId = record.space ? ownId("spaces", record.space) : null
    const found = await space(record.space)
    const joinUrl = found?.meetingUri ?? null
    return {
      joinUrl,
      metadata: { meeting_code: found?.meetingCode ?? null, expires_at: record.expireTime ?? null },
      series: spaceId
        ? { id: spaceId, provider: MEET_PROVIDER_NAME, title: null, kind: "space", ...(joinUrl ? { joinUrl } : {}) }
        : null,
      occurrence: {
        id,
        seriesId: spaceId ?? id,
        title: null,
        startedAt: record.startTime,
        endedAt: record.endTime ?? null,
      },
    }
  }
  const meetingsOf = async (list: readonly WireRecord[]) =>
    (await Promise.all(list.map(meetingOf))).filter((one): one is SourceMeeting => one !== undefined)

  /** The transcript lines of every finished transcript; `ready` false when one is still being made. */
  const transcriptOf = async (id: string) => {
    const all = await transcripts(id)
    if (all.length === 0) return { lines: null, ready: true }
    const [record, people] = await Promise.all([recordOf(id), participants(id)])
    const speakers = new Map(people.flatMap((one) => (one.name ? [[one.name, nameOf(one)] as const] : [])))
    const lines: TranscriptLine[] = []
    for (const transcript of all) {
      if (transcript.state !== READY || !transcript.name) continue
      const entries = await api().entries(id, ownId(`conferenceRecords/${id}/transcripts`, transcript.name))
      for (const line of linesOf(record, entries, speakers)) lines.push(line)
    }
    return { lines, ready: all.every((one) => one.state === READY) }
  }

  const documents = async (id: string) => {
    const [made, recorded, noted] = await Promise.all([transcripts(id), recordings(id), notes(id)])
    return documentsOf(made, recorded, noted)
  }

  return {
    provider: MEET_PROVIDER_NAME,
    name: "google-meet",
    transcriptFormat: "meet-entries",
    // A transcript and its Doc are made after the call ends, so each sync looks two days behind its cursor.
    overlapMs: 2 * DAY_MS,

    async meetings(since) {
      const found: WireRecord[] = []
      let pageToken: string | undefined
      const seen = new Set<string>()
      do {
        const page = await api().records({
          filter: filterOf({ from: Date.parse(since) }),
          pageSize: LARGEST_PAGE,
          pageToken,
        })
        // A call still going on has no end and no transcript yet; the next sync after it ends keeps it.
        for (const record of page.items ?? []) if (record.endTime !== undefined) found.push(record)
        pageToken = page.nextPageToken ?? undefined
        if (pageToken && seen.has(pageToken))
          throw new CliError("invalid_response", "Google Meet sent the same page of calls twice")
        if (pageToken) seen.add(pageToken)
      } while (pageToken)
      return meetingsOf(found)
    },
    participants: async (id) => (await participants(id)).map(participantOf),
    /**
     * None for a call with no transcript (a personal account gets none). A transcript still being made fails this
     * read, so the sync keeps the call due and reads it again; Meet deletes it 30 days after the call.
     */
    async transcript(id) {
      const { lines, ready } = await transcriptOf(id)
      if (!ready) throw notReady()
      return lines
    },
    chat: async () => null,
    summary: async () => null,
    files: async () => null,
    documents,

    finds: { fields: {}, upcoming: false },
    async find(window, _terms, cursor): Promise<FoundMeetings> {
      const page = await api().records({
        filter: filterOf(window),
        pageSize: LARGEST_PAGE,
        pageToken: cursor ?? undefined,
      })
      return {
        meetings: (await meetingsOf(page.items ?? [])).map((meeting) => ({ meeting })),
        next: page.nextPageToken ?? null,
      }
    },
    /** By the record's id or `conferenceRecords/<id>`; a call this account never joined is none. */
    async get(given): Promise<FullMeeting | null> {
      const id = idOf("conferenceRecords", given.trim())
      const record = await orNull(recordOf(id))
      const meeting = record ? await meetingOf(record) : undefined
      if (!meeting) return null
      const [people, transcript, files] = await Promise.all([participants(id), transcriptOf(id), documents(id)])
      return { meeting, participants: people.map(participantOf), transcript: transcript.lines, documents: files }
    },
  }
}
