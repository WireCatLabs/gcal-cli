import { CliError } from "@wirecat/cli-base"
import * as v from "valibot"
import { idOf, type MeetApi, ownId, type WireSpace, type WireSpaceConfig } from "./api.js"

const ON_OFF = ["on", "off"] as const
type OnOff = (typeof ON_OFF)[number]

/** A space's settings in gcal's words: Meet's enum values in lower case, `null` where Google sent none. */
export const SPACE_SETTINGS = {
  access_type: ["open", "trusted", "restricted"],
  entry_point_access: ["all", "creator_app_only"],
  moderation: ON_OFF,
  auto_recording: ON_OFF,
  auto_transcription: ON_OFF,
  auto_smart_notes: ON_OFF,
} as const

export type SpaceSetting = keyof typeof SPACE_SETTINGS
export type SpaceChange = {
  access_type?: "open" | "trusted" | "restricted"
  entry_point_access?: "all" | "creator_app_only"
  moderation?: OnOff
  auto_recording?: OnOff
  auto_transcription?: OnOff
  auto_smart_notes?: OnOff
}

/** Each setting's place in Meet's `SpaceConfig`, as `spaces.patch` names it in `updateMask`. */
const MASK: Record<SpaceSetting, string> = {
  access_type: "config.accessType",
  entry_point_access: "config.entryPointAccess",
  moderation: "config.moderation",
  auto_recording: "config.artifactConfig.recordingConfig.autoRecordingGeneration",
  auto_transcription: "config.artifactConfig.transcriptionConfig.autoTranscriptionGeneration",
  auto_smart_notes: "config.artifactConfig.smartNotesConfig.autoSmartNotesGeneration",
}

const nullableText = v.nullable(v.string())

/** A meeting space: the link and code people join by. Names follow zoom's meeting where the thing is the same. */
export const spaceSchema = v.strictObject({
  id: v.string(),
  join_url: nullableText,
  meeting_code: nullableText,
  access_type: nullableText,
  entry_point_access: nullableText,
  moderation: nullableText,
  auto_recording: nullableText,
  auto_transcription: nullableText,
  auto_smart_notes: nullableText,
})

export type Space = v.InferOutput<typeof spaceSchema>

const upper = (value: string | undefined) => (value === undefined ? undefined : value.toUpperCase())

/** Meet's `SpaceConfig` for a change, and the `updateMask` paths that name exactly the settings it holds. */
export const configOf = (change: SpaceChange): { config: WireSpaceConfig; paths: string[] } => {
  const config: WireSpaceConfig = {}
  const artifacts: NonNullable<WireSpaceConfig["artifactConfig"]> = {}
  if (change.access_type) config.accessType = upper(change.access_type)
  if (change.entry_point_access) config.entryPointAccess = upper(change.entry_point_access)
  if (change.moderation) config.moderation = upper(change.moderation)
  if (change.auto_recording) artifacts.recordingConfig = { autoRecordingGeneration: upper(change.auto_recording) }
  if (change.auto_transcription)
    artifacts.transcriptionConfig = { autoTranscriptionGeneration: upper(change.auto_transcription) }
  if (change.auto_smart_notes) artifacts.smartNotesConfig = { autoSmartNotesGeneration: upper(change.auto_smart_notes) }
  if (Object.keys(artifacts).length > 0) config.artifactConfig = artifacts
  const paths = (Object.keys(MASK) as SpaceSetting[]).filter((key) => change[key] !== undefined).map((key) => MASK[key])
  return { config, paths }
}

const said = (value: string | undefined): string | null =>
  value === undefined || value.endsWith("_UNSPECIFIED") ? null : value.toLowerCase()

export const spaceOf = (space: WireSpace): Space => {
  const artifacts = space.config?.artifactConfig
  if (!space.name) throw new CliError("invalid_response", "Google Meet sent a meeting space with no name")
  return {
    id: ownId("spaces", space.name),
    join_url: space.meetingUri ?? null,
    meeting_code: space.meetingCode ?? null,
    access_type: said(space.config?.accessType),
    entry_point_access: said(space.config?.entryPointAccess),
    moderation: said(space.config?.moderation),
    auto_recording: said(artifacts?.recordingConfig?.autoRecordingGeneration),
    auto_transcription: said(artifacts?.transcriptionConfig?.autoTranscriptionGeneration),
    auto_smart_notes: said(artifacts?.smartNotesConfig?.autoSmartNotesGeneration),
  }
}

/** spaces.create: a new meeting link, with the account's defaults for every setting the change leaves out. */
export const createSpace = async (api: MeetApi, change: SpaceChange): Promise<Space> =>
  spaceOf(await api.createSpace(configOf(change).config))

/**
 * spaces.patch on a space this app created; Google refuses one it did not. A meeting code is not taken: patch names
 * the space only by its id.
 */
export const updateSpace = async (api: MeetApi, given: string, change: SpaceChange): Promise<Space> => {
  const { config, paths } = configOf(change)
  if (paths.length === 0)
    throw new CliError("validation_error", "name at least one setting to change", { reason: "space.no-change" })
  return spaceOf(await api.patchSpace(idOf("spaces", given), config, paths))
}
