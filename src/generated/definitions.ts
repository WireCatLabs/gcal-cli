// GENERATED. DO NOT EDIT.
// Source: spec/google/*.json, verified by provenance.json
// Run: pnpm generate

import type { SchemaNode } from "@wirecat/cli-base/codegen"

export const definitions: Readonly<Record<string, SchemaNode>> = {
  CalendarLabelProperties: {
    type: "object",
    properties: {
      eventLabels: {
        description:
          "Event labels defined on this calendar. If this is present when updating the calendar, it will replace the existing event labels.\nExtend the list to add a new event label, and remove entities from the list to delete a label from calendar.\nEach calendar can have a maximum of 200 labels.",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_EventLabel",
        },
      },
    },
    required: [],
  },
  CalendarFreeBusyGroup: {
    type: "object",
    properties: {
      calendars: {
        description: "List of calendars' identifiers within a group.",
        type: "array",
        items: {
          type: "string",
        },
      },
      errors: {
        description: "Optional error(s) (if computation for the group failed).",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_Error",
        },
      },
    },
    required: [],
  },
  CalendarEventOutOfOfficeProperties: {
    type: "object",
    properties: {
      autoDeclineMode: {
        description:
          "Whether to decline meeting invitations which overlap Out of office events. Valid values are declineNone, meaning that no meeting invitations are declined; declineAllConflictingInvitations, meaning that all conflicting meeting invitations that conflict with the event are declined; and declineOnlyNewConflictingInvitations, meaning that only new conflicting meeting invitations which arrive while the Out of office event is present are to be declined.",
        type: "string",
      },
      declineMessage: {
        description:
          "Response message to set if an existing event or new invitation is automatically declined by Calendar.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarEventWorkingLocationProperties: {
    type: "object",
    properties: {
      type: {
        description:
          'Type of the working location. Possible values are:  \n- "homeOffice" - The user is working at home. \n- "officeLocation" - The user is working from an office. \n- "customLocation" - The user is working from a custom location.  Any details are specified in a sub-field of the specified name, but this field may be missing if empty. Any other fields are ignored.\nRequired when adding working location properties.',
        type: "string",
      },
      officeLocation: {
        description: "If present, specifies that the user is working from an office.",
        type: "object",
        properties: {
          label: {
            description:
              "The office name that's displayed in Calendar Web and Mobile clients. We recommend you reference a building name in the organization's Resources database.",
            type: "string",
          },
          deskId: {
            description: "An optional desk identifier.",
            type: "string",
          },
          buildingId: {
            description:
              "An optional building identifier. This should reference a building ID in the organization's Resources database.",
            type: "string",
          },
          floorSectionId: {
            description: "An optional floor section identifier.",
            type: "string",
          },
          floorId: {
            description: "An optional floor identifier.",
            type: "string",
          },
        },
        required: [],
      },
      customLocation: {
        description: "If present, specifies that the user is working from a custom location.",
        type: "object",
        properties: {
          label: {
            description: "An optional extra label for additional information.",
            type: "string",
          },
        },
        required: [],
      },
      homeOffice: {
        description: "If present, specifies that the user is working at home.",
        type: "unknown",
      },
    },
    required: [],
  },
  CalendarFreeBusyResponse: {
    type: "object",
    properties: {
      calendars: {
        description: "List of free/busy information for calendars.",
        type: "object",
        properties: {},
        required: [],
        additionalProperties: {
          description: "Free/busy expansions for a single calendar.",
          type: "ref",
          ref: "calendar_FreeBusyCalendar",
        },
      },
      groups: {
        description: "Expansion of groups.",
        type: "object",
        properties: {},
        required: [],
        additionalProperties: {
          description: "List of calendars that are members of this group.",
          type: "ref",
          ref: "calendar_FreeBusyGroup",
        },
      },
      timeMin: {
        description: "The start of the interval.",
        type: "string",
      },
      kind: {
        description: 'Type of the resource ("calendar#freeBusy").',
        default: "calendar#freeBusy",
        type: "string",
      },
      timeMax: {
        description: "The end of the interval.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarConferenceData: {
    type: "object",
    properties: {
      conferenceSolution: {
        description:
          "The conference solution, such as Google Meet.\nUnset for a conference with a failed create request.\nEither conferenceSolution and at least one entryPoint, or createRequest is required.",
        type: "ref",
        ref: "calendar_ConferenceSolution",
      },
      notes: {
        description:
          "Additional notes (such as instructions from the domain administrator, legal notices) to display to the user. Can contain HTML. The maximum length is 2048 characters. Optional.",
        type: "string",
      },
      parameters: {
        description:
          "Additional properties related to a conference. An example would be a solution-specific setting for enabling video streaming.",
        type: "ref",
        ref: "calendar_ConferenceParameters",
      },
      createRequest: {
        description:
          "A request to generate a new conference and attach it to the event. The data is generated asynchronously. To see whether the data is present check the status field.\nEither conferenceSolution and at least one entryPoint, or createRequest is required.",
        type: "ref",
        ref: "calendar_CreateConferenceRequest",
      },
      signature: {
        description:
          "The signature of the conference data.\nGenerated on server side.\nUnset for a conference with a failed create request.\nOptional for a conference with a pending create request.",
        type: "string",
      },
      entryPoints: {
        description:
          "Information about individual conference entry points, such as URLs or phone numbers.\nAll of them must belong to the same conference.\nEither conferenceSolution and at least one entryPoint, or createRequest is required.",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_EntryPoint",
        },
      },
      conferenceId: {
        description:
          "The ID of the conference.\nCan be used by developers to keep track of conferences, should not be displayed to users.\nThe ID value is formed differently for each conference solution type:  \n- eventHangout: ID is not set. (This conference type is deprecated.)\n- eventNamedHangout: ID is the name of the Hangout. (This conference type is deprecated.)\n- hangoutsMeet: ID is the 10-letter meeting code, for example aaa-bbbb-ccc.\n- addOn: ID is defined by the third-party provider.  Optional.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarAcl: {
    type: "object",
    properties: {
      nextPageToken: {
        description:
          "Token used to access the next page of this result. Omitted if no further results are available, in which case nextSyncToken is provided.",
        type: "string",
      },
      nextSyncToken: {
        description:
          "Token used at a later point in time to retrieve only the entries that have changed since this result was returned. Omitted if further results are available, in which case nextPageToken is provided.",
        type: "string",
      },
      etag: {
        description: "ETag of the collection.",
        type: "string",
      },
      items: {
        description: "List of rules on the access control list.",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_AclRule",
        },
      },
      kind: {
        description: 'Type of the collection ("calendar#acl").',
        default: "calendar#acl",
        type: "string",
      },
    },
    required: [],
  },
  CalendarCalendarList: {
    type: "object",
    properties: {
      nextSyncToken: {
        description:
          "Token used at a later point in time to retrieve only the entries that have changed since this result was returned. Omitted if further results are available, in which case nextPageToken is provided.",
        type: "string",
      },
      etag: {
        description: "ETag of the collection.",
        type: "string",
      },
      kind: {
        description: 'Type of the collection ("calendar#calendarList").',
        default: "calendar#calendarList",
        type: "string",
      },
      nextPageToken: {
        description:
          "Token used to access the next page of this result. Omitted if no further results are available, in which case nextSyncToken is provided.",
        type: "string",
      },
      items: {
        description: "Calendars that are present on the user's calendar list.",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_CalendarListEntry",
        },
      },
    },
    required: [],
  },
  CalendarEventReminder: {
    type: "object",
    properties: {
      minutes: {
        description:
          "Number of minutes before the start of the event when the reminder should trigger. Valid values are between 0 and 40320 (4 weeks in minutes).\nRequired when adding a reminder.",
        type: "integer",
        format: "int32",
      },
      method: {
        description:
          'The method used by this reminder. Possible values are:  \n- "email" - Reminders are sent via email. \n- "popup" - Reminders are sent via a UI popup.  \nRequired when adding a reminder.',
        type: "string",
      },
    },
    required: [],
  },
  CalendarConferenceSolution: {
    type: "object",
    properties: {
      key: {
        description: "The key which can uniquely identify the conference solution for this event.",
        type: "ref",
        ref: "calendar_ConferenceSolutionKey",
      },
      name: {
        description: "The user-visible name of this solution. Not localized.",
        type: "string",
      },
      iconUri: {
        description: "The user-visible icon for this solution.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarEventAttendee: {
    type: "object",
    properties: {
      displayName: {
        description: "The attendee's name, if available. Optional.",
        type: "string",
      },
      additionalGuests: {
        description: "Number of additional guests. Optional. The default is 0.",
        default: "0",
        type: "integer",
        format: "int32",
      },
      responseStatus: {
        description:
          'The attendee\'s response status. Possible values are:  \n- "needsAction" - The attendee has not responded to the invitation (recommended for new events). \n- "declined" - The attendee has declined the invitation. \n- "tentative" - The attendee has tentatively accepted the invitation. \n- "accepted" - The attendee has accepted the invitation.  Warning: If you add an event using the values declined, tentative, or accepted, attendees with the "Add invitations to my calendar" setting set to "When I respond to invitation in email" or "Only if the sender is known" might have their response reset to needsAction and won\'t see an event in their calendar unless they change their response in the event invitation email. Furthermore, if more than 200 guests are invited to the event, response status is not propagated to the guests.',
        type: "string",
      },
      resource: {
        description:
          "Whether the attendee is a resource. Can only be set when the attendee is added to the event for the first time. Subsequent modifications are ignored. Optional. The default is False.",
        default: "false",
        type: "boolean",
      },
      organizer: {
        description: "Whether the attendee is the organizer of the event. Read-only. The default is False.",
        type: "boolean",
      },
      id: {
        description: "The attendee's Profile ID, if available.",
        type: "string",
      },
      self: {
        description:
          "Whether this entry represents the calendar on which this copy of the event appears. Read-only. The default is False.",
        default: "false",
        type: "boolean",
      },
      asyncOperation: {
        description:
          'If present, indicates the status of an asynchronous operation ongoing for this attendee (e.g. listing of members of large attendee groups). Read-only. The default is to not be present.\nPossible values are:  \n- "inProgress" - The asynchronous operation is in progress. \n- (not present) - Otherwise.',
        default: "",
        type: "string",
      },
      comment: {
        description: "The attendee's response comment. Optional.",
        type: "string",
      },
      optional: {
        description: "Whether this is an optional attendee. Optional. The default is False.",
        default: "false",
        type: "boolean",
      },
      email: {
        description:
          "The attendee's email address, if available. This field must be present when adding an attendee. It must be a valid email address as per RFC5322.\nRequired when adding an attendee.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarFreeBusyRequest: {
    type: "object",
    properties: {
      items: {
        description: "List of calendars and/or groups to query.",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_FreeBusyRequestItem",
        },
      },
      calendarExpansionMax: {
        description:
          "Maximal number of calendars for which FreeBusy information is to be provided. Optional. Maximum value is 50.",
        type: "integer",
        format: "int32",
      },
      timeZone: {
        description: "Time zone used in the response. Optional. The default is UTC.",
        default: "UTC",
        type: "string",
      },
      timeMin: {
        description: "The start of the interval for the query formatted as per RFC3339.",
        type: "string",
      },
      timeMax: {
        description: "The end of the interval for the query formatted as per RFC3339.",
        type: "string",
      },
      groupExpansionMax: {
        description:
          "Maximal number of calendar identifiers to be provided for a single group. Optional. An error is returned for a group with more members than this value. Maximum value is 100.",
        type: "integer",
        format: "int32",
      },
    },
    required: [],
  },
  CalendarCalendarNotification: {
    type: "object",
    properties: {
      method: {
        description:
          'The method used to deliver the notification. The possible value is:  \n- "email" - Notifications are sent via email.  \nRequired when adding a notification.',
        type: "string",
      },
      type: {
        description:
          'The type of notification. Possible values are:  \n- "eventCreation" - Notification sent when a new event is put on the calendar. \n- "eventChange" - Notification sent when an event is changed. \n- "eventCancellation" - Notification sent when an event is cancelled. \n- "eventResponse" - Notification sent when an attendee responds to the event invitation. \n- "agenda" - An agenda with the events of the day (sent out in the morning).  \nRequired when adding a notification.',
        type: "string",
      },
    },
    required: [],
  },
  CalendarConferenceParametersAddOnParameters: {
    type: "object",
    properties: {
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: {
          type: "string",
        },
      },
    },
    required: [],
  },
  CalendarColorDefinition: {
    type: "object",
    properties: {
      foreground: {
        description: "The foreground color that can be used to write on top of a background with 'background' color.",
        type: "string",
      },
      background: {
        description: "The background color associated with this color definition.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarSettings: {
    type: "object",
    properties: {
      items: {
        description: "List of user settings.",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_Setting",
        },
      },
      nextPageToken: {
        description:
          "Token used to access the next page of this result. Omitted if no further results are available, in which case nextSyncToken is provided.",
        type: "string",
      },
      etag: {
        description: "Etag of the collection.",
        type: "string",
      },
      nextSyncToken: {
        description:
          "Token used at a later point in time to retrieve only the entries that have changed since this result was returned. Omitted if further results are available, in which case nextPageToken is provided.",
        type: "string",
      },
      kind: {
        description: 'Type of the collection ("calendar#settings").',
        default: "calendar#settings",
        type: "string",
      },
    },
    required: [],
  },
  CalendarEventFocusTimeProperties: {
    type: "object",
    properties: {
      declineMessage: {
        description:
          "Response message to set if an existing event or new invitation is automatically declined by Calendar.",
        type: "string",
      },
      autoDeclineMode: {
        description:
          "Whether to decline meeting invitations which overlap Focus Time events. Valid values are declineNone, meaning that no meeting invitations are declined; declineAllConflictingInvitations, meaning that all conflicting meeting invitations that conflict with the event are declined; and declineOnlyNewConflictingInvitations, meaning that only new conflicting meeting invitations which arrive while the Focus Time event is present are to be declined.",
        type: "string",
      },
      chatStatus: {
        description: "The status to mark the user in Chat and related products. This can be available or doNotDisturb.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarAclRule: {
    type: "object",
    properties: {
      etag: {
        description: "ETag of the resource.",
        type: "string",
      },
      kind: {
        description: 'Type of the resource ("calendar#aclRule").',
        default: "calendar#aclRule",
        type: "string",
      },
      id: {
        description: "Identifier of the Access Control List (ACL) rule. See Sharing calendars.",
        type: "string",
      },
      role: {
        description:
          'The role assigned to the scope. Possible values are:  \n- "none" - Provides no access. \n- "freeBusyReader" - Provides read access to free/busy information. \n- "reader" - Provides read access to the calendar. Private events will appear to users with reader access, but event details will be hidden. \n- "writerWithoutPrivateAccess" - Provides read and write access to the calendar. Private events will appear to users with writerWithoutPrivateAccess access, but event details will be hidden. \n- "writer" - Provides read and write access to the calendar. Private events will appear to users with writer access, and event details will be visible. Provides read access to the calendar\'s ACLs. \n- "owner" - Provides manager access to the calendar. This role has all of the permissions of the writer role with the additional ability to modify access levels of other users.\nImportant: the owner role is different from the calendar\'s data owner. A calendar has a single data owner, but can have multiple users with owner role.',
        type: "string",
      },
      scope: {
        description: "The extent to which calendar access is granted by this ACL rule.",
        type: "object",
        properties: {
          type: {
            description:
              'The type of the scope. Possible values are:  \n- "default" - The public scope. This is the default value. \n- "user" - Limits the scope to a single user. \n- "group" - Limits the scope to a group. \n- "domain" - Limits the scope to a domain.  Note: The permissions granted to the "default", or public, scope apply to any user, authenticated or not.',
            type: "string",
          },
          value: {
            description:
              'The email address of a user or group, or the name of a domain, depending on the scope type. Omitted for type "default".',
            type: "string",
          },
        },
        required: [],
      },
    },
    required: [],
  },
  CalendarChannel: {
    type: "object",
    properties: {
      id: {
        description: "A UUID or similar unique string that identifies this channel.",
        type: "string",
      },
      token: {
        description:
          "An arbitrary string delivered to the target address with each notification delivered over this channel. Optional.",
        type: "string",
      },
      kind: {
        description:
          'Identifies this as a notification channel used to watch for changes to a resource, which is "api#channel".',
        default: "api#channel",
        type: "string",
      },
      type: {
        description:
          'The type of delivery mechanism used for this channel. Valid values are "web_hook" (or "webhook"). Both values refer to a channel where Http requests are used to deliver messages.',
        type: "string",
      },
      expiration: {
        description:
          "Date and time of notification channel expiration, expressed as a Unix timestamp, in milliseconds. Optional.",
        type: "string",
        pattern: "^-?\\d+$",
      },
      resourceId: {
        description:
          "An opaque ID that identifies the resource being watched on this channel. Stable across different API versions.",
        type: "string",
      },
      address: {
        description: "The address where notifications are delivered for this channel.",
        type: "string",
      },
      payload: {
        description: "A Boolean value to indicate whether payload is wanted. Optional.",
        type: "boolean",
      },
      resourceUri: {
        description: "A version-specific identifier for the watched resource.",
        type: "string",
      },
      params: {
        description: "Additional parameters controlling delivery channel behavior. Optional.",
        type: "object",
        properties: {},
        required: [],
        additionalProperties: {
          description: "Declares a new parameter by name.",
          type: "string",
        },
      },
    },
    required: [],
  },
  CalendarConferenceSolutionKey: {
    type: "object",
    properties: {
      type: {
        description:
          'The conference solution type.\nIf a client encounters an unfamiliar or empty type, it should still be able to display the entry points. However, it should disallow modifications.\nThe possible values are:  \n- "eventHangout" for Hangouts for consumers (deprecated; existing events may show this conference solution type but new conferences cannot be created)\n- "eventNamedHangout" for classic Hangouts for Google Workspace users (deprecated; existing events may show this conference solution type but new conferences cannot be created)\n- "hangoutsMeet" for Google Meet (http://meet.google.com)\n- "addOn" for 3P conference providers',
        type: "string",
      },
    },
    required: [],
  },
  CalendarEventAttachment: {
    type: "object",
    properties: {
      fileId: {
        description:
          "ID of the attached file. Read-only.\nFor Google Drive files, this is the ID of the corresponding Files resource entry in the Drive API.",
        type: "string",
      },
      fileUrl: {
        description:
          "URL link to the attachment.\nFor adding Google Drive file attachments use the same format as in alternateLink property of the Files resource in the Drive API.\nRequired when adding an attachment.",
        type: "string",
      },
      title: {
        description: "Attachment title.",
        type: "string",
      },
      iconLink: {
        description:
          "URL link to the attachment's icon. This field can only be modified for custom third-party attachments.",
        type: "string",
      },
      mimeType: {
        description: "Internet media type (MIME type) of the attachment.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarError: {
    type: "object",
    properties: {
      domain: {
        description: "Domain, or broad category, of the error.",
        type: "string",
      },
      reason: {
        description:
          'Specific reason for the error. Some of the possible values are:  \n- "groupTooBig" - The group of users requested is too large for a single query. \n- "tooManyCalendarsRequested" - The number of calendars requested is too large for a single query. \n- "notFound" - The requested resource was not found. \n- "internalError" - The API service has encountered an internal error.  Additional error types may be added in the future, so clients should gracefully handle additional error statuses not included in this list.',
        type: "string",
      },
    },
    required: [],
  },
  CalendarColors: {
    type: "object",
    properties: {
      event: {
        description:
          "A global palette of event colors, mapping from the color ID to its definition. An event resource may refer to one of these color IDs in its colorId field. Read-only.",
        type: "object",
        properties: {},
        required: [],
        additionalProperties: {
          description: "An event color definition.",
          type: "ref",
          ref: "calendar_ColorDefinition",
        },
      },
      kind: {
        description: 'Type of the resource ("calendar#colors").',
        default: "calendar#colors",
        type: "string",
      },
      calendar: {
        description:
          "A global palette of calendar colors, mapping from the color ID to its definition. A calendarListEntry resource refers to one of these color IDs in its colorId field. Read-only.",
        type: "object",
        properties: {},
        required: [],
        additionalProperties: {
          description: "A calendar color definition.",
          type: "ref",
          ref: "calendar_ColorDefinition",
        },
      },
      updated: {
        description: "Last modification time of the color palette (as a RFC3339 timestamp). Read-only.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarEvents: {
    type: "object",
    properties: {
      nextPageToken: {
        description:
          "Token used to access the next page of this result. Omitted if no further results are available, in which case nextSyncToken is provided.",
        type: "string",
      },
      updated: {
        description: "Last modification time of the calendar (as a RFC3339 timestamp). Read-only.",
        type: "string",
      },
      etag: {
        description: "ETag of the collection.",
        type: "string",
      },
      description: {
        description: "Description of the calendar. Read-only.",
        type: "string",
      },
      nextSyncToken: {
        description:
          "Token used at a later point in time to retrieve only the entries that have changed since this result was returned. Omitted if further results are available, in which case nextPageToken is provided.",
        type: "string",
      },
      defaultReminders: {
        description:
          "The default reminders on the calendar for the authenticated user. These reminders apply to all events on this calendar that do not explicitly override them (i.e. do not have reminders.useDefault set to True).",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_EventReminder",
        },
      },
      summary: {
        description: "Title of the calendar. Read-only.",
        type: "string",
      },
      timeZone: {
        description: "The time zone of the calendar. Read-only.",
        type: "string",
      },
      accessRole: {
        description:
          'The user\'s access role for this calendar. Read-only. Possible values are:  \n- "none" - The user has no access. \n- "freeBusyReader" - The user has read access to free/busy information. \n- "reader" - The user has read access to the calendar. Private events will appear to users with reader access, but event details will be hidden. \n- "writerWithoutPrivateAccess" - The user has read and write access to the calendar. Private events will appear to users with writerWithoutPrivateAccess access, but event details will be hidden. \n- "writer" - The user has read and write access to the calendar. Private events will appear to users with writer access, and event details will be visible. \n- "owner" - The user has manager access to the calendar. This role has all of the permissions of the writer role with the additional ability to see and modify access levels of other users.\nImportant: the owner role is different from the calendar\'s data owner. A calendar has a single data owner, but can have multiple users with owner role.',
        type: "string",
      },
      kind: {
        description: 'Type of the collection ("calendar#events").',
        default: "calendar#events",
        type: "string",
      },
      items: {
        description: "List of events on the calendar.",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_Event",
        },
      },
    },
    required: [],
  },
  CalendarCreateConferenceRequest: {
    type: "object",
    properties: {
      requestId: {
        description:
          "The client-generated unique ID for this request.\nClients should regenerate this ID for every new request. If an ID provided is the same as for the previous request, the request is ignored.",
        type: "string",
      },
      conferenceSolutionKey: {
        description: "The conference solution, such as Hangouts or Google Meet.",
        type: "ref",
        ref: "calendar_ConferenceSolutionKey",
      },
      status: {
        description: "The status of the conference create request.",
        type: "ref",
        ref: "calendar_ConferenceRequestStatus",
      },
    },
    required: [],
  },
  CalendarEventBirthdayProperties: {
    type: "object",
    properties: {
      contact: {
        description:
          'Resource name of the contact this birthday event is linked to. This can be used to fetch contact details from People API. Format: "people/c12345". Read-only.',
        type: "string",
      },
      type: {
        description:
          'Type of birthday or special event. Possible values are:  \n- "anniversary" - An anniversary other than birthday. Always has a contact. \n- "birthday" - A birthday event. This is the default value. \n- "custom" - A special date whose label is further specified in the customTypeName field. Always has a contact. \n- "other" - A special date which does not fall into the other categories, and does not have a custom label. Always has a contact. \n- "self" - Calendar owner\'s own birthday. Cannot have a contact.  The Calendar API only supports creating events with the type "birthday". The type cannot be changed after the event is created.',
        default: "birthday",
        type: "string",
      },
      customTypeName: {
        description:
          'Custom type label specified for this event. This is populated if birthdayProperties.type is set to "custom". Read-only.',
        type: "string",
      },
    },
    required: [],
  },
  CalendarEvent: {
    type: "object",
    properties: {
      description: {
        description: "Description of the event. Can contain HTML. Optional.",
        type: "string",
      },
      start: {
        description:
          "The (inclusive) start time of the event. For a recurring event, this is the start time of the first instance.",
        type: "ref",
        ref: "calendar_EventDateTime",
      },
      status: {
        description:
          'Status of the event. Optional. Possible values are:  \n- "confirmed" - The event is confirmed. This is the default status. \n- "tentative" - The event is tentatively confirmed. \n- "cancelled" - The event is cancelled (deleted). The list method returns cancelled events only on incremental sync (when syncToken or updatedMin are specified) or if the showDeleted flag is set to true. The get method always returns them.\nA cancelled status represents two different states depending on the event type:  \n- Cancelled exceptions of an uncancelled recurring event indicate that this instance should no longer be presented to the user. Clients should store these events for the lifetime of the parent recurring event.\nCancelled exceptions are only guaranteed to have values for the id, recurringEventId and originalStartTime fields populated. The other fields might be empty.  \n- All other cancelled events represent deleted events. Clients should remove their locally synced copies. Such cancelled events will eventually disappear, so do not rely on them being available indefinitely.\nDeleted events are only guaranteed to have the id field populated.   On the organizer\'s calendar, cancelled events continue to expose event details (summary, location, etc.) so that they can be restored (undeleted). Similarly, the events to which the user was invited and that they manually removed continue to provide details. However, incremental sync requests with showDeleted set to false will not return these details.\nIf an event changes its organizer (for example via the move operation) and the original organizer is not on the attendee list, it will leave behind a cancelled event where only the id field is guaranteed to be populated.',
        type: "string",
      },
      sequence: {
        description: "Sequence number as per iCalendar.",
        type: "integer",
        format: "int32",
      },
      focusTimeProperties: {
        description: "Focus Time event data. Used if eventType is focusTime.",
        type: "ref",
        ref: "calendar_EventFocusTimeProperties",
      },
      colorId: {
        description:
          "The color of the event. This is an ID referring to an entry in the event section of the colors definition (see the  colors endpoint). Optional.",
        type: "string",
      },
      recurrence: {
        description:
          "List of RRULE, EXRULE, RDATE and EXDATE lines for a recurring event, as specified in RFC5545. Note that DTSTART and DTEND lines are not allowed in this field; event start and end times are specified in the start and end fields. This field is omitted for single events or instances of recurring events.",
        type: "array",
        items: {
          type: "string",
        },
      },
      location: {
        description: "Geographic location of the event as free-form text. Optional.",
        type: "string",
      },
      locked: {
        description:
          'Whether this is a locked event copy where no changes can be made to the main event fields "summary", "description", "location", "start", "end" or "recurrence". The default is False. Read-Only.',
        default: "false",
        type: "boolean",
      },
      guestsCanModify: {
        description: "Whether attendees other than the organizer can modify the event. Optional. The default is False.",
        default: "false",
        type: "boolean",
      },
      htmlLink: {
        description: "An absolute link to this event in the Google Calendar Web UI. Read-only.",
        type: "string",
      },
      originalStartTime: {
        description:
          "For an instance of a recurring event, this is the time at which this event would start according to the recurrence data in the recurring event identified by recurringEventId. It uniquely identifies the instance within the recurring event series even if the instance was moved to a different time. Immutable.",
        type: "ref",
        ref: "calendar_EventDateTime",
      },
      etag: {
        description: "ETag of the resource.",
        type: "string",
      },
      hangoutLink: {
        description: "An absolute link to the Google Hangout associated with this event. Read-only.",
        type: "string",
      },
      workingLocationProperties: {
        description: "Working location event data.",
        type: "ref",
        ref: "calendar_EventWorkingLocationProperties",
      },
      iCalUID: {
        description:
          "Event unique identifier as defined in RFC5545. It is used to uniquely identify events accross calendaring systems and must be supplied when importing events via the import method.\nNote that the iCalUID and the id are not identical and only one of them should be supplied at event creation time. One difference in their semantics is that in recurring events, all occurrences of one event have different ids while they all share the same iCalUIDs. To retrieve an event using its iCalUID, call the events.list method using the iCalUID parameter. To retrieve an event using its id, call the events.get method.",
        type: "string",
      },
      conferenceData: {
        description:
          "The conference-related information, such as details of a Google Meet conference. To create new conference details use the createRequest field. To persist your changes, remember to set the conferenceDataVersion request parameter to 1 for all event modification requests. Warning: Reusing Google Meet conference data across different events can cause access issues and expose meeting details to unintended users. To help ensure meeting privacy, always generate a unique conference for each event by using the createRequest field.",
        type: "ref",
        ref: "calendar_ConferenceData",
      },
      summary: {
        description: "Title of the event.",
        type: "string",
      },
      birthdayProperties: {
        description: 'Birthday or special event data. Used if eventType is "birthday". Immutable.',
        type: "ref",
        ref: "calendar_EventBirthdayProperties",
      },
      attendees: {
        description:
          "The attendees of the event. See the Events with attendees guide for more information on scheduling events with other calendar users. Service accounts need to use domain-wide delegation of authority to populate the attendee list.",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_EventAttendee",
        },
      },
      attendeesOmitted: {
        description:
          "Whether attendees may have been omitted from the event's representation. When retrieving an event, this may be due to a restriction specified by the maxAttendee query parameter. When updating an event, this can be used to only update the participant's response. Optional. The default is False.",
        default: "false",
        type: "boolean",
      },
      extendedProperties: {
        description: "Extended properties of the event.",
        type: "object",
        properties: {
          shared: {
            description: "Properties that are shared between copies of the event on other attendees' calendars.",
            type: "object",
            properties: {},
            required: [],
            additionalProperties: {
              description: "The name of the shared property and the corresponding value.",
              type: "string",
            },
          },
          private: {
            description: "Properties that are private to the copy of the event that appears on this calendar.",
            type: "object",
            properties: {},
            required: [],
            additionalProperties: {
              description: "The name of the private property and the corresponding value.",
              type: "string",
            },
          },
        },
        required: [],
      },
      source: {
        description:
          "Source from which the event was created. For example, a web page, an email message or any document identifiable by an URL with HTTP or HTTPS scheme. Can only be seen or modified by the creator of the event.",
        type: "object",
        properties: {
          title: {
            description: "Title of the source; for example a title of a web page or an email subject.",
            type: "string",
          },
          url: {
            description: "URL of the source pointing to a resource. The URL scheme must be HTTP or HTTPS.",
            type: "string",
          },
        },
        required: [],
      },
      updated: {
        description:
          "Last modification time of the main event data (as a RFC3339 timestamp). Updating event reminders will not cause this to change. Read-only.",
        type: "string",
      },
      guestsCanSeeOtherGuests: {
        description:
          "Whether attendees other than the organizer can see who the event's attendees are. Optional. The default is True.",
        default: "true",
        type: "boolean",
      },
      attachments: {
        description:
          "File attachments for the event.\nIn order to modify attachments the supportsAttachments request parameter should be set to true.\nThere can be at most 25 attachments per event,",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_EventAttachment",
        },
      },
      eventLabelId: {
        description:
          "The ID of the event label assigned to the event. Optional. This refers to the ID of an entry in the labelProperties.eventLabels property of the calendar (see the Calendars.get endpoint.)\nThis property supersedes the index-based colorId property. To set or change this property, you need to specify eventLabelVersion=1 in the parameters of the insert, import, update, and patch methods.\nSetting an empty string, or not setting this field at all, will remove the existing label from the event.",
        type: "string",
      },
      kind: {
        description: 'Type of the resource ("calendar#event").',
        default: "calendar#event",
        type: "string",
      },
      visibility: {
        description:
          'Visibility of the event. Optional. Possible values are:  \n- "default" - Uses the default visibility for events on the calendar. This is the default value. \n- "public" - The event is public and event details are visible to all readers of the calendar. \n- "private" - The event is private and only event attendees may view event details. \n- "confidential" - The event is private. This value is provided for compatibility reasons.  \nNote on recurring events: Changing the visibility of a single instance of a recurring event can affect all instances of the series. If the new setting is more restrictive (e.g. from public to private), it is applied to all instances. If the new setting is less restrictive (e.g. from private to public), the change is ignored. To make a recurring event less restrictive, you must update the parent recurring event.',
        default: "default",
        type: "string",
      },
      transparency: {
        description:
          'Whether the event blocks time on the calendar. Optional. Possible values are:  \n- "opaque" - Default value. The event does block time on the calendar. This is equivalent to setting Show me as to Busy in the Calendar UI. \n- "transparent" - The event does not block time on the calendar. This is equivalent to setting Show me as to Available in the Calendar UI.',
        default: "opaque",
        type: "string",
      },
      end: {
        description:
          "The (exclusive) end time of the event. For a recurring event, this is the end time of the first instance.",
        type: "ref",
        ref: "calendar_EventDateTime",
      },
      endTimeUnspecified: {
        description:
          "Whether the end time is actually unspecified. An end time is still provided for compatibility reasons, even if this attribute is set to True. The default is False.",
        default: "false",
        type: "boolean",
      },
      creator: {
        description: "The creator of the event. Read-only.",
        type: "object",
        properties: {
          email: {
            description: "The creator's email address, if available.",
            type: "string",
          },
          id: {
            description: "The creator's Profile ID, if available.",
            type: "string",
          },
          self: {
            description:
              "Whether the creator corresponds to the calendar on which this copy of the event appears. Read-only. The default is False.",
            default: "false",
            type: "boolean",
          },
          displayName: {
            description: "The creator's name, if available.",
            type: "string",
          },
        },
        required: [],
      },
      eventType: {
        description:
          'Specific type of the event. This cannot be modified after the event is created. Possible values are:  \n- "birthday" - A special all-day event with an annual recurrence. \n- "default" - A regular event or not further specified. \n- "focusTime" - A focus-time event. \n- "fromGmail" - An event from Gmail. This type of event cannot be created. \n- "outOfOffice" - An out-of-office event. \n- "workingLocation" - A working location event.',
        default: "default",
        type: "string",
      },
      reminders: {
        description:
          "Information about the event's reminders for the authenticated user. Note that changing reminders does not also change the updated property of the enclosing event.",
        type: "object",
        properties: {
          overrides: {
            description:
              "If the event doesn't use the default reminders, this lists the reminders specific to the event, or, if not set, indicates that no reminders are set for this event. The maximum number of override reminders is 5.",
            type: "array",
            items: {
              type: "ref",
              ref: "calendar_EventReminder",
            },
          },
          useDefault: {
            description: "Whether the default reminders of the calendar apply to the event.",
            type: "boolean",
          },
        },
        required: [],
      },
      created: {
        description: "Creation time of the event (as a RFC3339 timestamp). Read-only.",
        type: "string",
      },
      gadget: {
        description:
          "A gadget that extends this event. Gadgets are deprecated; this structure is instead only used for returning birthday calendar metadata.",
        type: "object",
        properties: {
          display: {
            description:
              'The gadget\'s display mode. Deprecated. Possible values are:  \n- "icon" - The gadget displays next to the event\'s title in the calendar view. \n- "chip" - The gadget displays when the event is clicked.',
            type: "string",
          },
          link: {
            description: "The gadget's URL. The URL scheme must be HTTPS. Deprecated.",
            type: "string",
          },
          height: {
            description:
              "The gadget's height in pixels. The height must be an integer greater than 0. Optional. Deprecated.",
            type: "integer",
            format: "int32",
          },
          width: {
            description:
              "The gadget's width in pixels. The width must be an integer greater than 0. Optional. Deprecated.",
            type: "integer",
            format: "int32",
          },
          iconLink: {
            description: "The gadget's icon URL. The URL scheme must be HTTPS. Deprecated.",
            type: "string",
          },
          title: {
            description: "The gadget's title. Deprecated.",
            type: "string",
          },
          type: {
            description: "The gadget's type. Deprecated.",
            type: "string",
          },
          preferences: {
            description: "Preferences.",
            type: "object",
            properties: {},
            required: [],
            additionalProperties: {
              description: "The preference name and corresponding value.",
              type: "string",
            },
          },
        },
        required: [],
      },
      anyoneCanAddSelf: {
        description: "Whether anyone can invite themselves to the event (deprecated). Optional. The default is False.",
        default: "false",
        type: "boolean",
      },
      outOfOfficeProperties: {
        description: "Out of office event data. Used if eventType is outOfOffice.",
        type: "ref",
        ref: "calendar_EventOutOfOfficeProperties",
      },
      privateCopy: {
        description:
          "If set to True, Event propagation is disabled. Note that it is not the same thing as Private event properties. Optional. Immutable. The default is False.",
        default: "false",
        type: "boolean",
      },
      recurringEventId: {
        description:
          "For an instance of a recurring event, this is the id of the recurring event to which this instance belongs. Immutable.",
        type: "string",
      },
      guestsCanInviteOthers: {
        description:
          "Whether attendees other than the organizer can invite others to the event. Optional. The default is True.",
        default: "true",
        type: "boolean",
      },
      id: {
        description:
          "Opaque identifier of the event. When creating new single or recurring events, you can specify their IDs. Provided IDs must follow these rules:  \n- characters allowed in the ID are those used in base32hex encoding, i.e. lowercase letters a-v and digits 0-9, see section 3.1.2 in RFC2938 \n- the length of the ID must be between 5 and 1024 characters \n- the ID must be unique per calendar  Due to the globally distributed nature of the system, we cannot guarantee that ID collisions will be detected at event creation time. To minimize the risk of collisions we recommend using an established UUID algorithm such as one described in RFC4122.\nIf you do not specify an ID, it will be automatically generated by the server.\nNote that the icalUID and the id are not identical and only one of them should be supplied at event creation time. One difference in their semantics is that in recurring events, all occurrences of one event have different ids while they all share the same icalUIDs.",
        type: "string",
      },
      organizer: {
        description:
          "The organizer of the event. If the organizer is also an attendee, this is indicated with a separate entry in attendees with the organizer field set to True. To change the organizer, use the move operation. Read-only, except when importing an event.",
        type: "object",
        properties: {
          id: {
            description: "The organizer's Profile ID, if available.",
            type: "string",
          },
          email: {
            description:
              "The organizer's email address, if available. It must be a valid email address as per RFC5322.",
            type: "string",
          },
          displayName: {
            description: "The organizer's name, if available.",
            type: "string",
          },
          self: {
            description:
              "Whether the organizer corresponds to the calendar on which this copy of the event appears. Read-only. The default is False.",
            default: "false",
            type: "boolean",
          },
        },
        required: [],
      },
    },
    required: [],
  },
  CalendarFreeBusyCalendar: {
    type: "object",
    properties: {
      busy: {
        description: "List of time ranges during which this calendar should be regarded as busy.",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_TimePeriod",
        },
      },
      errors: {
        description: "Optional error(s) (if computation for the calendar failed).",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_Error",
        },
      },
    },
    required: [],
  },
  CalendarSetting: {
    type: "object",
    properties: {
      etag: {
        description: "ETag of the resource.",
        type: "string",
      },
      value: {
        description:
          "Value of the user setting. The format of the value depends on the ID of the setting. It must always be a UTF-8 string of length up to 1024 characters.",
        type: "string",
      },
      kind: {
        description: 'Type of the resource ("calendar#setting").',
        default: "calendar#setting",
        type: "string",
      },
      id: {
        description: "The id of the user setting.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarConferenceParameters: {
    type: "object",
    properties: {
      addOnParameters: {
        description: "Additional add-on specific data.",
        type: "ref",
        ref: "calendar_ConferenceParametersAddOnParameters",
      },
    },
    required: [],
  },
  CalendarFreeBusyRequestItem: {
    type: "object",
    properties: {
      id: {
        description: "The identifier of a calendar or a group.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarCalendar: {
    type: "object",
    properties: {
      labelProperties: {
        description:
          "Label properties defined on this calendar. If specified, overwrites the existing label properties. If not specified, the label properties remain unchanged.",
        type: "ref",
        ref: "calendar_LabelProperties",
      },
      location: {
        description: "Geographic location of the calendar as free-form text. Optional.",
        type: "string",
      },
      timeZone: {
        description:
          'The time zone of the calendar. (Formatted as an IANA Time Zone Database name, e.g. "Europe/Zurich".) Optional.',
        type: "string",
      },
      dataOwner: {
        description: "The email of the owner of the calendar. Set only for secondary calendars. Read-only.",
        type: "string",
      },
      kind: {
        description: 'Type of the resource ("calendar#calendar").',
        default: "calendar#calendar",
        type: "string",
      },
      id: {
        description: "Identifier of the calendar. To retrieve IDs call the calendarList.list() method.",
        type: "string",
      },
      summary: {
        description: "Title of the calendar.",
        type: "string",
      },
      conferenceProperties: {
        description: "Conferencing properties for this calendar, for example what types of conferences are allowed.",
        type: "ref",
        ref: "calendar_ConferenceProperties",
      },
      etag: {
        description: "ETag of the resource.",
        type: "string",
      },
      description: {
        description: "Description of the calendar. Optional.",
        type: "string",
      },
      autoAcceptInvitations: {
        description: "Whether this calendar automatically accepts invitations. Only valid for resource calendars.",
        type: "boolean",
      },
    },
    required: [],
  },
  CalendarConferenceProperties: {
    type: "object",
    properties: {
      allowedConferenceSolutionTypes: {
        description:
          'The types of conference solutions that are supported for this calendar.\nThe possible values are:  \n- "eventHangout" \n- "eventNamedHangout" \n- "hangoutsMeet"  Optional.',
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: [],
  },
  CalendarEntryPoint: {
    type: "object",
    properties: {
      uri: {
        description:
          "The URI of the entry point. The maximum length is 1300 characters.\nFormat:  \n- for video, http: or https: schema is required.\n- for phone, tel: schema is required. The URI should include the entire dial sequence (e.g., tel:+12345678900,,,123456789;1234).\n- for sip, sip: schema is required, e.g., sip:12345678@myprovider.com.\n- for more, http: or https: schema is required.",
        type: "string",
      },
      entryPointFeatures: {
        description:
          "Features of the entry point, such as being toll or toll-free. One entry point can have multiple features. However, toll and toll-free cannot be both set on the same entry point.",
        type: "array",
        items: {
          type: "string",
        },
      },
      label: {
        description:
          "The label for the URI. Visible to end users. Not localized. The maximum length is 512 characters.\nExamples:  \n- for video: meet.google.com/aaa-bbbb-ccc\n- for phone: +1 123 268 2601\n- for sip: 12345678@altostrat.com\n- for more: should not be filled  \nOptional.",
        type: "string",
      },
      meetingCode: {
        description:
          "The meeting code to access the conference. The maximum length is 128 characters.\nWhen creating new conference data, populate only the subset of {meetingCode, accessCode, passcode, password, pin} fields that match the terminology that the conference provider uses. Only the populated fields should be displayed.\nOptional.",
        type: "string",
      },
      regionCode: {
        description:
          'The CLDR/ISO 3166 region code for the country associated with this phone access. Example: "SE" for Sweden.\nCalendar backend will populate this field only for EntryPointType.PHONE.',
        type: "string",
      },
      accessCode: {
        description:
          "The access code to access the conference. The maximum length is 128 characters.\nWhen creating new conference data, populate only the subset of {meetingCode, accessCode, passcode, password, pin} fields that match the terminology that the conference provider uses. Only the populated fields should be displayed.\nOptional.",
        type: "string",
      },
      passcode: {
        description:
          "The passcode to access the conference. The maximum length is 128 characters.\nWhen creating new conference data, populate only the subset of {meetingCode, accessCode, passcode, password, pin} fields that match the terminology that the conference provider uses. Only the populated fields should be displayed.",
        type: "string",
      },
      pin: {
        description:
          "The PIN to access the conference. The maximum length is 128 characters.\nWhen creating new conference data, populate only the subset of {meetingCode, accessCode, passcode, password, pin} fields that match the terminology that the conference provider uses. Only the populated fields should be displayed.\nOptional.",
        type: "string",
      },
      entryPointType: {
        description:
          'The type of the conference entry point.\nPossible values are:  \n- "video" - joining a conference over HTTP. A conference can have zero or one video entry point.\n- "phone" - joining a conference by dialing a phone number. A conference can have zero or more phone entry points.\n- "sip" - joining a conference over SIP. A conference can have zero or one sip entry point.\n- "more" - further conference joining instructions, for example additional phone numbers. A conference can have zero or one more entry point. A conference with only a more entry point is not a valid conference.',
        type: "string",
      },
      password: {
        description:
          "The password to access the conference. The maximum length is 128 characters.\nWhen creating new conference data, populate only the subset of {meetingCode, accessCode, passcode, password, pin} fields that match the terminology that the conference provider uses. Only the populated fields should be displayed.\nOptional.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarTimePeriod: {
    type: "object",
    properties: {
      start: {
        description: "The (inclusive) start of the time period.",
        type: "string",
      },
      end: {
        description: "The (exclusive) end of the time period.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarCalendarListEntry: {
    type: "object",
    properties: {
      id: {
        description: "Identifier of the calendar.",
        type: "string",
      },
      summaryOverride: {
        description: "The summary that the authenticated user has set for this calendar. Optional.",
        type: "string",
      },
      backgroundColor: {
        description:
          'The main color of the calendar in the hexadecimal format "#0088aa". This property supersedes the index-based colorId property. To set or change this property, you need to specify colorRgbFormat=true in the parameters of the insert, update and patch methods. Optional.',
        type: "string",
      },
      hidden: {
        description:
          "Whether the calendar has been hidden from the list. Optional. The attribute is only returned when the calendar is hidden, in which case the value is true.",
        default: "false",
        type: "boolean",
      },
      foregroundColor: {
        description:
          'The foreground color of the calendar in the hexadecimal format "#ffffff". This property supersedes the index-based colorId property. To set or change this property, you need to specify colorRgbFormat=true in the parameters of the insert, update and patch methods. Optional.',
        type: "string",
      },
      conferenceProperties: {
        description: "Conferencing properties for this calendar, for example what types of conferences are allowed.",
        type: "ref",
        ref: "calendar_ConferenceProperties",
      },
      primary: {
        description:
          "Whether the calendar is the primary calendar of the authenticated user. Read-only. Optional. The default is False.",
        default: "false",
        type: "boolean",
      },
      location: {
        description: "Geographic location of the calendar as free-form text. Optional. Read-only.",
        type: "string",
      },
      timeZone: {
        description: "The time zone of the calendar. Optional. Read-only.",
        type: "string",
      },
      accessRole: {
        description:
          'The effective access role that the authenticated user has on the calendar. Read-only. Possible values are:  \n- "freeBusyReader" - Provides read access to free/busy information. \n- "reader" - Provides read access to the calendar. Private events will appear to users with reader access, but event details will be hidden. \n- "writerWithoutPrivateAccess" - Provides read and write access to the calendar. Private events will appear to users with writerWithoutPrivateAccess access, but event details will be hidden. \n- "writer" - Provides read and write access to the calendar. Private events will appear to users with writer access, and event details will be visible. \n- "owner" - Provides manager access to the calendar. This role has all of the permissions of the writer role with the additional ability to see and modify access levels of other users.\nImportant: the owner role is different from the calendar\'s data owner. A calendar has a single data owner, but can have multiple users with owner role.',
        type: "string",
      },
      notificationSettings: {
        description: "The notifications that the authenticated user is receiving for this calendar.",
        type: "object",
        properties: {
          notifications: {
            description: "The list of notifications set for this calendar.",
            type: "array",
            items: {
              type: "ref",
              ref: "calendar_CalendarNotification",
            },
          },
        },
        required: [],
      },
      summary: {
        description: "Title of the calendar. Read-only.",
        type: "string",
      },
      kind: {
        description: 'Type of the resource ("calendar#calendarListEntry").',
        default: "calendar#calendarListEntry",
        type: "string",
      },
      selected: {
        description: "Whether the calendar content shows up in the calendar UI. Optional. The default is False.",
        default: "false",
        type: "boolean",
      },
      dataOwner: {
        description: "The email of the owner of the calendar. Set only for secondary calendars. Read-only.",
        type: "string",
      },
      autoAcceptInvitations: {
        description:
          "Whether this calendar automatically accepts invitations. Only valid for resource calendars. Read-only.",
        type: "boolean",
      },
      etag: {
        description: "ETag of the resource.",
        type: "string",
      },
      description: {
        description: "Description of the calendar. Optional. Read-only.",
        type: "string",
      },
      colorId: {
        description:
          "The color of the calendar. This is an ID referring to an entry in the calendar section of the colors definition (see the colors endpoint). This property is superseded by the backgroundColor and foregroundColor properties and can be ignored when using these properties. Optional.",
        type: "string",
      },
      defaultReminders: {
        description: "The default reminders that the authenticated user has for this calendar.",
        type: "array",
        items: {
          type: "ref",
          ref: "calendar_EventReminder",
        },
      },
      deleted: {
        description:
          "Whether this calendar list entry has been deleted from the calendar list. Read-only. Optional. The default is False.",
        default: "false",
        type: "boolean",
      },
    },
    required: [],
  },
  CalendarConferenceRequestStatus: {
    type: "object",
    properties: {
      statusCode: {
        description:
          'The current status of the conference create request. Read-only.\nThe possible values are:  \n- "pending": the conference create request is still being processed.\n- "success": the conference create request succeeded, the entry points are populated.\n- "failure": the conference create request failed, there are no entry points.',
        type: "string",
      },
    },
    required: [],
  },
  CalendarEventLabel: {
    type: "object",
    properties: {
      name: {
        description: "Name of the label. Optional.\nIf provided this must have at most 50 characters.",
        type: "string",
      },
      backgroundColor: {
        description:
          'Background color of the label in hexadecimal format, such as "#039be5". Events with this label are displayed in this color. Required.',
        type: "string",
      },
      id: {
        description:
          "The ID of the label. Optional when inserting a new label. If not provided, a unique ID will be generated. Required when updating a label.\nIf provided, the ID must be unique within the calendar and follow UUID format.",
        type: "string",
      },
    },
    required: [],
  },
  CalendarEventDateTime: {
    type: "object",
    properties: {
      dateTime: {
        description:
          "The time, as a combined date-time value (formatted according to RFC3339). A time zone offset is required unless a time zone is explicitly specified in timeZone.",
        type: "string",
      },
      timeZone: {
        description:
          'The time zone in which the time is specified. (Formatted as an IANA Time Zone Database name, e.g. "Europe/Zurich".) For recurring events this field is required and specifies the time zone in which the recurrence is expanded. For single events this field is optional and indicates a custom time zone for the event start/end.',
        type: "string",
      },
      date: {
        description: 'The date, in the format "yyyy-mm-dd", if this is an all-day event.',
        type: "string",
      },
    },
    required: [],
  },
}
