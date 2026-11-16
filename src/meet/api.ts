import { type GooglePage, googlePages } from "@wirecat/cli-core/google"
import type * as v from "valibot"
import type { ApiContract } from "../api-contract.js"
import { operations } from "../generated/meet/manifest.js"
import { metadata } from "../generated/meet/metadata.js"
import * as schema from "../generated/meet/schemas.js"
import type {
  MeetConferenceRecord,
  MeetParticipant,
  MeetRecording,
  MeetSmartNote,
  MeetSpaceConfig,
  MeetTranscript,
  MeetTranscriptEntry,
} from "../generated/meet/types.js"
import { answerOf, type GoogleApi } from "../google-api.js"

export const MEET: ApiContract = {
  name: "Google Meet",
  operations,
  schemas: schema.schemas,
  services: metadata.services,
  scopes: metadata.scopes,
}

/**
 * The largest page of conference records, transcripts, entries, recordings and smart notes; participants allow 250.
 * Past it the service coerces, as each pageSize description in the discovery document says.
 */
const LARGEST_PAGE = 100

type Listed = { nextPageToken?: string } & Record<string, unknown>

/** Google Meet's methods over gcal's Google transport, which checks each answer against its generated schema. */
export const meetApi = (api: GoogleApi) => {
  const one = async <T>(method: string, params: Record<string, unknown>, answer: v.GenericSchema<unknown, T>) =>
    answerOf(answer, await api.call(`meet.${method}`, params), MEET)
  const page = async <T>(method: string, params: Record<string, unknown>, key: string): Promise<GooglePage<T>> => {
    const listed = (await api.call(`meet.${method}`, { ...params, pageSize: LARGEST_PAGE })) as Listed
    return { items: listed[key] as T[] | undefined, nextPageToken: listed.nextPageToken ?? null }
  }
  const all = <T>(what: string, method: string, params: Record<string, unknown>, key: string) =>
    googlePages<T>(what, (pageToken) => page<T>(method, { ...params, pageToken }, key))

  return {
    /** Newest first, and only calls this account organized. */
    records: (filter: string | undefined, pageToken?: string) =>
      page<MeetConferenceRecord>("conferenceRecords.list", { filter, pageToken }, "conferenceRecords"),
    allRecords: (filter: string | undefined) =>
      all<MeetConferenceRecord>("calls", "conferenceRecords.list", { filter }, "conferenceRecords"),
    record: (id: string) => one("conferenceRecords.get", { conferenceRecordsId: id }, schema.MeetConferenceRecord),
    space: (id: string) => one("spaces.get", { spacesId: id }, schema.MeetSpace),
    createSpace: async (config: MeetSpaceConfig) =>
      answerOf(schema.MeetSpace, await api.call("meet.spaces.create", {}, { config }), MEET),
    /** Only the fields `paths` names change; never `*`, which clears every field left out. */
    patchSpace: async (id: string, config: MeetSpaceConfig, paths: readonly string[]) =>
      answerOf(
        schema.MeetSpace,
        await api.call("meet.spaces.patch", { spacesId: id, updateMask: paths.join(",") }, { config }),
        MEET,
      ),
    participants: (record: string) =>
      all<MeetParticipant>(
        "participants",
        "conferenceRecords.participants.list",
        { conferenceRecordsId: record },
        "participants",
      ),
    transcripts: (record: string) =>
      all<MeetTranscript>(
        "transcripts",
        "conferenceRecords.transcripts.list",
        { conferenceRecordsId: record },
        "transcripts",
      ),
    recordings: (record: string) =>
      all<MeetRecording>(
        "recordings",
        "conferenceRecords.recordings.list",
        { conferenceRecordsId: record },
        "recordings",
      ),
    smartNotes: (record: string) =>
      all<MeetSmartNote>(
        "smart notes",
        "conferenceRecords.smartNotes.list",
        { conferenceRecordsId: record },
        "smartNotes",
      ),
    entries: (record: string, transcript: string) =>
      all<MeetTranscriptEntry>(
        "transcript entries",
        "conferenceRecords.transcripts.entries.list",
        { conferenceRecordsId: record, transcriptsId: transcript },
        "transcriptEntries",
      ),
  }
}

export type MeetApi = ReturnType<typeof meetApi>
