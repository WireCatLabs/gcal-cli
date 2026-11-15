import { CliError } from "@wirecat/cli-base"
import type {
  ManagedMeeting,
  ManagedMeetingChange,
  MeetingManagementPorts,
  MeetingSetting,
} from "@wirecat/cli-core/meetings"
import type { MeetSpace, MeetSpaceConfig } from "../generated/meet/types.js"
import { idOf, type MeetApi, ownId } from "./api.js"

/** A space's settings by cli-core's `--setting` names. A space has no title or time, so these are all it takes. */
export const SPACE_SETTINGS: readonly MeetingSetting[] = [
  {
    name: "access_type",
    type: "choice",
    values: ["open", "trusted", "restricted"],
    description: "who joins without knocking: anyone with the link, the organization's people, or only those invited",
  },
  { name: "moderation", type: "boolean", description: "the host decides who may share their screen, chat and present" },
  { name: "auto_recording", type: "boolean", description: "record every call in the space from its start" },
  { name: "auto_transcription", type: "boolean", description: "transcribe every call in the space from its start" },
  { name: "auto_smart_notes", type: "boolean", description: "take Gemini notes in every call in the space" },
]

type Settings = NonNullable<ManagedMeetingChange["settings"]>

const MASK: Record<string, string> = {
  access_type: "config.accessType",
  moderation: "config.moderation",
  auto_recording: "config.artifactConfig.recordingConfig.autoRecordingGeneration",
  auto_transcription: "config.artifactConfig.transcriptionConfig.autoTranscriptionGeneration",
  auto_smart_notes: "config.artifactConfig.smartNotesConfig.autoSmartNotesGeneration",
}

const wire = (value: string | boolean | undefined) =>
  value === undefined ? undefined : typeof value === "boolean" ? (value ? "ON" : "OFF") : value.toUpperCase()

/** The settings as Meet's `SpaceConfig`, and the `updateMask` paths that name exactly them. */
export const configOf = (settings: Settings = {}): { config: MeetSpaceConfig; paths: string[] } => {
  const config: MeetSpaceConfig = {}
  const artifacts: NonNullable<MeetSpaceConfig["artifactConfig"]> = {}
  const { access_type, moderation, auto_recording, auto_transcription, auto_smart_notes } = settings
  if (access_type !== undefined) config.accessType = wire(access_type)
  if (moderation !== undefined) config.moderation = wire(moderation)
  if (auto_recording !== undefined) artifacts.recordingConfig = { autoRecordingGeneration: wire(auto_recording) }
  if (auto_transcription !== undefined)
    artifacts.transcriptionConfig = { autoTranscriptionGeneration: wire(auto_transcription) }
  if (auto_smart_notes !== undefined) artifacts.smartNotesConfig = { autoSmartNotesGeneration: wire(auto_smart_notes) }
  if (Object.keys(artifacts).length > 0) config.artifactConfig = artifacts
  const paths = Object.keys(MASK).flatMap((name) => (settings[name] === undefined ? [] : [MASK[name] as string]))
  return { config, paths }
}

/** A new space: a call that can start now, with no title, length or zone of its own. */
const managedOf = (space: MeetSpace, startTime: string | undefined): ManagedMeeting => {
  if (!space.meetingUri) throw new CliError("invalid_response", "Google Meet sent a new meeting space with no link")
  return {
    id: ownId("spaces", space.name),
    title: null,
    kind: "instant",
    startTime: startTime ?? null,
    durationMinutes: null,
    timezone: null,
    agenda: null,
    joinUrl: space.meetingUri,
  }
}

/**
 * `meetings create|update` over Meet's spaces.create and spaces.patch. Patch reaches only the spaces this app made
 * (`meetings.space.created`), and names its fields in `updateMask`: `*` would clear every field left out.
 */
export const spacePorts = (api: () => MeetApi): MeetingManagementPorts => ({
  create: async (change) => managedOf(await api().createSpace(configOf(change.settings).config), change.startTime),
  update: async (id, change) => {
    const { config, paths } = configOf(change.settings)
    await api().patchSpace(idOf("spaces", id), config, paths)
  },
  fields: { create: { fields: [], settings: SPACE_SETTINGS }, update: { fields: [], settings: SPACE_SETTINGS } },
})
