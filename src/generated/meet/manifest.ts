// GENERATED. DO NOT EDIT.
// Source: spec/google/meet.json, verified by provenance.json
// Run: pnpm generate

import type { ManifestOperation, SecurityScheme } from "@wirecat/cli-base/codegen/runtime"

export const operations: readonly ManifestOperation[] = [
  {
    id: "meet.conferenceRecords.get",
    command: "meet-conference-records-get",
    binding: {
      kind: "http",
      method: "GET",
      path: "v2/conferenceRecords/{conferenceRecordsId}",
    },
    effect: "read",
    summary:
      "Gets a conference record by conference ID. For more information, see [Work with conferences](https://developers.google.com/workspace/meet/api/guides/conferences).",
    description:
      "Gets a conference record by conference ID. For more information, see [Work with conferences](https://developers.google.com/workspace/meet/api/guides/conferences).",
    tags: ["meet"],
    security: [
      {
        oauth2: [
          "https://www.googleapis.com/auth/meetings.space.created",
          "https://www.googleapis.com/auth/meetings.space.readonly",
        ],
      },
    ],
    parameters: [
      {
        name: "$.xgafv",
        in: "query",
        required: false,
        description: "V1 error format.",
        schema: {
          description: "V1 error format.",
          type: "string",
          enum: ["1", "2"],
        },
      },
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for response.",
        schema: {
          description: "Data format for response.",
          default: "json",
          type: "string",
          enum: ["json", "media", "proto"],
        },
      },
      {
        name: "callback",
        in: "query",
        required: false,
        description: "JSONP",
        schema: {
          description: "JSONP",
          type: "string",
        },
      },
      {
        name: "fields",
        in: "query",
        required: false,
        description: "Selector specifying which fields to include in a partial response.",
        schema: {
          description: "Selector specifying which fields to include in a partial response.",
          type: "string",
        },
      },
      {
        name: "prettyPrint",
        in: "query",
        required: false,
        description: "Returns response with indentations and line breaks.",
        schema: {
          description: "Returns response with indentations and line breaks.",
          default: "true",
          type: "boolean",
        },
      },
      {
        name: "quotaUser",
        in: "query",
        required: false,
        description:
          "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
        schema: {
          description:
            "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "conferenceRecordsId",
        in: "path",
        required: true,
        description: "The id after conferenceRecords/.",
        schema: {
          description: "The id after conferenceRecords/.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "MeetConferenceRecord",
    },
  },
  {
    id: "meet.conferenceRecords.list",
    command: "meet-conference-records-list",
    binding: {
      kind: "http",
      method: "GET",
      path: "v2/conferenceRecords",
    },
    effect: "read",
    summary:
      "Lists the conference records. By default, ordered by start time and in descending order. For more information, see [Work with conferences](https://developers.google.com/workspace/meet/api/guides/conferences).",
    description:
      "Lists the conference records. By default, ordered by start time and in descending order. For more information, see [Work with conferences](https://developers.google.com/workspace/meet/api/guides/conferences).",
    tags: ["meet"],
    security: [
      {
        oauth2: [
          "https://www.googleapis.com/auth/meetings.space.created",
          "https://www.googleapis.com/auth/meetings.space.readonly",
        ],
      },
    ],
    parameters: [
      {
        name: "$.xgafv",
        in: "query",
        required: false,
        description: "V1 error format.",
        schema: {
          description: "V1 error format.",
          type: "string",
          enum: ["1", "2"],
        },
      },
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for response.",
        schema: {
          description: "Data format for response.",
          default: "json",
          type: "string",
          enum: ["json", "media", "proto"],
        },
      },
      {
        name: "callback",
        in: "query",
        required: false,
        description: "JSONP",
        schema: {
          description: "JSONP",
          type: "string",
        },
      },
      {
        name: "fields",
        in: "query",
        required: false,
        description: "Selector specifying which fields to include in a partial response.",
        schema: {
          description: "Selector specifying which fields to include in a partial response.",
          type: "string",
        },
      },
      {
        name: "prettyPrint",
        in: "query",
        required: false,
        description: "Returns response with indentations and line breaks.",
        schema: {
          description: "Returns response with indentations and line breaks.",
          default: "true",
          type: "boolean",
        },
      },
      {
        name: "quotaUser",
        in: "query",
        required: false,
        description:
          "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
        schema: {
          description:
            "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "filter",
        in: "query",
        required: false,
        description:
          'Optional. User specified filtering condition in [EBNF format](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form). The following are the filterable fields: * `space.meeting_code` * `space.name` * `start_time` * `end_time` For example, consider the following filters: * `space.name = "spaces/NAME"` * `space.meeting_code = "abc-mnop-xyz"` * `start_time>="2024-01-01T00:00:00.000Z" AND start_time<="2024-01-02T00:00:00.000Z"` * `end_time IS NULL`',
        schema: {
          description:
            'Optional. User specified filtering condition in [EBNF format](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form). The following are the filterable fields: * `space.meeting_code` * `space.name` * `start_time` * `end_time` For example, consider the following filters: * `space.name = "spaces/NAME"` * `space.meeting_code = "abc-mnop-xyz"` * `start_time>="2024-01-01T00:00:00.000Z" AND start_time<="2024-01-02T00:00:00.000Z"` * `end_time IS NULL`',
          type: "string",
        },
      },
      {
        name: "pageSize",
        in: "query",
        required: false,
        description:
          "Optional. Maximum number of conference records to return. The service might return fewer than this value. If unspecified, at most 25 conference records are returned. The maximum value is 100; values above 100 are coerced to 100. Maximum might change in the future.",
        schema: {
          description:
            "Optional. Maximum number of conference records to return. The service might return fewer than this value. If unspecified, at most 25 conference records are returned. The maximum value is 100; values above 100 are coerced to 100. Maximum might change in the future.",
          type: "integer",
          format: "int32",
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Optional. Page token returned from previous List Call.",
        schema: {
          description: "Optional. Page token returned from previous List Call.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "MeetListConferenceRecordsResponse",
    },
  },
  {
    id: "meet.conferenceRecords.participants.list",
    command: "meet-conference-records-participants-list",
    binding: {
      kind: "http",
      method: "GET",
      path: "v2/conferenceRecords/{conferenceRecordsId}/participants",
    },
    effect: "read",
    summary:
      "Lists the participants in a conference record. By default, ordered by join time and in descending order. This API supports `fields` as standard parameters like every other API. However, when the `fields` request parameter is omitted, this API defaults to `'participants/*, next_page_token'`. For more information, see [Work with participants](https://developers.google.com/workspace/meet/api/guides/participants).",
    description:
      "Lists the participants in a conference record. By default, ordered by join time and in descending order. This API supports `fields` as standard parameters like every other API. However, when the `fields` request parameter is omitted, this API defaults to `'participants/*, next_page_token'`. For more information, see [Work with participants](https://developers.google.com/workspace/meet/api/guides/participants).",
    tags: ["meet"],
    security: [
      {
        oauth2: [
          "https://www.googleapis.com/auth/meetings.space.created",
          "https://www.googleapis.com/auth/meetings.space.readonly",
        ],
      },
    ],
    parameters: [
      {
        name: "$.xgafv",
        in: "query",
        required: false,
        description: "V1 error format.",
        schema: {
          description: "V1 error format.",
          type: "string",
          enum: ["1", "2"],
        },
      },
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for response.",
        schema: {
          description: "Data format for response.",
          default: "json",
          type: "string",
          enum: ["json", "media", "proto"],
        },
      },
      {
        name: "callback",
        in: "query",
        required: false,
        description: "JSONP",
        schema: {
          description: "JSONP",
          type: "string",
        },
      },
      {
        name: "fields",
        in: "query",
        required: false,
        description: "Selector specifying which fields to include in a partial response.",
        schema: {
          description: "Selector specifying which fields to include in a partial response.",
          type: "string",
        },
      },
      {
        name: "prettyPrint",
        in: "query",
        required: false,
        description: "Returns response with indentations and line breaks.",
        schema: {
          description: "Returns response with indentations and line breaks.",
          default: "true",
          type: "boolean",
        },
      },
      {
        name: "quotaUser",
        in: "query",
        required: false,
        description:
          "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
        schema: {
          description:
            "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "conferenceRecordsId",
        in: "path",
        required: true,
        description: "The id after conferenceRecords/.",
        schema: {
          description: "The id after conferenceRecords/.",
          type: "string",
        },
      },
      {
        name: "filter",
        in: "query",
        required: false,
        description:
          "Optional. User specified filtering condition in [EBNF format](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form). The following are the filterable fields: * `earliest_start_time` * `latest_end_time` For example, `latest_end_time IS NULL` returns active participants in the conference.",
        schema: {
          description:
            "Optional. User specified filtering condition in [EBNF format](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form). The following are the filterable fields: * `earliest_start_time` * `latest_end_time` For example, `latest_end_time IS NULL` returns active participants in the conference.",
          type: "string",
        },
      },
      {
        name: "pageSize",
        in: "query",
        required: false,
        description:
          "Maximum number of participants to return. The service might return fewer than this value. If unspecified, at most 100 participants are returned. The maximum value is 250; values above 250 are coerced to 250. Maximum might change in the future.",
        schema: {
          description:
            "Maximum number of participants to return. The service might return fewer than this value. If unspecified, at most 100 participants are returned. The maximum value is 250; values above 250 are coerced to 250. Maximum might change in the future.",
          type: "integer",
          format: "int32",
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Page token returned from previous List Call.",
        schema: {
          description: "Page token returned from previous List Call.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "MeetListParticipantsResponse",
    },
  },
  {
    id: "meet.conferenceRecords.recordings.list",
    command: "meet-conference-records-recordings-list",
    binding: {
      kind: "http",
      method: "GET",
      path: "v2/conferenceRecords/{conferenceRecordsId}/recordings",
    },
    effect: "read",
    summary:
      "Lists the recording resources from the conference record. By default, ordered by start time and in ascending order. For more information, see [Work with artifacts](https://developers.google.com/workspace/meet/api/guides/artifacts).",
    description:
      "Lists the recording resources from the conference record. By default, ordered by start time and in ascending order. For more information, see [Work with artifacts](https://developers.google.com/workspace/meet/api/guides/artifacts).",
    tags: ["meet"],
    security: [
      {
        oauth2: [
          "https://www.googleapis.com/auth/meetings.space.created",
          "https://www.googleapis.com/auth/meetings.space.readonly",
        ],
      },
    ],
    parameters: [
      {
        name: "$.xgafv",
        in: "query",
        required: false,
        description: "V1 error format.",
        schema: {
          description: "V1 error format.",
          type: "string",
          enum: ["1", "2"],
        },
      },
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for response.",
        schema: {
          description: "Data format for response.",
          default: "json",
          type: "string",
          enum: ["json", "media", "proto"],
        },
      },
      {
        name: "callback",
        in: "query",
        required: false,
        description: "JSONP",
        schema: {
          description: "JSONP",
          type: "string",
        },
      },
      {
        name: "fields",
        in: "query",
        required: false,
        description: "Selector specifying which fields to include in a partial response.",
        schema: {
          description: "Selector specifying which fields to include in a partial response.",
          type: "string",
        },
      },
      {
        name: "prettyPrint",
        in: "query",
        required: false,
        description: "Returns response with indentations and line breaks.",
        schema: {
          description: "Returns response with indentations and line breaks.",
          default: "true",
          type: "boolean",
        },
      },
      {
        name: "quotaUser",
        in: "query",
        required: false,
        description:
          "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
        schema: {
          description:
            "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "conferenceRecordsId",
        in: "path",
        required: true,
        description: "The id after conferenceRecords/.",
        schema: {
          description: "The id after conferenceRecords/.",
          type: "string",
        },
      },
      {
        name: "pageSize",
        in: "query",
        required: false,
        description:
          "Maximum number of recordings to return. The service might return fewer than this value. If unspecified, at most 10 recordings are returned. The maximum value is 100; values above 100 are coerced to 100. Maximum might change in the future.",
        schema: {
          description:
            "Maximum number of recordings to return. The service might return fewer than this value. If unspecified, at most 10 recordings are returned. The maximum value is 100; values above 100 are coerced to 100. Maximum might change in the future.",
          type: "integer",
          format: "int32",
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Page token returned from previous List Call.",
        schema: {
          description: "Page token returned from previous List Call.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "MeetListRecordingsResponse",
    },
  },
  {
    id: "meet.conferenceRecords.smartNotes.list",
    command: "meet-conference-records-smart-notes-list",
    binding: {
      kind: "http",
      method: "GET",
      path: "v2/conferenceRecords/{conferenceRecordsId}/smartNotes",
    },
    effect: "read",
    summary:
      "Lists the set of smart notes from the conference record. By default, ordered by start time and in ascending order. For more information, see [Work with artifacts](https://developers.google.com/workspace/meet/api/guides/artifacts).",
    description:
      "Lists the set of smart notes from the conference record. By default, ordered by start time and in ascending order. For more information, see [Work with artifacts](https://developers.google.com/workspace/meet/api/guides/artifacts).",
    tags: ["meet"],
    security: [
      {
        oauth2: [
          "https://www.googleapis.com/auth/meetings.space.created",
          "https://www.googleapis.com/auth/meetings.space.readonly",
        ],
      },
    ],
    parameters: [
      {
        name: "$.xgafv",
        in: "query",
        required: false,
        description: "V1 error format.",
        schema: {
          description: "V1 error format.",
          type: "string",
          enum: ["1", "2"],
        },
      },
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for response.",
        schema: {
          description: "Data format for response.",
          default: "json",
          type: "string",
          enum: ["json", "media", "proto"],
        },
      },
      {
        name: "callback",
        in: "query",
        required: false,
        description: "JSONP",
        schema: {
          description: "JSONP",
          type: "string",
        },
      },
      {
        name: "fields",
        in: "query",
        required: false,
        description: "Selector specifying which fields to include in a partial response.",
        schema: {
          description: "Selector specifying which fields to include in a partial response.",
          type: "string",
        },
      },
      {
        name: "prettyPrint",
        in: "query",
        required: false,
        description: "Returns response with indentations and line breaks.",
        schema: {
          description: "Returns response with indentations and line breaks.",
          default: "true",
          type: "boolean",
        },
      },
      {
        name: "quotaUser",
        in: "query",
        required: false,
        description:
          "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
        schema: {
          description:
            "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "conferenceRecordsId",
        in: "path",
        required: true,
        description: "The id after conferenceRecords/.",
        schema: {
          description: "The id after conferenceRecords/.",
          type: "string",
        },
      },
      {
        name: "pageSize",
        in: "query",
        required: false,
        description:
          "Optional. Maximum number of smart notes to return. The service might return fewer than this value. If unspecified, at most 10 smart notes are returned. The maximum value is 100; values above 100 are coerced to 100. Maximum might change in the future.",
        schema: {
          description:
            "Optional. Maximum number of smart notes to return. The service might return fewer than this value. If unspecified, at most 10 smart notes are returned. The maximum value is 100; values above 100 are coerced to 100. Maximum might change in the future.",
          type: "integer",
          format: "int32",
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Optional. Page token returned from previous List Call.",
        schema: {
          description: "Optional. Page token returned from previous List Call.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "MeetListSmartNotesResponse",
    },
  },
  {
    id: "meet.conferenceRecords.transcripts.entries.list",
    command: "meet-conference-records-transcripts-entries-list",
    binding: {
      kind: "http",
      method: "GET",
      path: "v2/conferenceRecords/{conferenceRecordsId}/transcripts/{transcriptsId}/entries",
    },
    effect: "read",
    summary:
      "Lists the structured transcript entries per transcript. By default, ordered by start time and in ascending order. For more information, see [Work with artifacts](https://developers.google.com/workspace/meet/api/guides/artifacts). Note: The transcript entries returned by the Google Meet API might not match the transcription found in the Google Docs transcript file. This can occur when 1) we have interleaved speakers within milliseconds, or 2) the Google Docs transcript file is modified after generation.",
    description:
      "Lists the structured transcript entries per transcript. By default, ordered by start time and in ascending order. For more information, see [Work with artifacts](https://developers.google.com/workspace/meet/api/guides/artifacts). Note: The transcript entries returned by the Google Meet API might not match the transcription found in the Google Docs transcript file. This can occur when 1) we have interleaved speakers within milliseconds, or 2) the Google Docs transcript file is modified after generation.",
    tags: ["meet"],
    security: [
      {
        oauth2: [
          "https://www.googleapis.com/auth/meetings.space.created",
          "https://www.googleapis.com/auth/meetings.space.readonly",
        ],
      },
    ],
    parameters: [
      {
        name: "$.xgafv",
        in: "query",
        required: false,
        description: "V1 error format.",
        schema: {
          description: "V1 error format.",
          type: "string",
          enum: ["1", "2"],
        },
      },
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for response.",
        schema: {
          description: "Data format for response.",
          default: "json",
          type: "string",
          enum: ["json", "media", "proto"],
        },
      },
      {
        name: "callback",
        in: "query",
        required: false,
        description: "JSONP",
        schema: {
          description: "JSONP",
          type: "string",
        },
      },
      {
        name: "fields",
        in: "query",
        required: false,
        description: "Selector specifying which fields to include in a partial response.",
        schema: {
          description: "Selector specifying which fields to include in a partial response.",
          type: "string",
        },
      },
      {
        name: "prettyPrint",
        in: "query",
        required: false,
        description: "Returns response with indentations and line breaks.",
        schema: {
          description: "Returns response with indentations and line breaks.",
          default: "true",
          type: "boolean",
        },
      },
      {
        name: "quotaUser",
        in: "query",
        required: false,
        description:
          "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
        schema: {
          description:
            "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "conferenceRecordsId",
        in: "path",
        required: true,
        description: "The id after conferenceRecords/.",
        schema: {
          description: "The id after conferenceRecords/.",
          type: "string",
        },
      },
      {
        name: "transcriptsId",
        in: "path",
        required: true,
        description: "The id after transcripts/.",
        schema: {
          description: "The id after transcripts/.",
          type: "string",
        },
      },
      {
        name: "pageSize",
        in: "query",
        required: false,
        description:
          "Maximum number of entries to return. The service might return fewer than this value. If unspecified, at most 10 entries are returned. The maximum value is 100; values above 100 are coerced to 100. Maximum might change in the future.",
        schema: {
          description:
            "Maximum number of entries to return. The service might return fewer than this value. If unspecified, at most 10 entries are returned. The maximum value is 100; values above 100 are coerced to 100. Maximum might change in the future.",
          type: "integer",
          format: "int32",
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Page token returned from previous List Call.",
        schema: {
          description: "Page token returned from previous List Call.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "MeetListTranscriptEntriesResponse",
    },
  },
  {
    id: "meet.conferenceRecords.transcripts.list",
    command: "meet-conference-records-transcripts-list",
    binding: {
      kind: "http",
      method: "GET",
      path: "v2/conferenceRecords/{conferenceRecordsId}/transcripts",
    },
    effect: "read",
    summary:
      "Lists the set of transcripts from the conference record. By default, ordered by start time and in ascending order. For more information, see [Work with artifacts](https://developers.google.com/workspace/meet/api/guides/artifacts).",
    description:
      "Lists the set of transcripts from the conference record. By default, ordered by start time and in ascending order. For more information, see [Work with artifacts](https://developers.google.com/workspace/meet/api/guides/artifacts).",
    tags: ["meet"],
    security: [
      {
        oauth2: [
          "https://www.googleapis.com/auth/meetings.space.created",
          "https://www.googleapis.com/auth/meetings.space.readonly",
        ],
      },
    ],
    parameters: [
      {
        name: "$.xgafv",
        in: "query",
        required: false,
        description: "V1 error format.",
        schema: {
          description: "V1 error format.",
          type: "string",
          enum: ["1", "2"],
        },
      },
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for response.",
        schema: {
          description: "Data format for response.",
          default: "json",
          type: "string",
          enum: ["json", "media", "proto"],
        },
      },
      {
        name: "callback",
        in: "query",
        required: false,
        description: "JSONP",
        schema: {
          description: "JSONP",
          type: "string",
        },
      },
      {
        name: "fields",
        in: "query",
        required: false,
        description: "Selector specifying which fields to include in a partial response.",
        schema: {
          description: "Selector specifying which fields to include in a partial response.",
          type: "string",
        },
      },
      {
        name: "prettyPrint",
        in: "query",
        required: false,
        description: "Returns response with indentations and line breaks.",
        schema: {
          description: "Returns response with indentations and line breaks.",
          default: "true",
          type: "boolean",
        },
      },
      {
        name: "quotaUser",
        in: "query",
        required: false,
        description:
          "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
        schema: {
          description:
            "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "conferenceRecordsId",
        in: "path",
        required: true,
        description: "The id after conferenceRecords/.",
        schema: {
          description: "The id after conferenceRecords/.",
          type: "string",
        },
      },
      {
        name: "pageSize",
        in: "query",
        required: false,
        description:
          "Maximum number of transcripts to return. The service might return fewer than this value. If unspecified, at most 10 transcripts are returned. The maximum value is 100; values above 100 are coerced to 100. Maximum might change in the future.",
        schema: {
          description:
            "Maximum number of transcripts to return. The service might return fewer than this value. If unspecified, at most 10 transcripts are returned. The maximum value is 100; values above 100 are coerced to 100. Maximum might change in the future.",
          type: "integer",
          format: "int32",
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Page token returned from previous List Call.",
        schema: {
          description: "Page token returned from previous List Call.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "MeetListTranscriptsResponse",
    },
  },
  {
    id: "meet.spaces.create",
    command: "meet-spaces-create",
    binding: {
      kind: "http",
      method: "POST",
      path: "v2/spaces",
    },
    effect: "write",
    summary:
      "Creates a space. For more information, see [Manage meeting spaces](https://developers.google.com/workspace/meet/api/guides/manage-meeting-spaces).",
    description:
      "Creates a space. For more information, see [Manage meeting spaces](https://developers.google.com/workspace/meet/api/guides/manage-meeting-spaces).",
    tags: ["meet"],
    security: [
      {
        oauth2: ["https://www.googleapis.com/auth/meetings.space.created"],
      },
    ],
    parameters: [
      {
        name: "$.xgafv",
        in: "query",
        required: false,
        description: "V1 error format.",
        schema: {
          description: "V1 error format.",
          type: "string",
          enum: ["1", "2"],
        },
      },
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for response.",
        schema: {
          description: "Data format for response.",
          default: "json",
          type: "string",
          enum: ["json", "media", "proto"],
        },
      },
      {
        name: "callback",
        in: "query",
        required: false,
        description: "JSONP",
        schema: {
          description: "JSONP",
          type: "string",
        },
      },
      {
        name: "fields",
        in: "query",
        required: false,
        description: "Selector specifying which fields to include in a partial response.",
        schema: {
          description: "Selector specifying which fields to include in a partial response.",
          type: "string",
        },
      },
      {
        name: "prettyPrint",
        in: "query",
        required: false,
        description: "Returns response with indentations and line breaks.",
        schema: {
          description: "Returns response with indentations and line breaks.",
          default: "true",
          type: "boolean",
        },
      },
      {
        name: "quotaUser",
        in: "query",
        required: false,
        description:
          "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
        schema: {
          description:
            "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
          type: "string",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "MeetSpace",
    },
    response: {
      confidence: "contract",
      schema: "MeetSpace",
    },
  },
  {
    id: "meet.spaces.get",
    command: "meet-spaces-get",
    binding: {
      kind: "http",
      method: "GET",
      path: "v2/spaces/{spacesId}",
    },
    effect: "read",
    summary:
      "Gets details about a meeting space. For more information, see [Manage meeting spaces](https://developers.google.com/workspace/meet/api/guides/manage-meeting-spaces). For an example, see [Get a meeting space](https://developers.google.com/workspace/meet/api/guides/meeting-spaces#get-meeting-space).",
    description:
      "Gets details about a meeting space. For more information, see [Manage meeting spaces](https://developers.google.com/workspace/meet/api/guides/manage-meeting-spaces). For an example, see [Get a meeting space](https://developers.google.com/workspace/meet/api/guides/meeting-spaces#get-meeting-space).",
    tags: ["meet"],
    security: [
      {
        oauth2: [
          "https://www.googleapis.com/auth/meetings.space.created",
          "https://www.googleapis.com/auth/meetings.space.readonly",
          "https://www.googleapis.com/auth/meetings.space.settings",
        ],
      },
    ],
    parameters: [
      {
        name: "$.xgafv",
        in: "query",
        required: false,
        description: "V1 error format.",
        schema: {
          description: "V1 error format.",
          type: "string",
          enum: ["1", "2"],
        },
      },
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for response.",
        schema: {
          description: "Data format for response.",
          default: "json",
          type: "string",
          enum: ["json", "media", "proto"],
        },
      },
      {
        name: "callback",
        in: "query",
        required: false,
        description: "JSONP",
        schema: {
          description: "JSONP",
          type: "string",
        },
      },
      {
        name: "fields",
        in: "query",
        required: false,
        description: "Selector specifying which fields to include in a partial response.",
        schema: {
          description: "Selector specifying which fields to include in a partial response.",
          type: "string",
        },
      },
      {
        name: "prettyPrint",
        in: "query",
        required: false,
        description: "Returns response with indentations and line breaks.",
        schema: {
          description: "Returns response with indentations and line breaks.",
          default: "true",
          type: "boolean",
        },
      },
      {
        name: "quotaUser",
        in: "query",
        required: false,
        description:
          "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
        schema: {
          description:
            "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "spacesId",
        in: "path",
        required: true,
        description: "The id after spaces/.",
        schema: {
          description: "The id after spaces/.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "MeetSpace",
    },
  },
  {
    id: "meet.spaces.patch",
    command: "meet-spaces-patch",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "v2/spaces/{spacesId}",
    },
    effect: "write",
    summary:
      "Updates details about a meeting space. For more information, see [Manage meeting spaces](https://developers.google.com/workspace/meet/api/guides/manage-meeting-spaces).",
    description:
      "Updates details about a meeting space. For more information, see [Manage meeting spaces](https://developers.google.com/workspace/meet/api/guides/manage-meeting-spaces).",
    tags: ["meet"],
    security: [
      {
        oauth2: [
          "https://www.googleapis.com/auth/meetings.space.created",
          "https://www.googleapis.com/auth/meetings.space.settings",
        ],
      },
    ],
    parameters: [
      {
        name: "$.xgafv",
        in: "query",
        required: false,
        description: "V1 error format.",
        schema: {
          description: "V1 error format.",
          type: "string",
          enum: ["1", "2"],
        },
      },
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for response.",
        schema: {
          description: "Data format for response.",
          default: "json",
          type: "string",
          enum: ["json", "media", "proto"],
        },
      },
      {
        name: "callback",
        in: "query",
        required: false,
        description: "JSONP",
        schema: {
          description: "JSONP",
          type: "string",
        },
      },
      {
        name: "fields",
        in: "query",
        required: false,
        description: "Selector specifying which fields to include in a partial response.",
        schema: {
          description: "Selector specifying which fields to include in a partial response.",
          type: "string",
        },
      },
      {
        name: "prettyPrint",
        in: "query",
        required: false,
        description: "Returns response with indentations and line breaks.",
        schema: {
          description: "Returns response with indentations and line breaks.",
          default: "true",
          type: "boolean",
        },
      },
      {
        name: "quotaUser",
        in: "query",
        required: false,
        description:
          "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
        schema: {
          description:
            "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "spacesId",
        in: "path",
        required: true,
        description: "The id after spaces/.",
        schema: {
          description: "The id after spaces/.",
          type: "string",
        },
      },
      {
        name: "updateMask",
        in: "query",
        required: false,
        description:
          'Optional. Field mask used to specify the fields to be updated in the space. If update_mask isn\'t provided(not set, set with empty paths, or only has "" as paths), it defaults to update all fields provided with values in the request. Using "*" as update_mask will update all fields, including deleting fields not set in the request.',
        schema: {
          description:
            'Optional. Field mask used to specify the fields to be updated in the space. If update_mask isn\'t provided(not set, set with empty paths, or only has "" as paths), it defaults to update all fields provided with values in the request. Using "*" as update_mask will update all fields, including deleting fields not set in the request.',
          type: "string",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "MeetSpace",
    },
    response: {
      confidence: "contract",
      schema: "MeetSpace",
    },
  },
]

export const securitySchemes: Readonly<Record<string, SecurityScheme>> = {
  oauth2: {
    type: "oauth2",
    flows: {
      authorizationCode: {
        scopes: {
          "https://www.googleapis.com/auth/meetings.space.created":
            "Create, edit, and see information about your Google Meet conferences created by the app.",
          "https://www.googleapis.com/auth/meetings.space.readonly":
            "Read information about any of your Google Meet conferences",
          "https://www.googleapis.com/auth/meetings.space.settings":
            "Edit, and see settings for all of your Google Meet calls.",
        },
      },
    },
  },
}
