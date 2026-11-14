// GENERATED. DO NOT EDIT.
// Source: spec/google/meet.json, verified by provenance.json
// Run: pnpm generate

import { integer } from "@wirecat/cli-base/codegen/runtime"
import * as v from "valibot"
import type * as T from "./types.js"

export const MeetActiveConference: v.GenericSchema<unknown, T.MeetActiveConference> = v.looseObject({
  conferenceRecord: v.optional(v.string()),
})

export const MeetAnonymousUser: v.GenericSchema<unknown, T.MeetAnonymousUser> = v.looseObject({
  displayName: v.optional(v.string()),
})

export const MeetArtifactConfig: v.GenericSchema<unknown, T.MeetArtifactConfig> = v.looseObject({
  recordingConfig: v.optional(v.lazy(() => MeetRecordingConfig)),
  smartNotesConfig: v.optional(v.lazy(() => MeetSmartNotesConfig)),
  transcriptionConfig: v.optional(v.lazy(() => MeetTranscriptionConfig)),
})

export const MeetBatchUpdateMembersRequest: v.GenericSchema<unknown, T.MeetBatchUpdateMembersRequest> = v.looseObject({
  requests: v.optional(v.array(v.lazy(() => MeetUpdateMemberRequest))),
  updateMask: v.optional(v.string()),
})

export const MeetBatchUpdateMembersResponse: v.GenericSchema<unknown, T.MeetBatchUpdateMembersResponse> = v.looseObject(
  {
    members: v.optional(v.array(v.lazy(() => MeetMember))),
  },
)

export const MeetConferenceRecord: v.GenericSchema<unknown, T.MeetConferenceRecord> = v.looseObject({
  endTime: v.optional(v.string()),
  expireTime: v.optional(v.string()),
  name: v.optional(v.string()),
  space: v.optional(v.string()),
  startTime: v.optional(v.string()),
})

export const MeetDocsDestination: v.GenericSchema<unknown, T.MeetDocsDestination> = v.looseObject({
  document: v.optional(v.string()),
  exportUri: v.optional(v.string()),
})

export const MeetDriveDestination: v.GenericSchema<unknown, T.MeetDriveDestination> = v.looseObject({
  exportUri: v.optional(v.string()),
  file: v.optional(v.string()),
})

export const MeetEmpty: v.GenericSchema<unknown, T.MeetEmpty> = v.looseObject({})

export const MeetEndActiveConferenceRequest: v.GenericSchema<unknown, T.MeetEndActiveConferenceRequest> = v.looseObject(
  {},
)

export const MeetGatewaySipAccess: v.GenericSchema<unknown, T.MeetGatewaySipAccess> = v.looseObject({
  sipAccessCode: v.optional(v.string()),
  uri: v.optional(v.string()),
})

export const MeetListConferenceRecordsResponse: v.GenericSchema<unknown, T.MeetListConferenceRecordsResponse> =
  v.looseObject({
    conferenceRecords: v.optional(v.array(v.lazy(() => MeetConferenceRecord))),
    nextPageToken: v.optional(v.string()),
  })

export const MeetListMembersResponse: v.GenericSchema<unknown, T.MeetListMembersResponse> = v.looseObject({
  members: v.optional(v.array(v.lazy(() => MeetMember))),
  nextPageToken: v.optional(v.string()),
})

export const MeetListParticipantSessionsResponse: v.GenericSchema<unknown, T.MeetListParticipantSessionsResponse> =
  v.looseObject({
    nextPageToken: v.optional(v.string()),
    participantSessions: v.optional(v.array(v.lazy(() => MeetParticipantSession))),
  })

export const MeetListParticipantsResponse: v.GenericSchema<unknown, T.MeetListParticipantsResponse> = v.looseObject({
  nextPageToken: v.optional(v.string()),
  participants: v.optional(v.array(v.lazy(() => MeetParticipant))),
  totalSize: v.optional(integer()),
})

export const MeetListRecordingsResponse: v.GenericSchema<unknown, T.MeetListRecordingsResponse> = v.looseObject({
  nextPageToken: v.optional(v.string()),
  recordings: v.optional(v.array(v.lazy(() => MeetRecording))),
})

export const MeetListSmartNotesResponse: v.GenericSchema<unknown, T.MeetListSmartNotesResponse> = v.looseObject({
  nextPageToken: v.optional(v.string()),
  smartNotes: v.optional(v.array(v.lazy(() => MeetSmartNote))),
})

export const MeetListTranscriptEntriesResponse: v.GenericSchema<unknown, T.MeetListTranscriptEntriesResponse> =
  v.looseObject({
    nextPageToken: v.optional(v.string()),
    transcriptEntries: v.optional(v.array(v.lazy(() => MeetTranscriptEntry))),
  })

export const MeetListTranscriptsResponse: v.GenericSchema<unknown, T.MeetListTranscriptsResponse> = v.looseObject({
  nextPageToken: v.optional(v.string()),
  transcripts: v.optional(v.array(v.lazy(() => MeetTranscript))),
})

export const MeetMember: v.GenericSchema<unknown, T.MeetMember> = v.looseObject({
  email: v.optional(v.string()),
  name: v.optional(v.string()),
  role: v.optional(v.string()),
})

export const MeetModerationRestrictions: v.GenericSchema<unknown, T.MeetModerationRestrictions> = v.looseObject({
  chatRestriction: v.optional(v.string()),
  defaultJoinAsViewerType: v.optional(v.string()),
  presentRestriction: v.optional(v.string()),
  reactionRestriction: v.optional(v.string()),
})

