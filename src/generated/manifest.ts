// GENERATED. DO NOT EDIT.
// Source: spec/google/*.json, verified by provenance.json
// Run: pnpm generate

import type { ManifestOperation } from "@wirecat/cli-base/codegen"

export const operations: readonly ManifestOperation[] = [
  {
    id: "calendar.acl.delete",
    command: "calendar-acl-delete",
    binding: {
      kind: "http",
      method: "DELETE",
      path: "calendars/{calendarId}/acl/{ruleId}",
    },
    effect: "destructive",
    summary: "Deletes an access control rule.",
    description: "Deletes an access control rule.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "ruleId",
        in: "path",
        required: true,
        description: "ACL rule identifier.",
        schema: {
          description: "ACL rule identifier.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
  },
  {
    id: "calendar.acl.get",
    command: "calendar-acl-get",
    binding: {
      kind: "http",
      method: "GET",
      path: "calendars/{calendarId}/acl/{ruleId}",
    },
    effect: "read",
    summary: "Returns an access control rule.",
    description: "Returns an access control rule.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
      {
        name: "ruleId",
        in: "path",
        required: true,
        description: "ACL rule identifier.",
        schema: {
          description: "ACL rule identifier.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarAclRule",
    },
  },
  {
    id: "calendar.acl.insert",
    command: "calendar-acl-insert",
    binding: {
      kind: "http",
      method: "POST",
      path: "calendars/{calendarId}/acl",
    },
    effect: "write",
    summary: "Creates an access control rule.",
    description: "Creates an access control rule.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "sendNotifications",
        in: "query",
        required: false,
        description: "Whether to send notifications about the calendar sharing change. Optional. The default is True.",
        schema: {
          description:
            "Whether to send notifications about the calendar sharing change. Optional. The default is True.",
          type: "boolean",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarAclRule",
    },
    response: {
      confidence: "contract",
      schema: "CalendarAclRule",
    },
  },
  {
    id: "calendar.acl.list",
    command: "calendar-acl-list",
    binding: {
      kind: "http",
      method: "GET",
      path: "calendars/{calendarId}/acl",
    },
    effect: "read",
    summary: "Returns the rules in the access control list for the calendar.",
    description: "Returns the rules in the access control list for the calendar.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "maxResults",
        in: "query",
        required: false,
        description:
          "Maximum number of entries returned on one result page. By default the value is 100 entries. The page size can never be larger than 250 entries. Optional.",
        schema: {
          description:
            "Maximum number of entries returned on one result page. By default the value is 100 entries. The page size can never be larger than 250 entries. Optional.",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
      {
        name: "showDeleted",
        in: "query",
        required: false,
        description:
          'Whether to include deleted ACLs in the result. Deleted ACLs are represented by role equal to "none". Deleted ACLs will always be included if syncToken is provided. Optional. The default is False.',
        schema: {
          description:
            'Whether to include deleted ACLs in the result. Deleted ACLs are represented by role equal to "none". Deleted ACLs will always be included if syncToken is provided. Optional. The default is False.',
          type: "boolean",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
      {
        name: "syncToken",
        in: "query",
        required: false,
        description:
          "Token obtained from the nextSyncToken field returned on the last page of results from the previous list request. It makes the result of this list request contain only entries that have changed since then. All entries deleted since the previous list request will always be in the result set and it is not allowed to set showDeleted to False.\nIf the syncToken expires, the server will respond with a 410 GONE response code and the client should clear its storage and perform a full synchronization without any syncToken.\nLearn more about incremental synchronization.\nOptional. The default is to return all entries.",
        schema: {
          description:
            "Token obtained from the nextSyncToken field returned on the last page of results from the previous list request. It makes the result of this list request contain only entries that have changed since then. All entries deleted since the previous list request will always be in the result set and it is not allowed to set showDeleted to False.\nIf the syncToken expires, the server will respond with a 410 GONE response code and the client should clear its storage and perform a full synchronization without any syncToken.\nLearn more about incremental synchronization.\nOptional. The default is to return all entries.",
          type: "string",
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Token specifying which result page to return. Optional.",
        schema: {
          description: "Token specifying which result page to return. Optional.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarAcl",
    },
  },
  {
    id: "calendar.acl.patch",
    command: "calendar-acl-patch",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "calendars/{calendarId}/acl/{ruleId}",
    },
    effect: "write",
    summary: "Updates an access control rule. This method supports patch semantics.",
    description: "Updates an access control rule. This method supports patch semantics.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
      {
        name: "ruleId",
        in: "path",
        required: true,
        description: "ACL rule identifier.",
        schema: {
          description: "ACL rule identifier.",
          type: "string",
        },
      },
      {
        name: "sendNotifications",
        in: "query",
        required: false,
        description:
          "Whether to send notifications about the calendar sharing change. Note that there are no notifications on access removal. Optional. The default is True.",
        schema: {
          description:
            "Whether to send notifications about the calendar sharing change. Note that there are no notifications on access removal. Optional. The default is True.",
          type: "boolean",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarAclRule",
    },
    response: {
      confidence: "contract",
      schema: "CalendarAclRule",
    },
  },
  {
    id: "calendar.acl.update",
    command: "calendar-acl-update",
    binding: {
      kind: "http",
      method: "PUT",
      path: "calendars/{calendarId}/acl/{ruleId}",
    },
    effect: "write",
    summary: "Updates an access control rule.",
    description: "Updates an access control rule.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "ruleId",
        in: "path",
        required: true,
        description: "ACL rule identifier.",
        schema: {
          description: "ACL rule identifier.",
          type: "string",
        },
      },
      {
        name: "sendNotifications",
        in: "query",
        required: false,
        description:
          "Whether to send notifications about the calendar sharing change. Note that there are no notifications on access removal. Optional. The default is True.",
        schema: {
          description:
            "Whether to send notifications about the calendar sharing change. Note that there are no notifications on access removal. Optional. The default is True.",
          type: "boolean",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarAclRule",
    },
    response: {
      confidence: "contract",
      schema: "CalendarAclRule",
    },
  },
  {
    id: "calendar.calendarList.delete",
    command: "calendar-calendar-list-delete",
    binding: {
      kind: "http",
      method: "DELETE",
      path: "users/me/calendarList/{calendarId}",
    },
    effect: "destructive",
    summary: "Removes a calendar from the user's calendar list.",
    description: "Removes a calendar from the user's calendar list.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
  },
  {
    id: "calendar.calendarList.get",
    command: "calendar-calendar-list-get",
    binding: {
      kind: "http",
      method: "GET",
      path: "users/me/calendarList/{calendarId}",
    },
    effect: "read",
    summary: "Returns a calendar from the user's calendar list.",
    description: "Returns a calendar from the user's calendar list.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarCalendarListEntry",
    },
  },
  {
    id: "calendar.calendarList.insert",
    command: "calendar-calendar-list-insert",
    binding: {
      kind: "http",
      method: "POST",
      path: "users/me/calendarList",
    },
    effect: "write",
    summary: "Inserts an existing calendar into the user's calendar list.",
    description: "Inserts an existing calendar into the user's calendar list.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "colorRgbFormat",
        in: "query",
        required: false,
        description:
          "Whether to use the foregroundColor and backgroundColor fields to write the calendar colors (RGB). If this feature is used, the index-based colorId field will be set to the best matching option automatically. Optional. The default is False.",
        schema: {
          description:
            "Whether to use the foregroundColor and backgroundColor fields to write the calendar colors (RGB). If this feature is used, the index-based colorId field will be set to the best matching option automatically. Optional. The default is False.",
          type: "boolean",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarCalendarListEntry",
    },
    response: {
      confidence: "contract",
      schema: "CalendarCalendarListEntry",
    },
  },
  {
    id: "calendar.calendarList.list",
    command: "calendar-calendar-list-list",
    binding: {
      kind: "http",
      method: "GET",
      path: "users/me/calendarList",
    },
    effect: "read",
    summary: "Returns the calendars on the user's calendar list.",
    description: "Returns the calendars on the user's calendar list.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "showHidden",
        in: "query",
        required: false,
        description: "Whether to show hidden entries. Optional. The default is False.",
        schema: {
          description: "Whether to show hidden entries. Optional. The default is False.",
          type: "boolean",
        },
      },
      {
        name: "showOwnOrganizationOnly",
        in: "query",
        required: false,
        description:
          "Whether to show only entries for calendars from the organization. This parameter is only applicable to Google Workspace users. Optional. The default is False.",
        schema: {
          description:
            "Whether to show only entries for calendars from the organization. This parameter is only applicable to Google Workspace users. Optional. The default is False.",
          type: "boolean",
        },
      },
      {
        name: "minAccessRole",
        in: "query",
        required: false,
        description:
          "The minimum access role for the user in the returned entries. Optional. The default is no restriction.",
        schema: {
          description:
            "The minimum access role for the user in the returned entries. Optional. The default is no restriction.",
          type: "string",
          enum: ["freeBusyReader", "owner", "reader", "writer", "writerWithoutPrivateAccess"],
        },
      },
      {
        name: "syncToken",
        in: "query",
        required: false,
        description:
          "Token obtained from the nextSyncToken field returned on the last page of results from the previous list request. It makes the result of this list request contain only entries that have changed since then. If only read-only fields such as calendar properties or ACLs have changed, the entry won't be returned. All entries deleted and hidden since the previous list request will always be in the result set and it is not allowed to set showDeleted neither showHidden to False.\nTo ensure client state consistency minAccessRole and showOwnOrganizationOnly query parameters cannot be specified together with nextSyncToken.\nIf the syncToken expires, the server will respond with a 410 GONE response code and the client should clear its storage and perform a full synchronization without any syncToken.\nLearn more about incremental synchronization.\nOptional. The default is to return all entries.",
        schema: {
          description:
            "Token obtained from the nextSyncToken field returned on the last page of results from the previous list request. It makes the result of this list request contain only entries that have changed since then. If only read-only fields such as calendar properties or ACLs have changed, the entry won't be returned. All entries deleted and hidden since the previous list request will always be in the result set and it is not allowed to set showDeleted neither showHidden to False.\nTo ensure client state consistency minAccessRole and showOwnOrganizationOnly query parameters cannot be specified together with nextSyncToken.\nIf the syncToken expires, the server will respond with a 410 GONE response code and the client should clear its storage and perform a full synchronization without any syncToken.\nLearn more about incremental synchronization.\nOptional. The default is to return all entries.",
          type: "string",
        },
      },
      {
        name: "maxResults",
        in: "query",
        required: false,
        description:
          "Maximum number of entries returned on one result page. By default the value is 100 entries. The page size can never be larger than 250 entries. Optional.",
        schema: {
          description:
            "Maximum number of entries returned on one result page. By default the value is 100 entries. The page size can never be larger than 250 entries. Optional.",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Token specifying which result page to return. Optional.",
        schema: {
          description: "Token specifying which result page to return. Optional.",
          type: "string",
        },
      },
      {
        name: "showDeleted",
        in: "query",
        required: false,
        description: "Whether to include deleted calendar list entries in the result. Optional. The default is False.",
        schema: {
          description:
            "Whether to include deleted calendar list entries in the result. Optional. The default is False.",
          type: "boolean",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarCalendarList",
    },
  },
  {
    id: "calendar.calendarList.patch",
    command: "calendar-calendar-list-patch",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "users/me/calendarList/{calendarId}",
    },
    effect: "write",
    summary: "Updates an existing calendar on the user's calendar list. This method supports patch semantics.",
    description: "Updates an existing calendar on the user's calendar list. This method supports patch semantics.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
      {
        name: "colorRgbFormat",
        in: "query",
        required: false,
        description:
          "Whether to use the foregroundColor and backgroundColor fields to write the calendar colors (RGB). If this feature is used, the index-based colorId field will be set to the best matching option automatically. Optional. The default is False.",
        schema: {
          description:
            "Whether to use the foregroundColor and backgroundColor fields to write the calendar colors (RGB). If this feature is used, the index-based colorId field will be set to the best matching option automatically. Optional. The default is False.",
          type: "boolean",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarCalendarListEntry",
    },
    response: {
      confidence: "contract",
      schema: "CalendarCalendarListEntry",
    },
  },
  {
    id: "calendar.calendarList.update",
    command: "calendar-calendar-list-update",
    binding: {
      kind: "http",
      method: "PUT",
      path: "users/me/calendarList/{calendarId}",
    },
    effect: "write",
    summary: "Updates an existing calendar on the user's calendar list.",
    description: "Updates an existing calendar on the user's calendar list.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "colorRgbFormat",
        in: "query",
        required: false,
        description:
          "Whether to use the foregroundColor and backgroundColor fields to write the calendar colors (RGB). If this feature is used, the index-based colorId field will be set to the best matching option automatically. Optional. The default is False.",
        schema: {
          description:
            "Whether to use the foregroundColor and backgroundColor fields to write the calendar colors (RGB). If this feature is used, the index-based colorId field will be set to the best matching option automatically. Optional. The default is False.",
          type: "boolean",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarCalendarListEntry",
    },
    response: {
      confidence: "contract",
      schema: "CalendarCalendarListEntry",
    },
  },
  {
    id: "calendar.calendars.clear",
    command: "calendar-calendars-clear",
    binding: {
      kind: "http",
      method: "POST",
      path: "calendars/{calendarId}/clear",
    },
    effect: "destructive",
    summary:
      "Clears a primary calendar. This operation deletes all events associated with the primary calendar of an account.",
    description:
      "Clears a primary calendar. This operation deletes all events associated with the primary calendar of an account.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
  },
  {
    id: "calendar.calendars.delete",
    command: "calendar-calendars-delete",
    binding: {
      kind: "http",
      method: "DELETE",
      path: "calendars/{calendarId}",
    },
    effect: "destructive",
    summary: "Deletes a secondary calendar. Use calendars.clear for clearing all events on primary calendars.",
    description: "Deletes a secondary calendar. Use calendars.clear for clearing all events on primary calendars.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
  },
  {
    id: "calendar.calendars.get",
    command: "calendar-calendars-get",
    binding: {
      kind: "http",
      method: "GET",
      path: "calendars/{calendarId}",
    },
    effect: "read",
    summary: "Returns metadata for a calendar.",
    description: "Returns metadata for a calendar.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarCalendar",
    },
  },
  {
    id: "calendar.calendars.insert",
    command: "calendar-calendars-insert",
    binding: {
      kind: "http",
      method: "POST",
      path: "calendars",
    },
    effect: "write",
    summary: "Creates a secondary calendar.",
    description:
      "Creates a secondary calendar.\nThe authenticated user for the request is made the data owner of the new calendar.\n\nNote: We recommend to authenticate as the intended data owner of the calendar. You can use domain-wide delegation of authority to allow applications to act on behalf of a specific user. Don't use a service account for authentication. If you use a service account for authentication, the service account is the data owner, which can lead to unexpected behavior. For example, if a service account is the data owner, data ownership cannot be transferred.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarCalendar",
    },
    response: {
      confidence: "contract",
      schema: "CalendarCalendar",
    },
  },
  {
    id: "calendar.calendars.patch",
    command: "calendar-calendars-patch",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "calendars/{calendarId}",
    },
    effect: "write",
    summary: "Updates metadata for a calendar. This method supports patch semantics.",
    description: "Updates metadata for a calendar. This method supports patch semantics.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarCalendar",
    },
    response: {
      confidence: "contract",
      schema: "CalendarCalendar",
    },
  },
  {
    id: "calendar.calendars.transferOwnership",
    command: "calendar-calendars-transfer-ownership",
    binding: {
      kind: "http",
      method: "POST",
      path: "calendars/{calendarId}/transferOwnership",
    },
    effect: "destructive",
    summary:
      "Transfers a secondary calendar between users within a Google Workspace organization. Requires user authentication with Manage Calendars administrator privilege, and one of the following authorization scopes: ",
    description:
      "Transfers a secondary calendar between users within a Google Workspace organization. Requires user authentication with Manage Calendars administrator privilege, and one of the following authorization scopes: \n- https://www.googleapis.com/auth/calendar \n- https://www.googleapis.com/auth/calendar.calendars In the request, set useAdminAccess to true. The secondary calendar must be active to be transferred. Transferring disabled or deleted calendars isn't supported.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "useAdminAccess",
        in: "query",
        required: true,
        description:
          "When true, the method runs using the user's Google Workspace administrator privileges. The calling user must be a Google Workspace administrator with the Manage Calendars privilege. This method currently only supports admin access, thus only true is accepted for this field.",
        schema: {
          description:
            "When true, the method runs using the user's Google Workspace administrator privileges. The calling user must be a Google Workspace administrator with the Manage Calendars privilege. This method currently only supports admin access, thus only true is accepted for this field.",
          type: "boolean",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description: "Calendar identifier. To retrieve calendar IDs, call the calendarList.list method.",
        schema: {
          description: "Calendar identifier. To retrieve calendar IDs, call the calendarList.list method.",
          type: "string",
        },
      },
      {
        name: "newDataOwner",
        in: "query",
        required: true,
        description: "The email address of a user who will become the data owner of the calendar.",
        schema: {
          description: "The email address of a user who will become the data owner of the calendar.",
          type: "string",
        },
      },
    ],
  },
  {
    id: "calendar.calendars.update",
    command: "calendar-calendars-update",
    binding: {
      kind: "http",
      method: "PUT",
      path: "calendars/{calendarId}",
    },
    effect: "write",
    summary: "Updates metadata for a calendar.",
    description: "Updates metadata for a calendar.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarCalendar",
    },
    response: {
      confidence: "contract",
      schema: "CalendarCalendar",
    },
  },
  {
    id: "calendar.colors.get",
    command: "calendar-colors-get",
    binding: {
      kind: "http",
      method: "GET",
      path: "colors",
    },
    effect: "read",
    summary: "Returns the color definitions for calendars and events.",
    description: "Returns the color definitions for calendars and events.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarColors",
    },
  },
  {
    id: "calendar.events.delete",
    command: "calendar-events-delete",
    binding: {
      kind: "http",
      method: "DELETE",
      path: "calendars/{calendarId}/events/{eventId}",
    },
    effect: "destructive",
    summary: "Deletes an event.",
    description: "Deletes an event.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "sendUpdates",
        in: "query",
        required: false,
        description: "Guests who should receive notifications about the deletion of the event.",
        schema: {
          description: "Guests who should receive notifications about the deletion of the event.",
          type: "string",
          enum: ["all", "externalOnly", "none"],
        },
      },
      {
        name: "eventId",
        in: "path",
        required: true,
        description: "Event identifier.",
        schema: {
          description: "Event identifier.",
          type: "string",
        },
      },
      {
        name: "sendNotifications",
        in: "query",
        required: false,
        description:
          "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the deletion of the event. Note that some emails might still be sent even if you set the value to false. The default is false.",
        schema: {
          description:
            "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the deletion of the event. Note that some emails might still be sent even if you set the value to false. The default is false.",
          type: "boolean",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
  },
  {
    id: "calendar.events.get",
    command: "calendar-events-get",
    binding: {
      kind: "http",
      method: "GET",
      path: "calendars/{calendarId}/events/{eventId}",
    },
    effect: "read",
    summary:
      "Returns an event based on its Google Calendar ID. To retrieve an event using its iCalendar ID, call the events.list method using the iCalUID parameter.",
    description:
      "Returns an event based on its Google Calendar ID. To retrieve an event using its iCalendar ID, call the events.list method using the iCalUID parameter.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "timeZone",
        in: "query",
        required: false,
        description: "Time zone used in the response. Optional. The default is the time zone of the calendar.",
        schema: {
          description: "Time zone used in the response. Optional. The default is the time zone of the calendar.",
          type: "string",
        },
      },
      {
        name: "alwaysIncludeEmail",
        in: "query",
        required: false,
        description:
          "Deprecated and ignored. A value will always be returned in the email field for the organizer, creator and attendees, even if no real email address is available (i.e. a generated, non-working value will be provided).",
        schema: {
          description:
            "Deprecated and ignored. A value will always be returned in the email field for the organizer, creator and attendees, even if no real email address is available (i.e. a generated, non-working value will be provided).",
          type: "boolean",
        },
      },
      {
        name: "eventId",
        in: "path",
        required: true,
        description: "Event identifier.",
        schema: {
          description: "Event identifier.",
          type: "string",
        },
      },
      {
        name: "maxAttendees",
        in: "query",
        required: false,
        description:
          "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
        schema: {
          description:
            "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarEvent",
    },
  },
  {
    id: "calendar.events.import",
    command: "calendar-events-import",
    binding: {
      kind: "http",
      method: "POST",
      path: "calendars/{calendarId}/events/import",
    },
    effect: "write",
    summary:
      "Imports an event. This operation is used to add a private copy of an existing event to a calendar. Only events with an eventType of default may be imported.",
    description:
      "Imports an event. This operation is used to add a private copy of an existing event to a calendar. Only events with an eventType of default may be imported.\nDeprecated behavior: If a non-default event is imported, its type will be changed to default and any event-type-specific properties it may have will be dropped.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "supportsAttachments",
        in: "query",
        required: false,
        description:
          "Whether API client performing operation supports event attachments. Optional. The default is False.",
        schema: {
          description:
            "Whether API client performing operation supports event attachments. Optional. The default is False.",
          type: "boolean",
        },
      },
      {
        name: "eventLabelVersion",
        in: "query",
        required: false,
        description:
          "Version number of the event label feature supported by the API client. Version 0 assumes no event label support and processes the colorId field for color management. Version 1 enables support for event labels, and processes the eventLabelId in the event's body. In this case, the colorId field is ignored. The default is 0.",
        schema: {
          description:
            "Version number of the event label feature supported by the API client. Version 0 assumes no event label support and processes the colorId field for color management. Version 1 enables support for event labels, and processes the eventLabelId in the event's body. In this case, the colorId field is ignored. The default is 0.",
          type: "integer",
          format: "int32",
          minimum: 0,
          maximum: 1,
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
      {
        name: "conferenceDataVersion",
        in: "query",
        required: false,
        description:
          "Version number of conference data supported by the API client. Version 0 assumes no conference data support and ignores conference data in the event's body. Version 1 enables support for copying of ConferenceData as well as for creating new conferences using the createRequest field of conferenceData. The default is 0.",
        schema: {
          description:
            "Version number of conference data supported by the API client. Version 0 assumes no conference data support and ignores conference data in the event's body. Version 1 enables support for copying of ConferenceData as well as for creating new conferences using the createRequest field of conferenceData. The default is 0.",
          type: "integer",
          format: "int32",
          minimum: 0,
          maximum: 1,
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarEvent",
    },
    response: {
      confidence: "contract",
      schema: "CalendarEvent",
    },
  },
  {
    id: "calendar.events.insert",
    command: "calendar-events-insert",
    binding: {
      kind: "http",
      method: "POST",
      path: "calendars/{calendarId}/events",
    },
    effect: "write",
    summary: "Creates an event.",
    description: "Creates an event.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "supportsAttachments",
        in: "query",
        required: false,
        description:
          "Whether API client performing operation supports event attachments. Optional. The default is False.",
        schema: {
          description:
            "Whether API client performing operation supports event attachments. Optional. The default is False.",
          type: "boolean",
        },
      },
      {
        name: "sendNotifications",
        in: "query",
        required: false,
        description:
          "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the creation of the new event. Note that some emails might still be sent even if you set the value to false. The default is false.",
        schema: {
          description:
            "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the creation of the new event. Note that some emails might still be sent even if you set the value to false. The default is false.",
          type: "boolean",
        },
      },
      {
        name: "maxAttendees",
        in: "query",
        required: false,
        description:
          "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
        schema: {
          description:
            "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
      {
        name: "eventLabelVersion",
        in: "query",
        required: false,
        description:
          "Version number of the event label feature supported by the API client. Version 0 assumes no event label support and processes the colorId field for color management. Version 1 enables support for event labels, and processes the eventLabelId in the event's body. In this case, the colorId field is ignored. The default is 0.",
        schema: {
          description:
            "Version number of the event label feature supported by the API client. Version 0 assumes no event label support and processes the colorId field for color management. Version 1 enables support for event labels, and processes the eventLabelId in the event's body. In this case, the colorId field is ignored. The default is 0.",
          type: "integer",
          format: "int32",
          minimum: 0,
          maximum: 1,
        },
      },
      {
        name: "conferenceDataVersion",
        in: "query",
        required: false,
        description:
          "Version number of conference data supported by the API client. Version 0 assumes no conference data support and ignores conference data in the event's body. Version 1 enables support for copying of ConferenceData as well as for creating new conferences using the createRequest field of conferenceData. The default is 0.",
        schema: {
          description:
            "Version number of conference data supported by the API client. Version 0 assumes no conference data support and ignores conference data in the event's body. Version 1 enables support for copying of ConferenceData as well as for creating new conferences using the createRequest field of conferenceData. The default is 0.",
          type: "integer",
          format: "int32",
          minimum: 0,
          maximum: 1,
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
      {
        name: "sendUpdates",
        in: "query",
        required: false,
        description:
          "Whether to send notifications about the creation of the new event. Note that some emails might still be sent. The default is false.",
        schema: {
          description:
            "Whether to send notifications about the creation of the new event. Note that some emails might still be sent. The default is false.",
          type: "string",
          enum: ["all", "externalOnly", "none"],
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarEvent",
    },
    response: {
      confidence: "contract",
      schema: "CalendarEvent",
    },
  },
  {
    id: "calendar.events.instances",
    command: "calendar-events-instances",
    binding: {
      kind: "http",
      method: "GET",
      path: "calendars/{calendarId}/events/{eventId}/instances",
    },
    effect: "read",
    summary: "Returns instances of the specified recurring event.",
    description: "Returns instances of the specified recurring event.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "eventId",
        in: "path",
        required: true,
        description: "Recurring event identifier.",
        schema: {
          description: "Recurring event identifier.",
          type: "string",
        },
      },
      {
        name: "timeMin",
        in: "query",
        required: false,
        description:
          "Lower bound (inclusive) for an event's end time to filter by. Optional. The default is not to filter by end time. Must be an RFC3339 timestamp with mandatory time zone offset.",
        schema: {
          description:
            "Lower bound (inclusive) for an event's end time to filter by. Optional. The default is not to filter by end time. Must be an RFC3339 timestamp with mandatory time zone offset.",
          type: "string",
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Token specifying which result page to return. Optional.",
        schema: {
          description: "Token specifying which result page to return. Optional.",
          type: "string",
        },
      },
      {
        name: "alwaysIncludeEmail",
        in: "query",
        required: false,
        description:
          "Deprecated and ignored. A value will always be returned in the email field for the organizer, creator and attendees, even if no real email address is available (i.e. a generated, non-working value will be provided).",
        schema: {
          description:
            "Deprecated and ignored. A value will always be returned in the email field for the organizer, creator and attendees, even if no real email address is available (i.e. a generated, non-working value will be provided).",
          type: "boolean",
        },
      },
      {
        name: "maxResults",
        in: "query",
        required: false,
        description:
          "Maximum number of events returned on one result page. By default the value is 250 events. The page size can never be larger than 2500 events. Optional.",
        schema: {
          description:
            "Maximum number of events returned on one result page. By default the value is 250 events. The page size can never be larger than 2500 events. Optional.",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
      {
        name: "maxAttendees",
        in: "query",
        required: false,
        description:
          "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
        schema: {
          description:
            "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
      {
        name: "showDeleted",
        in: "query",
        required: false,
        description:
          'Whether to include deleted events (with status equals "cancelled") in the result. Cancelled instances of recurring events will still be included if singleEvents is False. Optional. The default is False.',
        schema: {
          description:
            'Whether to include deleted events (with status equals "cancelled") in the result. Cancelled instances of recurring events will still be included if singleEvents is False. Optional. The default is False.',
          type: "boolean",
        },
      },
      {
        name: "timeZone",
        in: "query",
        required: false,
        description: "Time zone used in the response. Optional. The default is the time zone of the calendar.",
        schema: {
          description: "Time zone used in the response. Optional. The default is the time zone of the calendar.",
          type: "string",
        },
      },
      {
        name: "originalStart",
        in: "query",
        required: false,
        description: "The original start time of the instance in the result. Optional.",
        schema: {
          description: "The original start time of the instance in the result. Optional.",
          type: "string",
        },
      },
      {
        name: "timeMax",
        in: "query",
        required: false,
        description:
          "Upper bound (exclusive) for an event's start time to filter by. Optional. The default is not to filter by start time. Must be an RFC3339 timestamp with mandatory time zone offset.",
        schema: {
          description:
            "Upper bound (exclusive) for an event's start time to filter by. Optional. The default is not to filter by start time. Must be an RFC3339 timestamp with mandatory time zone offset.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarEvents",
    },
  },
  {
    id: "calendar.events.list",
    command: "calendar-events-list",
    binding: {
      kind: "http",
      method: "GET",
      path: "calendars/{calendarId}/events",
    },
    effect: "read",
    summary: "Returns events on the specified calendar.",
    description: "Returns events on the specified calendar.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "timeZone",
        in: "query",
        required: false,
        description: "Time zone used in the response. Optional. The default is the time zone of the calendar.",
        schema: {
          description: "Time zone used in the response. Optional. The default is the time zone of the calendar.",
          type: "string",
        },
      },
      {
        name: "timeMin",
        in: "query",
        required: false,
        description:
          "Lower bound (exclusive) for an event's end time to filter by. Optional. The default is not to filter by end time. Must be an RFC3339 timestamp with mandatory time zone offset, for example, 2011-06-03T10:00:00-07:00, 2011-06-03T10:00:00Z. Milliseconds may be provided but are ignored. If timeMax is set, timeMin must be smaller than timeMax.",
        schema: {
          description:
            "Lower bound (exclusive) for an event's end time to filter by. Optional. The default is not to filter by end time. Must be an RFC3339 timestamp with mandatory time zone offset, for example, 2011-06-03T10:00:00-07:00, 2011-06-03T10:00:00Z. Milliseconds may be provided but are ignored. If timeMax is set, timeMin must be smaller than timeMax.",
          type: "string",
        },
      },
      {
        name: "syncToken",
        in: "query",
        required: false,
        description:
          "Token obtained from the nextSyncToken field returned on the last page of results from the previous list request. It makes the result of this list request contain only entries that have changed since then. All events deleted since the previous list request will always be in the result set and it is not allowed to set showDeleted to False.\nThere are several query parameters that cannot be specified together with nextSyncToken to ensure consistency of the client state.\n\nThese are: \n- iCalUID \n- orderBy \n- privateExtendedProperty \n- q \n- sharedExtendedProperty \n- timeMin \n- timeMax \n- updatedMin All other query parameters should be the same as for the initial synchronization to avoid undefined behavior. If the syncToken expires, the server will respond with a 410 GONE response code and the client should clear its storage and perform a full synchronization without any syncToken.\nLearn more about incremental synchronization.\nOptional. The default is to return all entries.",
        schema: {
          description:
            "Token obtained from the nextSyncToken field returned on the last page of results from the previous list request. It makes the result of this list request contain only entries that have changed since then. All events deleted since the previous list request will always be in the result set and it is not allowed to set showDeleted to False.\nThere are several query parameters that cannot be specified together with nextSyncToken to ensure consistency of the client state.\n\nThese are: \n- iCalUID \n- orderBy \n- privateExtendedProperty \n- q \n- sharedExtendedProperty \n- timeMin \n- timeMax \n- updatedMin All other query parameters should be the same as for the initial synchronization to avoid undefined behavior. If the syncToken expires, the server will respond with a 410 GONE response code and the client should clear its storage and perform a full synchronization without any syncToken.\nLearn more about incremental synchronization.\nOptional. The default is to return all entries.",
          type: "string",
        },
      },
      {
        name: "maxAttendees",
        in: "query",
        required: false,
        description:
          "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
        schema: {
          description:
            "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
      {
        name: "showHiddenInvitations",
        in: "query",
        required: false,
        description: "Whether to include hidden invitations in the result. Optional. The default is False.",
        schema: {
          description: "Whether to include hidden invitations in the result. Optional. The default is False.",
          type: "boolean",
        },
      },
      {
        name: "eventTypes",
        in: "query",
        required: false,
        description:
          "Event types to return. Optional. This parameter can be repeated multiple times to return events of different types. If unset, returns all event types.",
        schema: {
          type: "array",
          items: {
            description:
              "Event types to return. Optional. This parameter can be repeated multiple times to return events of different types. If unset, returns all event types.",
            type: "string",
            enum: ["birthday", "default", "focusTime", "fromGmail", "outOfOffice", "workingLocation"],
          },
        },
      },
      {
        name: "timeMax",
        in: "query",
        required: false,
        description:
          "Upper bound (exclusive) for an event's start time to filter by. Optional. The default is not to filter by start time. Must be an RFC3339 timestamp with mandatory time zone offset, for example, 2011-06-03T10:00:00-07:00, 2011-06-03T10:00:00Z. Milliseconds may be provided but are ignored. If timeMin is set, timeMax must be greater than timeMin.",
        schema: {
          description:
            "Upper bound (exclusive) for an event's start time to filter by. Optional. The default is not to filter by start time. Must be an RFC3339 timestamp with mandatory time zone offset, for example, 2011-06-03T10:00:00-07:00, 2011-06-03T10:00:00Z. Milliseconds may be provided but are ignored. If timeMin is set, timeMax must be greater than timeMin.",
          type: "string",
        },
      },
      {
        name: "alwaysIncludeEmail",
        in: "query",
        required: false,
        description: "Deprecated and ignored.",
        schema: {
          description: "Deprecated and ignored.",
          type: "boolean",
        },
      },
      {
        name: "q",
        in: "query",
        required: false,
        description:
          'Free text search terms to find events that match these terms in the following fields:\n\n- summary \n- description \n- location \n- attendee\'s displayName \n- attendee\'s email \n- organizer\'s displayName \n- organizer\'s email \n- workingLocationProperties.officeLocation.buildingId \n- workingLocationProperties.officeLocation.deskId \n- workingLocationProperties.officeLocation.label \n- workingLocationProperties.customLocation.label \nThese search terms also match predefined keywords against all display title translations of working location, out-of-office, and focus-time events. For example, searching for "Office" or "Bureau" returns working location events of type officeLocation, whereas searching for "Out of office" or "Abwesend" returns out-of-office events. Optional.',
        schema: {
          description:
            'Free text search terms to find events that match these terms in the following fields:\n\n- summary \n- description \n- location \n- attendee\'s displayName \n- attendee\'s email \n- organizer\'s displayName \n- organizer\'s email \n- workingLocationProperties.officeLocation.buildingId \n- workingLocationProperties.officeLocation.deskId \n- workingLocationProperties.officeLocation.label \n- workingLocationProperties.customLocation.label \nThese search terms also match predefined keywords against all display title translations of working location, out-of-office, and focus-time events. For example, searching for "Office" or "Bureau" returns working location events of type officeLocation, whereas searching for "Out of office" or "Abwesend" returns out-of-office events. Optional.',
          type: "string",
        },
      },
      {
        name: "showDeleted",
        in: "query",
        required: false,
        description:
          'Whether to include deleted events (with status equals "cancelled") in the result. Cancelled instances of recurring events (but not the underlying recurring event) will still be included if showDeleted and singleEvents are both False. If showDeleted and singleEvents are both True, only single instances of deleted events (but not the underlying recurring events) are returned. Optional. The default is False.',
        schema: {
          description:
            'Whether to include deleted events (with status equals "cancelled") in the result. Cancelled instances of recurring events (but not the underlying recurring event) will still be included if showDeleted and singleEvents are both False. If showDeleted and singleEvents are both True, only single instances of deleted events (but not the underlying recurring events) are returned. Optional. The default is False.',
          type: "boolean",
        },
      },
      {
        name: "maxResults",
        in: "query",
        required: false,
        description:
          "Maximum number of events returned on one result page. The number of events in the resulting page may be less than this value, or none at all, even if there are more events matching the query. Incomplete pages can be detected by a non-empty nextPageToken field in the response. By default the value is 250 events. The page size can never be larger than 2500 events. Optional.",
        schema: {
          description:
            "Maximum number of events returned on one result page. The number of events in the resulting page may be less than this value, or none at all, even if there are more events matching the query. Incomplete pages can be detected by a non-empty nextPageToken field in the response. By default the value is 250 events. The page size can never be larger than 2500 events. Optional.",
          default: "250",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
      {
        name: "iCalUID",
        in: "query",
        required: false,
        description:
          "Specifies an event ID in the iCalendar format to be provided in the response. Optional. Use this if you want to search for an event by its iCalendar ID.",
        schema: {
          description:
            "Specifies an event ID in the iCalendar format to be provided in the response. Optional. Use this if you want to search for an event by its iCalendar ID.",
          type: "string",
        },
      },
      {
        name: "orderBy",
        in: "query",
        required: false,
        description:
          "The order of the events returned in the result. Optional. The default is an unspecified, stable order.",
        schema: {
          description:
            "The order of the events returned in the result. Optional. The default is an unspecified, stable order.",
          type: "string",
          enum: ["startTime", "updated"],
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
      {
        name: "updatedMin",
        in: "query",
        required: false,
        description:
          "Lower bound for an event's last modification time (as a RFC3339 timestamp) to filter by. When specified, entries deleted since this time will always be included regardless of showDeleted. Optional. The default is not to filter by last modification time.",
        schema: {
          description:
            "Lower bound for an event's last modification time (as a RFC3339 timestamp) to filter by. When specified, entries deleted since this time will always be included regardless of showDeleted. Optional. The default is not to filter by last modification time.",
          type: "string",
        },
      },
      {
        name: "sharedExtendedProperty",
        in: "query",
        required: false,
        description:
          "Extended properties constraint specified as propertyName=value. Matches only shared properties. This parameter might be repeated multiple times to return events that match all given constraints.",
        schema: {
          type: "array",
          items: {
            description:
              "Extended properties constraint specified as propertyName=value. Matches only shared properties. This parameter might be repeated multiple times to return events that match all given constraints.",
            type: "string",
          },
        },
      },
      {
        name: "singleEvents",
        in: "query",
        required: false,
        description:
          "Whether to expand recurring events into instances and only return single one-off events and instances of recurring events, but not the underlying recurring events themselves. Optional. The default is False.",
        schema: {
          description:
            "Whether to expand recurring events into instances and only return single one-off events and instances of recurring events, but not the underlying recurring events themselves. Optional. The default is False.",
          type: "boolean",
        },
      },
      {
        name: "privateExtendedProperty",
        in: "query",
        required: false,
        description:
          "Extended properties constraint specified as propertyName=value. Matches only private properties. This parameter might be repeated multiple times to return events that match all given constraints.",
        schema: {
          type: "array",
          items: {
            description:
              "Extended properties constraint specified as propertyName=value. Matches only private properties. This parameter might be repeated multiple times to return events that match all given constraints.",
            type: "string",
          },
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Token specifying which result page to return. Optional.",
        schema: {
          description: "Token specifying which result page to return. Optional.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarEvents",
    },
  },
  {
    id: "calendar.events.move",
    command: "calendar-events-move",
    binding: {
      kind: "http",
      method: "POST",
      path: "calendars/{calendarId}/events/{eventId}/move",
    },
    effect: "write",
    summary:
      "Moves an event to another calendar, i.e. changes an event's organizer. Note that only default events can be moved; birthday, focusTime, fromGmail, outOfOffice and workingLocation events cannot be moved.",
    description:
      "Moves an event to another calendar, i.e. changes an event's organizer. Note that only default events can be moved; birthday, focusTime, fromGmail, outOfOffice and workingLocation events cannot be moved.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "sendUpdates",
        in: "query",
        required: false,
        description: "Guests who should receive notifications about the change of the event's organizer.",
        schema: {
          description: "Guests who should receive notifications about the change of the event's organizer.",
          type: "string",
          enum: ["all", "externalOnly", "none"],
        },
      },
      {
        name: "sendNotifications",
        in: "query",
        required: false,
        description:
          "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the change of the event's organizer. Note that some emails might still be sent even if you set the value to false. The default is false.",
        schema: {
          description:
            "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the change of the event's organizer. Note that some emails might still be sent even if you set the value to false. The default is false.",
          type: "boolean",
        },
      },
      {
        name: "eventId",
        in: "path",
        required: true,
        description: "Event identifier.",
        schema: {
          description: "Event identifier.",
          type: "string",
        },
      },
      {
        name: "destination",
        in: "query",
        required: true,
        description: "Calendar identifier of the target calendar where the event is to be moved to.",
        schema: {
          description: "Calendar identifier of the target calendar where the event is to be moved to.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description: "Calendar identifier of the source calendar where the event currently is on.",
        schema: {
          description: "Calendar identifier of the source calendar where the event currently is on.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarEvent",
    },
  },
  {
    id: "calendar.events.patch",
    command: "calendar-events-patch",
    binding: {
      kind: "http",
      method: "PATCH",
      path: "calendars/{calendarId}/events/{eventId}",
    },
    effect: "write",
    summary: "Updates an event. This method supports patch semantics.",
    description: "Updates an event. This method supports patch semantics.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "maxAttendees",
        in: "query",
        required: false,
        description:
          "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
        schema: {
          description:
            "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
      {
        name: "sendUpdates",
        in: "query",
        required: false,
        description:
          "Guests who should receive notifications about the event update (for example, title changes, etc.).",
        schema: {
          description:
            "Guests who should receive notifications about the event update (for example, title changes, etc.).",
          type: "string",
          enum: ["all", "externalOnly", "none"],
        },
      },
      {
        name: "supportsAttachments",
        in: "query",
        required: false,
        description:
          "Whether API client performing operation supports event attachments. Optional. The default is False.",
        schema: {
          description:
            "Whether API client performing operation supports event attachments. Optional. The default is False.",
          type: "boolean",
        },
      },
      {
        name: "eventLabelVersion",
        in: "query",
        required: false,
        description:
          "Version number of the event label feature supported by the API client. Version 0 assumes no event label support and processes the colorId field for color management. Version 1 enables support for event labels, and processes the eventLabelId in the event's body. In this case, the colorId field is ignored. The default is 0.",
        schema: {
          description:
            "Version number of the event label feature supported by the API client. Version 0 assumes no event label support and processes the colorId field for color management. Version 1 enables support for event labels, and processes the eventLabelId in the event's body. In this case, the colorId field is ignored. The default is 0.",
          type: "integer",
          format: "int32",
          minimum: 0,
          maximum: 1,
        },
      },
      {
        name: "eventId",
        in: "path",
        required: true,
        description: "Event identifier.",
        schema: {
          description: "Event identifier.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
      {
        name: "alwaysIncludeEmail",
        in: "query",
        required: false,
        description:
          "Deprecated and ignored. A value will always be returned in the email field for the organizer, creator and attendees, even if no real email address is available (i.e. a generated, non-working value will be provided).",
        schema: {
          description:
            "Deprecated and ignored. A value will always be returned in the email field for the organizer, creator and attendees, even if no real email address is available (i.e. a generated, non-working value will be provided).",
          type: "boolean",
        },
      },
      {
        name: "sendNotifications",
        in: "query",
        required: false,
        description:
          "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the event update (for example, description changes, etc.). Note that some emails might still be sent even if you set the value to false. The default is false.",
        schema: {
          description:
            "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the event update (for example, description changes, etc.). Note that some emails might still be sent even if you set the value to false. The default is false.",
          type: "boolean",
        },
      },
      {
        name: "conferenceDataVersion",
        in: "query",
        required: false,
        description:
          "Version number of conference data supported by the API client. Version 0 assumes no conference data support and ignores conference data in the event's body. Version 1 enables support for copying of ConferenceData as well as for creating new conferences using the createRequest field of conferenceData. The default is 0.",
        schema: {
          description:
            "Version number of conference data supported by the API client. Version 0 assumes no conference data support and ignores conference data in the event's body. Version 1 enables support for copying of ConferenceData as well as for creating new conferences using the createRequest field of conferenceData. The default is 0.",
          type: "integer",
          format: "int32",
          minimum: 0,
          maximum: 1,
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarEvent",
    },
    response: {
      confidence: "contract",
      schema: "CalendarEvent",
    },
  },
  {
    id: "calendar.events.quickAdd",
    command: "calendar-events-quick-add",
    binding: {
      kind: "http",
      method: "POST",
      path: "calendars/{calendarId}/events/quickAdd",
    },
    effect: "write",
    summary: "Creates an event based on a simple text string.",
    description: "Creates an event based on a simple text string.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "sendUpdates",
        in: "query",
        required: false,
        description: "Guests who should receive notifications about the creation of the new event.",
        schema: {
          description: "Guests who should receive notifications about the creation of the new event.",
          type: "string",
          enum: ["all", "externalOnly", "none"],
        },
      },
      {
        name: "sendNotifications",
        in: "query",
        required: false,
        description:
          "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the creation of the event. Note that some emails might still be sent even if you set the value to false. The default is false.",
        schema: {
          description:
            "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the creation of the event. Note that some emails might still be sent even if you set the value to false. The default is false.",
          type: "boolean",
        },
      },
      {
        name: "text",
        in: "query",
        required: true,
        description: "The text describing the event to be created.",
        schema: {
          description: "The text describing the event to be created.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarEvent",
    },
  },
  {
    id: "calendar.events.update",
    command: "calendar-events-update",
    binding: {
      kind: "http",
      method: "PUT",
      path: "calendars/{calendarId}/events/{eventId}",
    },
    effect: "write",
    summary: "Updates an event.",
    description: "Updates an event.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "calendarId",
        in: "path",
        required: true,
        description:
          'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
        schema: {
          description:
            'Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.',
          type: "string",
        },
      },
      {
        name: "maxAttendees",
        in: "query",
        required: false,
        description:
          "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
        schema: {
          description:
            "The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
      {
        name: "supportsAttachments",
        in: "query",
        required: false,
        description:
          "Whether API client performing operation supports event attachments. Optional. The default is False.",
        schema: {
          description:
            "Whether API client performing operation supports event attachments. Optional. The default is False.",
          type: "boolean",
        },
      },
      {
        name: "eventId",
        in: "path",
        required: true,
        description: "Event identifier.",
        schema: {
          description: "Event identifier.",
          type: "string",
        },
      },
      {
        name: "sendNotifications",
        in: "query",
        required: false,
        description:
          "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the event update (for example, description changes, etc.). Note that some emails might still be sent even if you set the value to false. The default is false.",
        schema: {
          description:
            "Deprecated. Please use sendUpdates instead.\n\nWhether to send notifications about the event update (for example, description changes, etc.). Note that some emails might still be sent even if you set the value to false. The default is false.",
          type: "boolean",
        },
      },
      {
        name: "conferenceDataVersion",
        in: "query",
        required: false,
        description:
          "Version number of conference data supported by the API client. Version 0 assumes no conference data support and ignores conference data in the event's body. Version 1 enables support for copying of ConferenceData as well as for creating new conferences using the createRequest field of conferenceData. The default is 0.",
        schema: {
          description:
            "Version number of conference data supported by the API client. Version 0 assumes no conference data support and ignores conference data in the event's body. Version 1 enables support for copying of ConferenceData as well as for creating new conferences using the createRequest field of conferenceData. The default is 0.",
          type: "integer",
          format: "int32",
          minimum: 0,
          maximum: 1,
        },
      },
      {
        name: "sendUpdates",
        in: "query",
        required: false,
        description:
          "Guests who should receive notifications about the event update (for example, title changes, etc.).",
        schema: {
          description:
            "Guests who should receive notifications about the event update (for example, title changes, etc.).",
          type: "string",
          enum: ["all", "externalOnly", "none"],
        },
      },
      {
        name: "eventLabelVersion",
        in: "query",
        required: false,
        description:
          "Version number of the event label feature supported by the API client. Version 0 assumes no event label support and processes the colorId field for color management. Version 1 enables support for event labels, and processes the eventLabelId in the event's body. In this case, the colorId field is ignored. The default is 0.",
        schema: {
          description:
            "Version number of the event label feature supported by the API client. Version 0 assumes no event label support and processes the colorId field for color management. Version 1 enables support for event labels, and processes the eventLabelId in the event's body. In this case, the colorId field is ignored. The default is 0.",
          type: "integer",
          format: "int32",
          minimum: 0,
          maximum: 1,
        },
      },
      {
        name: "alwaysIncludeEmail",
        in: "query",
        required: false,
        description:
          "Deprecated and ignored. A value will always be returned in the email field for the organizer, creator and attendees, even if no real email address is available (i.e. a generated, non-working value will be provided).",
        schema: {
          description:
            "Deprecated and ignored. A value will always be returned in the email field for the organizer, creator and attendees, even if no real email address is available (i.e. a generated, non-working value will be provided).",
          type: "boolean",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarEvent",
    },
    response: {
      confidence: "contract",
      schema: "CalendarEvent",
    },
  },
  {
    id: "calendar.freebusy.query",
    command: "calendar-freebusy-query",
    binding: {
      kind: "http",
      method: "POST",
      path: "freeBusy",
    },
    effect: "read",
    summary: "Returns free/busy information for a set of calendars.",
    description: "Returns free/busy information for a set of calendars.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
    ],
    request: {
      required: false,
      confidence: "contract",
      schema: "CalendarFreeBusyRequest",
    },
    response: {
      confidence: "contract",
      schema: "CalendarFreeBusyResponse",
    },
  },
  {
    id: "calendar.settings.get",
    command: "calendar-settings-get",
    binding: {
      kind: "http",
      method: "GET",
      path: "users/me/settings/{setting}",
    },
    effect: "read",
    summary: "Returns a single user setting.",
    description: "Returns a single user setting.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "setting",
        in: "path",
        required: true,
        description: "The id of the user setting.",
        schema: {
          description: "The id of the user setting.",
          type: "string",
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarSetting",
    },
  },
  {
    id: "calendar.settings.list",
    command: "calendar-settings-list",
    binding: {
      kind: "http",
      method: "GET",
      path: "users/me/settings",
    },
    effect: "read",
    summary: "Returns all user settings for the authenticated user.",
    description: "Returns all user settings for the authenticated user.",
    tags: ["calendar"],
    parameters: [
      {
        name: "alt",
        in: "query",
        required: false,
        description: "Data format for the response.",
        schema: {
          description: "Data format for the response.",
          default: "json",
          type: "string",
          enum: ["json"],
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
        name: "userIp",
        in: "query",
        required: false,
        description: "Deprecated. Please use quotaUser instead.",
        schema: {
          description: "Deprecated. Please use quotaUser instead.",
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
        description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
        schema: {
          description: "An opaque string that represents a user for quota purposes. Must not exceed 40 characters.",
          type: "string",
        },
      },
      {
        name: "pageToken",
        in: "query",
        required: false,
        description: "Token specifying which result page to return. Optional.",
        schema: {
          description: "Token specifying which result page to return. Optional.",
          type: "string",
        },
      },
      {
        name: "syncToken",
        in: "query",
        required: false,
        description:
          "Token obtained from the nextSyncToken field returned on the last page of results from the previous list request. It makes the result of this list request contain only entries that have changed since then.\nIf the syncToken expires, the server will respond with a 410 GONE response code and the client should clear its storage and perform a full synchronization without any syncToken.\nLearn more about incremental synchronization.\nOptional. The default is to return all entries.",
        schema: {
          description:
            "Token obtained from the nextSyncToken field returned on the last page of results from the previous list request. It makes the result of this list request contain only entries that have changed since then.\nIf the syncToken expires, the server will respond with a 410 GONE response code and the client should clear its storage and perform a full synchronization without any syncToken.\nLearn more about incremental synchronization.\nOptional. The default is to return all entries.",
          type: "string",
        },
      },
      {
        name: "maxResults",
        in: "query",
        required: false,
        description:
          "Maximum number of entries returned on one result page. By default the value is 100 entries. The page size can never be larger than 250 entries. Optional.",
        schema: {
          description:
            "Maximum number of entries returned on one result page. By default the value is 100 entries. The page size can never be larger than 250 entries. Optional.",
          type: "integer",
          format: "int32",
          minimum: 1,
        },
      },
    ],
    response: {
      confidence: "contract",
      schema: "CalendarSettings",
    },
  },
]
