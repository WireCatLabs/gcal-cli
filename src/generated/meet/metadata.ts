export const metadata = {
  scopes: {
    "meet.conferenceRecords.get": [
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://www.googleapis.com/auth/meetings.space.readonly",
    ],
    "meet.conferenceRecords.list": [
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://www.googleapis.com/auth/meetings.space.readonly",
    ],
    "meet.conferenceRecords.participants.list": [
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://www.googleapis.com/auth/meetings.space.readonly",
    ],
    "meet.conferenceRecords.recordings.list": [
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://www.googleapis.com/auth/meetings.space.readonly",
    ],
    "meet.conferenceRecords.smartNotes.list": [
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://www.googleapis.com/auth/meetings.space.readonly",
    ],
    "meet.conferenceRecords.transcripts.list": [
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://www.googleapis.com/auth/meetings.space.readonly",
    ],
    "meet.conferenceRecords.transcripts.entries.list": [
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://www.googleapis.com/auth/meetings.space.readonly",
    ],
    "meet.spaces.create": ["https://www.googleapis.com/auth/meetings.space.created"],
    "meet.spaces.get": [
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://www.googleapis.com/auth/meetings.space.readonly",
      "https://www.googleapis.com/auth/meetings.space.settings",
    ],
    "meet.spaces.patch": [
      "https://www.googleapis.com/auth/meetings.space.created",
      "https://www.googleapis.com/auth/meetings.space.settings",
    ],
  },
  omissions: [
    "meet.conferenceRecords.participants.get: excluded — gcal reads a call through the list methods, which return every field the get would",
    "meet.conferenceRecords.participants.participantSessions.get: excluded — gcal keeps a participant's first join and last leave only",
    "meet.conferenceRecords.participants.participantSessions.list: excluded — gcal keeps a participant's first join and last leave only",
    "meet.conferenceRecords.recordings.get: excluded — gcal reads a call through the list methods, which return every field the get would",
    "meet.conferenceRecords.smartNotes.get: excluded — gcal reads a call through the list methods, which return every field the get would",
    "meet.conferenceRecords.transcripts.get: excluded — gcal reads a call through the list methods, which return every field the get would",
    "meet.conferenceRecords.transcripts.entries.get: excluded — gcal reads a call through the list methods, which return every field the get would",
    "meet.spaces.endActiveConference: excluded — ends a call for everyone in it, which no gcal command does",
    "meet.spaces.members.batchUpdate: excluded — meeting space members are not part of the meetings commands",
    "meet.spaces.members.create: excluded — meeting space members are not part of the meetings commands",
    "meet.spaces.members.delete: excluded — meeting space members are not part of the meetings commands",
    "meet.spaces.members.get: excluded — meeting space members are not part of the meetings commands",
    "meet.spaces.members.list: excluded — meeting space members are not part of the meetings commands",
    "meet.spaces.members.patch: excluded — meeting space members are not part of the meetings commands",
  ],
  services: {
    meet: {
      rootUrl: "https://meet.googleapis.com/",
      servicePath: "",
    },
  },
}