export const MeetParticipant: v.GenericSchema<unknown, T.MeetParticipant> = v.looseObject({
  anonymousUser: v.optional(v.lazy(() => MeetAnonymousUser)),
  earliestStartTime: v.optional(v.string()),
  latestEndTime: v.optional(v.string()),
  name: v.optional(v.string()),
  phoneUser: v.optional(v.lazy(() => MeetPhoneUser)),
  signedinUser: v.optional(v.lazy(() => MeetSignedinUser)),
})

export const MeetParticipantSession: v.GenericSchema<unknown, T.MeetParticipantSession> = v.looseObject({
  endTime: v.optional(v.string()),
  name: v.optional(v.string()),
  startTime: v.optional(v.string()),
})

export const MeetPhoneAccess: v.GenericSchema<unknown, T.MeetPhoneAccess> = v.looseObject({
  languageCode: v.optional(v.string()),
  phoneNumber: v.optional(v.string()),
  pin: v.optional(v.string()),
  regionCode: v.optional(v.string()),
})

export const MeetPhoneUser: v.GenericSchema<unknown, T.MeetPhoneUser> = v.looseObject({
  displayName: v.optional(v.string()),
})

export const MeetRecording: v.GenericSchema<unknown, T.MeetRecording> = v.looseObject({
  driveDestination: v.optional(v.lazy(() => MeetDriveDestination)),
  endTime: v.optional(v.string()),
  name: v.optional(v.string()),
  startTime: v.optional(v.string()),
  state: v.optional(v.string()),
})

export const MeetRecordingConfig: v.GenericSchema<unknown, T.MeetRecordingConfig> = v.looseObject({
  autoRecordingGeneration: v.optional(v.string()),
})

export const MeetSignedinUser: v.GenericSchema<unknown, T.MeetSignedinUser> = v.looseObject({
  displayName: v.optional(v.string()),
  user: v.optional(v.string()),
})

export const MeetSmartNote: v.GenericSchema<unknown, T.MeetSmartNote> = v.looseObject({
  docsDestination: v.optional(v.lazy(() => MeetDocsDestination)),
  endTime: v.optional(v.string()),
  name: v.optional(v.string()),
  startTime: v.optional(v.string()),
  state: v.optional(v.string()),
})

export const MeetSmartNotesConfig: v.GenericSchema<unknown, T.MeetSmartNotesConfig> = v.looseObject({
  autoSmartNotesGeneration: v.optional(v.string()),
})

export const MeetSpace: v.GenericSchema<unknown, T.MeetSpace> = v.looseObject({
  activeConference: v.optional(v.lazy(() => MeetActiveConference)),
  config: v.optional(v.lazy(() => MeetSpaceConfig)),
  gatewaySipAccess: v.optional(v.array(v.lazy(() => MeetGatewaySipAccess))),
  meetingCode: v.optional(v.string()),
  meetingUri: v.optional(v.string()),
  name: v.optional(v.string()),
  phoneAccess: v.optional(v.array(v.lazy(() => MeetPhoneAccess))),
})

export const MeetSpaceConfig: v.GenericSchema<unknown, T.MeetSpaceConfig> = v.looseObject({
  accessType: v.optional(v.string()),
  artifactConfig: v.optional(v.lazy(() => MeetArtifactConfig)),
  attendanceReportGenerationType: v.optional(v.string()),
  entryPointAccess: v.optional(v.string()),
  moderation: v.optional(v.string()),
  moderationRestrictions: v.optional(v.lazy(() => MeetModerationRestrictions)),
})

export const MeetTranscript: v.GenericSchema<unknown, T.MeetTranscript> = v.looseObject({
  docsDestination: v.optional(v.lazy(() => MeetDocsDestination)),
  endTime: v.optional(v.string()),
  name: v.optional(v.string()),
  startTime: v.optional(v.string()),
  state: v.optional(v.string()),
})

export const MeetTranscriptEntry: v.GenericSchema<unknown, T.MeetTranscriptEntry> = v.looseObject({
  endTime: v.optional(v.string()),
  languageCode: v.optional(v.string()),
  name: v.optional(v.string()),
  participant: v.optional(v.string()),
  startTime: v.optional(v.string()),
  text: v.optional(v.string()),
})

export const MeetTranscriptionConfig: v.GenericSchema<unknown, T.MeetTranscriptionConfig> = v.looseObject({
  autoTranscriptionGeneration: v.optional(v.string()),
})

export const MeetUpdateMemberRequest: v.GenericSchema<unknown, T.MeetUpdateMemberRequest> = v.looseObject({
  member: v.optional(v.lazy(() => MeetMember)),
  updateMask: v.optional(v.string()),
})

export const schemas = {
  MeetActiveConference,
  MeetAnonymousUser,
  MeetArtifactConfig,
  MeetBatchUpdateMembersRequest,
  MeetBatchUpdateMembersResponse,
  MeetConferenceRecord,
  MeetDocsDestination,
  MeetDriveDestination,
  MeetEmpty,
  MeetEndActiveConferenceRequest,
  MeetGatewaySipAccess,
  MeetListConferenceRecordsResponse,
  MeetListMembersResponse,
  MeetListParticipantSessionsResponse,
  MeetListParticipantsResponse,
  MeetListRecordingsResponse,
  MeetListSmartNotesResponse,
  MeetListTranscriptEntriesResponse,
  MeetListTranscriptsResponse,
  MeetMember,
  MeetModerationRestrictions,
  MeetParticipant,
  MeetParticipantSession,
  MeetPhoneAccess,
  MeetPhoneUser,
  MeetRecording,
  MeetRecordingConfig,
  MeetSignedinUser,
  MeetSmartNote,
  MeetSmartNotesConfig,
  MeetSpace,
  MeetSpaceConfig,
  MeetTranscript,
  MeetTranscriptEntry,
  MeetTranscriptionConfig,
  MeetUpdateMemberRequest,
} as const
