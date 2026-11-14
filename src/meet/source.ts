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
import type {
  MeetConferenceRecord,
  MeetParticipant,
  MeetRecording,
  MeetSmartNote,
  MeetTranscript,
  MeetTranscriptEntry,
} from "../generated/meet/types.js"
import { MEET_PROVIDER } from "../store.js"
import { idOf, type MeetApi, ownId } from "./api.js"

export const DAY_MS = 86_400_000
const READY = "FILE_GENERATED"
/** Spaces looked up at once: a page of a hundred calls would otherwise send a hundred requests together. */
const AT_ONCE = 4

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

const nameOf = (participant: MeetParticipant): string | null => {
  const [key] = KINDS.find(([key]) => participant[key] !== undefined) ?? []
  return (key ? participant[key]?.displayName : undefined) ?? null
}

/**
 * A signed-in person is `users/{id}` in every call, so their rows join; a guest or a caller is known only by the name
 * typed in this call, so it never joins a person of another call.
 */
const participantOf = (participant: MeetParticipant): SourceParticipant => {
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

const linesOf = (
  record: MeetConferenceRecord,
  entries: MeetTranscriptEntry[],
  speakers: Map<string, string | null>,
): TranscriptLine[] => {
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
  transcripts: MeetTranscript[],
  recordings: MeetRecording[],
  notes: MeetSmartNote[],
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

/** What one run of the source saw that its answer should say: a rate limit, and the calls with a transcript pending. */
export interface MeetRun {
  limitedBy?: CliError
  pending: Set<string>
}

export type GoogleMeetSource = MeetingSource & { readonly run: MeetRun }

/** `api` is asked for on the first request, so a profile without `--grant meetings` is refused before anything is sent. */
export const googleMeetSource = (api: () => MeetApi): GoogleMeetSource => {
  const run: MeetRun = { pending: new Set() }
  // After Google's first rate limit nothing more is sent: each request would only be refused again.
  const send = async <T>(read: (meet: MeetApi) => Promise<T>): Promise<T> => {
    if (run.limitedBy) throw run.limitedBy
    try {
      return await read(api())
    } catch (error) {
      if (isCliError(error) && error.code === "rate_limited") run.limitedBy ??= error
      throw error
    }
  }
  // pull asks for participants, the transcript and the documents one by one; each is read once per run.
  const reads = new Map<string, Promise<unknown>>()
  const once = <T>(key: string, read: (meet: MeetApi) => Promise<T>): Promise<T> => {
    let found = reads.get(key) as Promise<T> | undefined
    if (!found) {
      found = send(read)
      reads.set(key, found)
    }
    return found
  }
  const space = (name: string | undefined) =>
    name ? once(name, (meet) => orNull(meet.space(ownId("spaces", name)))) : Promise.resolve(null)
  const recordOf = (id: string) => once(`conferenceRecords/${id}`, (meet) => meet.record(id))
  const participants = (id: string) => once(`${id}/participants`, (meet) => meet.participants(id))
  const transcripts = (id: string) => once(`${id}/transcripts`, (meet) => meet.transcripts(id))
  const recordings = (id: string) => once(`${id}/recordings`, (meet) => meet.recordings(id))
  const notes = (id: string) => once(`${id}/notes`, async (meet) => (await orNull(meet.smartNotes(id))) ?? [])

  const meetingOf = async (record: MeetConferenceRecord): Promise<SourceMeeting | undefined> => {
    if (!record.startTime) return undefined
    const id = ownId("conferenceRecords", record.name)
    reads.set(`conferenceRecords/${id}`, Promise.resolve(record))
    const spaceId = record.space ? ownId("spaces", record.space) : null
    const found = await space(record.space)
    const joinUrl = found?.meetingUri ?? null
    return {
      joinUrl,
      metadata: { meeting_code: found?.meetingCode ?? null, expires_at: record.expireTime ?? null },
      series: spaceId
        ? { id: spaceId, provider: MEET_PROVIDER.name, title: null, kind: "space", ...(joinUrl ? { joinUrl } : {}) }
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
  const meetingsOf = async (list: readonly MeetConferenceRecord[]) => {
    const found: SourceMeeting[] = []
    for (let at = 0; at < list.length; at += AT_ONCE)
      for (const one of await Promise.all(list.slice(at, at + AT_ONCE).map(meetingOf))) if (one) found.push(one)
    return found
  }

  /** Every transcript's lines, or none while one is still being made: a part of a call is never kept as all of it. */
  const transcriptOf = async (id: string): Promise<TranscriptLine[] | null> => {
    const all = await transcripts(id)
    if (all.length === 0) return null
    if (!all.every((one) => one.state === READY && one.name)) {
      run.pending.add(id)
      return null
    }
    const [record, people] = await Promise.all([recordOf(id), participants(id)])
    const speakers = new Map(people.flatMap((one) => (one.name ? [[one.name, nameOf(one)] as const] : [])))
    const lines: TranscriptLine[] = []
    for (const transcript of all) {
      const name = ownId(`conferenceRecords/${id}/transcripts`, transcript.name)
      const entries = await send((meet) => meet.entries(id, name))
      for (const line of linesOf(record, entries, speakers)) lines.push(line)
    }
    return lines
  }

  const documents = async (id: string) => {
    const [made, recorded, noted] = await Promise.all([transcripts(id), recordings(id), notes(id)])
    return documentsOf(made, recorded, noted)
  }

  return {
    run,
    provider: MEET_PROVIDER.name,
    name: MEET_PROVIDER.name,
    transcriptFormat: "meet-entries",
    // A transcript and its Doc are made after the call ends, so each sync looks two days behind its cursor.
    overlapMs: 2 * DAY_MS,

    async meetings(since) {
      const all = await send((meet) => meet.allRecords(filterOf({ from: Date.parse(since) })))
      // A call still going on has no end and no transcript yet; the next sync after it ends keeps it.
      return meetingsOf(all.filter((record) => record.endTime !== undefined))
    },
    participants: async (id) => (await participants(id)).map(participantOf),
    /**
     * None for a call with no transcript (a personal account gets none). A transcript still being made fails this
     * read, so the sync keeps the call due and reads it again; Meet deletes it 30 days after the call.
     */
    async transcript(id) {
      const lines = await transcriptOf(id)
      if (run.pending.has(id)) throw notReady()
      return lines
    },
    chat: async () => null,
    summary: async () => null,
    files: async () => null,
    documents,

    finds: { fields: {}, upcoming: false },
    async find(window, _terms, cursor): Promise<FoundMeetings> {
      const page = await send((meet) => meet.records(filterOf(window), cursor ?? undefined))
      return {
        meetings: (await meetingsOf(page.items ?? [])).map((meeting) => ({ meeting })),
        next: page.nextPageToken ?? null,
      }
    },
    async get(given): Promise<FullMeeting | null> {
      const id = idOf("conferenceRecords", given.trim())
      const record = await orNull(recordOf(id))
      const meeting = record ? await meetingOf(record) : undefined
      if (!meeting) return null
      const [people, transcript, files] = await Promise.all([participants(id), transcriptOf(id), documents(id)])
      return { meeting, participants: people.map(participantOf), transcript, documents: files }
    },
  }
}
