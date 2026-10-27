// GENERATED. DO NOT EDIT.
// Source: spec/google/*.json, verified by provenance.json
// Run: pnpm generate

export type CalendarLabelProperties = {
  /** Event labels defined on this calendar. If this is present when updating the calendar, it will replace the existing event labels. Extend the list to add a new event label, and remove entities from the list to delete a label from calendar. Each calendar can have a maximum of 200 labels. */
  eventLabels?: Array<CalendarEventLabel>
}

export type CalendarFreeBusyGroup = {
  /** List of calendars' identifiers within a group. */
  calendars?: Array<string>
  /** Optional error(s) (if computation for the group failed). */
  errors?: Array<CalendarError>
}

export type CalendarEventOutOfOfficeProperties = {
  /** Whether to decline meeting invitations which overlap Out of office events. Valid values are declineNone, meaning that no meeting invitations are declined; declineAllConflictingInvitations, meaning that all conflicting meeting invitations that conflict with the event are declined; and declineOnlyNewConflictingInvitations, meaning that only new conflicting meeting invitations which arrive while the Out of office event is present are to be declined. */
  autoDeclineMode?: string
  /** Response message to set if an existing event or new invitation is automatically declined by Calendar. */
  declineMessage?: string
}

export type CalendarEventWorkingLocationProperties = {
  /** Type of the working location. Possible values are: - "homeOffice" - The user is working at home. - "officeLocation" - The user is working from an office. - "customLocation" - The user is working from a custom location. Any details are specified in a sub-field of the specified name, but this field may be missing if empty. Any other fields are ignored. Required when adding working location properties. */
  type?: string
  /** If present, specifies that the user is working from an office. */
  officeLocation?: {
    /** The office name that's displayed in Calendar Web and Mobile clients. We recommend you reference a building name in the organization's Resources database. */
    label?: string
    /** An optional desk identifier. */
    deskId?: string
    /** An optional building identifier. This should reference a building ID in the organization's Resources database. */
    buildingId?: string
    /** An optional floor section identifier. */
    floorSectionId?: string
    /** An optional floor identifier. */
    floorId?: string
  }
  /** If present, specifies that the user is working from a custom location. */
  customLocation?: {
    /** An optional extra label for additional information. */
    label?: string
  }
  /** If present, specifies that the user is working at home. */
  homeOffice?: unknown
}

export type CalendarFreeBusyResponse = {
  /** List of free/busy information for calendars. */
  calendars?: Record<string, CalendarFreeBusyCalendar>
  /** Expansion of groups. */
  groups?: Record<string, CalendarFreeBusyGroup>
  /** The start of the interval. */
  timeMin?: string
  /** Type of the resource ("calendar#freeBusy"). */
  kind?: string
  /** The end of the interval. */
  timeMax?: string
}

export type CalendarConferenceData = {
  /** The conference solution, such as Google Meet. Unset for a conference with a failed create request. Either conferenceSolution and at least one entryPoint, or createRequest is required. */
  conferenceSolution?: CalendarConferenceSolution
  /** Additional notes (such as instructions from the domain administrator, legal notices) to display to the user. Can contain HTML. The maximum length is 2048 characters. Optional. */
  notes?: string
  /** Additional properties related to a conference. An example would be a solution-specific setting for enabling video streaming. */
  parameters?: CalendarConferenceParameters
  /** A request to generate a new conference and attach it to the event. The data is generated asynchronously. To see whether the data is present check the status field. Either conferenceSolution and at least one entryPoint, or createRequest is required. */
  createRequest?: CalendarCreateConferenceRequest
  /** The signature of the conference data. Generated on server side. Unset for a conference with a failed create request. Optional for a conference with a pending create request. */
  signature?: string
  /** Information about individual conference entry points, such as URLs or phone numbers. All of them must belong to the same conference. Either conferenceSolution and at least one entryPoint, or createRequest is required. */
  entryPoints?: Array<CalendarEntryPoint>
  /** The ID of the conference. Can be used by developers to keep track of conferences, should not be displayed to users. The ID value is formed differently for each conference solution type: - eventHangout: ID is not set. (This conference type is deprecated.) - eventNamedHangout: ID is the name of the Hangout. (This conference type is deprecated.) - hangoutsMeet: ID is the 10-letter meeting code, for example aaa-bbbb-ccc. - addOn: ID is defined by the third-party provider. Optional. */
  conferenceId?: string
}

export type CalendarAcl = {
  /** Token used to access the next page of this result. Omitted if no further results are available, in which case nextSyncToken is provided. */
  nextPageToken?: string
  /** Token used at a later point in time to retrieve only the entries that have changed since this result was returned. Omitted if further results are available, in which case nextPageToken is provided. */
  nextSyncToken?: string
  /** ETag of the collection. */
  etag?: string
  /** List of rules on the access control list. */
  items?: Array<CalendarAclRule>
  /** Type of the collection ("calendar#acl"). */
  kind?: string
}

export type CalendarCalendarList = {
  /** Token used at a later point in time to retrieve only the entries that have changed since this result was returned. Omitted if further results are available, in which case nextPageToken is provided. */
  nextSyncToken?: string
  /** ETag of the collection. */
  etag?: string
  /** Type of the collection ("calendar#calendarList"). */
  kind?: string
  /** Token used to access the next page of this result. Omitted if no further results are available, in which case nextSyncToken is provided. */
  nextPageToken?: string
  /** Calendars that are present on the user's calendar list. */
  items?: Array<CalendarCalendarListEntry>
}

export type CalendarEventReminder = {
  /** Number of minutes before the start of the event when the reminder should trigger. Valid values are between 0 and 40320 (4 weeks in minutes). Required when adding a reminder. */
  minutes?: number
  /** The method used by this reminder. Possible values are: - "email" - Reminders are sent via email. - "popup" - Reminders are sent via a UI popup. Required when adding a reminder. */
  method?: string
}

export type CalendarConferenceSolution = {
  /** The key which can uniquely identify the conference solution for this event. */
  key?: CalendarConferenceSolutionKey
  /** The user-visible name of this solution. Not localized. */
  name?: string
  /** The user-visible icon for this solution. */
  iconUri?: string
}

export type CalendarEventAttendee = {
  /** The attendee's name, if available. Optional. */
  displayName?: string
  /** Number of additional guests. Optional. The default is 0. */
  additionalGuests?: number
  /** The attendee's response status. Possible values are: - "needsAction" - The attendee has not responded to the invitation (recommended for new events). - "declined" - The attendee has declined the invitation. - "tentative" - The attendee has tentatively accepted the invitation. - "accepted" - The attendee has accepted the invitation. Warning: If you add an event using the values declined, tentative, or accepted, attendees with the "Add invitations to my calendar" setting set to "When I respond to invitation in email" or "Only if the sender is known" might have their response reset to needsAction and won't see an event in their calendar unless they change their response in the event invitation email. Furthermore, if more than 200 guests are invited to the event, response status is not propagated to the guests. */
  responseStatus?: string
  /** Whether the attendee is a resource. Can only be set when the attendee is added to the event for the first time. Subsequent modifications are ignored. Optional. The default is False. */
  resource?: boolean
  /** Whether the attendee is the organizer of the event. Read-only. The default is False. */
  organizer?: boolean
  /** The attendee's Profile ID, if available. */
  id?: string
  /** Whether this entry represents the calendar on which this copy of the event appears. Read-only. The default is False. */
  self?: boolean
  /** If present, indicates the status of an asynchronous operation ongoing for this attendee (e.g. listing of members of large attendee groups). Read-only. The default is to not be present. Possible values are: - "inProgress" - The asynchronous operation is in progress. - (not present) - Otherwise. */
  asyncOperation?: string
  /** The attendee's response comment. Optional. */
  comment?: string
  /** Whether this is an optional attendee. Optional. The default is False. */
  optional?: boolean
  /** The attendee's email address, if available. This field must be present when adding an attendee. It must be a valid email address as per RFC5322. Required when adding an attendee. */
  email?: string
}

export type CalendarFreeBusyRequest = {
  /** List of calendars and/or groups to query. */
  items?: Array<CalendarFreeBusyRequestItem>
  /** Maximal number of calendars for which FreeBusy information is to be provided. Optional. Maximum value is 50. */
  calendarExpansionMax?: number
  /** Time zone used in the response. Optional. The default is UTC. */
  timeZone?: string
  /** The start of the interval for the query formatted as per RFC3339. */
  timeMin?: string
  /** The end of the interval for the query formatted as per RFC3339. */
  timeMax?: string
  /** Maximal number of calendar identifiers to be provided for a single group. Optional. An error is returned for a group with more members than this value. Maximum value is 100. */
  groupExpansionMax?: number
}

export type CalendarCalendarNotification = {
  /** The method used to deliver the notification. The possible value is: - "email" - Notifications are sent via email. Required when adding a notification. */
  method?: string
  /** The type of notification. Possible values are: - "eventCreation" - Notification sent when a new event is put on the calendar. - "eventChange" - Notification sent when an event is changed. - "eventCancellation" - Notification sent when an event is cancelled. - "eventResponse" - Notification sent when an attendee responds to the event invitation. - "agenda" - An agenda with the events of the day (sent out in the morning). Required when adding a notification. */
  type?: string
}

export type CalendarConferenceParametersAddOnParameters = {
  parameters?: Record<string, string>
}

export type CalendarColorDefinition = {
  /** The foreground color that can be used to write on top of a background with 'background' color. */
  foreground?: string
  /** The background color associated with this color definition. */
  background?: string
}

export type CalendarSettings = {
  /** List of user settings. */
  items?: Array<CalendarSetting>
  /** Token used to access the next page of this result. Omitted if no further results are available, in which case nextSyncToken is provided. */
  nextPageToken?: string
  /** Etag of the collection. */
  etag?: string
  /** Token used at a later point in time to retrieve only the entries that have changed since this result was returned. Omitted if further results are available, in which case nextPageToken is provided. */
  nextSyncToken?: string
  /** Type of the collection ("calendar#settings"). */
  kind?: string
}

export type CalendarEventFocusTimeProperties = {
  /** Response message to set if an existing event or new invitation is automatically declined by Calendar. */
  declineMessage?: string
  /** Whether to decline meeting invitations which overlap Focus Time events. Valid values are declineNone, meaning that no meeting invitations are declined; declineAllConflictingInvitations, meaning that all conflicting meeting invitations that conflict with the event are declined; and declineOnlyNewConflictingInvitations, meaning that only new conflicting meeting invitations which arrive while the Focus Time event is present are to be declined. */
  autoDeclineMode?: string
  /** The status to mark the user in Chat and related products. This can be available or doNotDisturb. */
  chatStatus?: string
}

export type CalendarAclRule = {
  /** ETag of the resource. */
  etag?: string
  /** Type of the resource ("calendar#aclRule"). */
  kind?: string
  /** Identifier of the Access Control List (ACL) rule. See Sharing calendars. */
  id?: string
  /** The role assigned to the scope. Possible values are: - "none" - Provides no access. - "freeBusyReader" - Provides read access to free/busy information. - "reader" - Provides read access to the calendar. Private events will appear to users with reader access, but event details will be hidden. - "writerWithoutPrivateAccess" - Provides read and write access to the calendar. Private events will appear to users with writerWithoutPrivateAccess access, but event details will be hidden. - "writer" - Provides read and write access to the calendar. Private events will appear to users with writer access, and event details will be visible. Provides read access to the calendar's ACLs. - "owner" - Provides manager access to the calendar. This role has all of the permissions of the writer role with the additional ability to modify access levels of other users. Important: the owner role is different from the calendar's data owner. A calendar has a single data owner, but can have multiple users with owner role. */
  role?: string
  /** The extent to which calendar access is granted by this ACL rule. */
  scope?: {
    /** The type of the scope. Possible values are: - "default" - The public scope. This is the default value. - "user" - Limits the scope to a single user. - "group" - Limits the scope to a group. - "domain" - Limits the scope to a domain. Note: The permissions granted to the "default", or public, scope apply to any user, authenticated or not. */
    type?: string
    /** The email address of a user or group, or the name of a domain, depending on the scope type. Omitted for type "default". */
    value?: string
  }
}

export type CalendarChannel = {
  /** A UUID or similar unique string that identifies this channel. */
  id?: string
  /** An arbitrary string delivered to the target address with each notification delivered over this channel. Optional. */
  token?: string
  /** Identifies this as a notification channel used to watch for changes to a resource, which is "api#channel". */
  kind?: string
  /** The type of delivery mechanism used for this channel. Valid values are "web_hook" (or "webhook"). Both values refer to a channel where Http requests are used to deliver messages. */
  type?: string
  /** Date and time of notification channel expiration, expressed as a Unix timestamp, in milliseconds. Optional. */
  expiration?: string
  /** An opaque ID that identifies the resource being watched on this channel. Stable across different API versions. */
  resourceId?: string
  /** The address where notifications are delivered for this channel. */
  address?: string
  /** A Boolean value to indicate whether payload is wanted. Optional. */
  payload?: boolean
  /** A version-specific identifier for the watched resource. */
  resourceUri?: string
  /** Additional parameters controlling delivery channel behavior. Optional. */
  params?: Record<string, string>
}

export type CalendarConferenceSolutionKey = {
  /** The conference solution type. If a client encounters an unfamiliar or empty type, it should still be able to display the entry points. However, it should disallow modifications. The possible values are: - "eventHangout" for Hangouts for consumers (deprecated; existing events may show this conference solution type but new conferences cannot be created) - "eventNamedHangout" for classic Hangouts for Google Workspace users (deprecated; existing events may show this conference solution type but new conferences cannot be created) - "hangoutsMeet" for Google Meet (http://meet.google.com) - "addOn" for 3P conference providers */
  type?: string
}

export type CalendarEventAttachment = {
  /** ID of the attached file. Read-only. For Google Drive files, this is the ID of the corresponding Files resource entry in the Drive API. */
  fileId?: string
  /** URL link to the attachment. For adding Google Drive file attachments use the same format as in alternateLink property of the Files resource in the Drive API. Required when adding an attachment. */
  fileUrl?: string
  /** Attachment title. */
  title?: string
  /** URL link to the attachment's icon. This field can only be modified for custom third-party attachments. */
  iconLink?: string
  /** Internet media type (MIME type) of the attachment. */
  mimeType?: string
}

export type CalendarError = {
  /** Domain, or broad category, of the error. */
  domain?: string
  /** Specific reason for the error. Some of the possible values are: - "groupTooBig" - The group of users requested is too large for a single query. - "tooManyCalendarsRequested" - The number of calendars requested is too large for a single query. - "notFound" - The requested resource was not found. - "internalError" - The API service has encountered an internal error. Additional error types may be added in the future, so clients should gracefully handle additional error statuses not included in this list. */
  reason?: string
}

export type CalendarColors = {
  /** A global palette of event colors, mapping from the color ID to its definition. An event resource may refer to one of these color IDs in its colorId field. Read-only. */
  event?: Record<string, CalendarColorDefinition>
  /** Type of the resource ("calendar#colors"). */
  kind?: string
  /** A global palette of calendar colors, mapping from the color ID to its definition. A calendarListEntry resource refers to one of these color IDs in its colorId field. Read-only. */
  calendar?: Record<string, CalendarColorDefinition>
  /** Last modification time of the color palette (as a RFC3339 timestamp). Read-only. */
  updated?: string
}

export type CalendarEvents = {
  /** Token used to access the next page of this result. Omitted if no further results are available, in which case nextSyncToken is provided. */
  nextPageToken?: string
  /** Last modification time of the calendar (as a RFC3339 timestamp). Read-only. */
  updated?: string
  /** ETag of the collection. */
  etag?: string
  /** Description of the calendar. Read-only. */
  description?: string
  /** Token used at a later point in time to retrieve only the entries that have changed since this result was returned. Omitted if further results are available, in which case nextPageToken is provided. */
  nextSyncToken?: string
  /** The default reminders on the calendar for the authenticated user. These reminders apply to all events on this calendar that do not explicitly override them (i.e. do not have reminders.useDefault set to True). */
  defaultReminders?: Array<CalendarEventReminder>
  /** Title of the calendar. Read-only. */
  summary?: string
  /** The time zone of the calendar. Read-only. */
  timeZone?: string
  /** The user's access role for this calendar. Read-only. Possible values are: - "none" - The user has no access. - "freeBusyReader" - The user has read access to free/busy information. - "reader" - The user has read access to the calendar. Private events will appear to users with reader access, but event details will be hidden. - "writerWithoutPrivateAccess" - The user has read and write access to the calendar. Private events will appear to users with writerWithoutPrivateAccess access, but event details will be hidden. - "writer" - The user has read and write access to the calendar. Private events will appear to users with writer access, and event details will be visible. - "owner" - The user has manager access to the calendar. This role has all of the permissions of the writer role with the additional ability to see and modify access levels of other users. Important: the owner role is different from the calendar's data owner. A calendar has a single data owner, but can have multiple users with owner role. */
  accessRole?: string
  /** Type of the collection ("calendar#events"). */
  kind?: string
  /** List of events on the calendar. */
  items?: Array<CalendarEvent>
}

export type CalendarCreateConferenceRequest = {
  /** The client-generated unique ID for this request. Clients should regenerate this ID for every new request. If an ID provided is the same as for the previous request, the request is ignored. */
  requestId?: string
  /** The conference solution, such as Hangouts or Google Meet. */
  conferenceSolutionKey?: CalendarConferenceSolutionKey
  /** The status of the conference create request. */
  status?: CalendarConferenceRequestStatus
}

export type CalendarEventBirthdayProperties = {
  /** Resource name of the contact this birthday event is linked to. This can be used to fetch contact details from People API. Format: "people/c12345". Read-only. */
  contact?: string
  /** Type of birthday or special event. Possible values are: - "anniversary" - An anniversary other than birthday. Always has a contact. - "birthday" - A birthday event. This is the default value. - "custom" - A special date whose label is further specified in the customTypeName field. Always has a contact. - "other" - A special date which does not fall into the other categories, and does not have a custom label. Always has a contact. - "self" - Calendar owner's own birthday. Cannot have a contact. The Calendar API only supports creating events with the type "birthday". The type cannot be changed after the event is created. */
  type?: string
  /** Custom type label specified for this event. This is populated if birthdayProperties.type is set to "custom". Read-only. */
  customTypeName?: string
}

export type CalendarEvent = {
  /** Description of the event. Can contain HTML. Optional. */
  description?: string
  /** The (inclusive) start time of the event. For a recurring event, this is the start time of the first instance. */
  start?: CalendarEventDateTime
  /** Status of the event. Optional. Possible values are: - "confirmed" - The event is confirmed. This is the default status. - "tentative" - The event is tentatively confirmed. - "cancelled" - The event is cancelled (deleted). The list method returns cancelled events only on incremental sync (when syncToken or updatedMin are specified) or if the showDeleted flag is set to true. The get method always returns them. A cancelled status represents two different states depending on the event type: - Cancelled exceptions of an uncancelled recurring event indicate that this instance should no longer be presented to the user. Clients should store these events for the lifetime of the parent recurring event. Cancelled exceptions are only guaranteed to have values for the id, recurringEventId and originalStartTime fields populated. The other fields might be empty. - All other cancelled events represent deleted events. Clients should remove their locally synced copies. Such cancelled events will eventually disappear, so do not rely on them being available indefinitely. Deleted events are only guaranteed to have the id field populated. On the organizer's calendar, cancelled events continue to expose event details (summary, location, etc.) so that they can be restored (undeleted). Similarly, the events to which the user was invited and that they manually removed continue to provide details. However, incremental sync requests with showDeleted set to false will not return these details. If an event changes its organizer (for example via the move operation) and the original organizer is not on the attendee list, it will leave behind a cancelled event where only the id field is guaranteed to be populated. */
  status?: string
  /** Sequence number as per iCalendar. */
  sequence?: number
  /** Focus Time event data. Used if eventType is focusTime. */
  focusTimeProperties?: CalendarEventFocusTimeProperties
  /** The color of the event. This is an ID referring to an entry in the event section of the colors definition (see the colors endpoint). Optional. */
  colorId?: string
  /** List of RRULE, EXRULE, RDATE and EXDATE lines for a recurring event, as specified in RFC5545. Note that DTSTART and DTEND lines are not allowed in this field; event start and end times are specified in the start and end fields. This field is omitted for single events or instances of recurring events. */
  recurrence?: Array<string>
  /** Geographic location of the event as free-form text. Optional. */
  location?: string
  /** Whether this is a locked event copy where no changes can be made to the main event fields "summary", "description", "location", "start", "end" or "recurrence". The default is False. Read-Only. */
  locked?: boolean
  /** Whether attendees other than the organizer can modify the event. Optional. The default is False. */
  guestsCanModify?: boolean
  /** An absolute link to this event in the Google Calendar Web UI. Read-only. */
  htmlLink?: string
  /** For an instance of a recurring event, this is the time at which this event would start according to the recurrence data in the recurring event identified by recurringEventId. It uniquely identifies the instance within the recurring event series even if the instance was moved to a different time. Immutable. */
  originalStartTime?: CalendarEventDateTime
  /** ETag of the resource. */
  etag?: string
  /** An absolute link to the Google Hangout associated with this event. Read-only. */
  hangoutLink?: string
  /** Working location event data. */
  workingLocationProperties?: CalendarEventWorkingLocationProperties
  /** Event unique identifier as defined in RFC5545. It is used to uniquely identify events accross calendaring systems and must be supplied when importing events via the import method. Note that the iCalUID and the id are not identical and only one of them should be supplied at event creation time. One difference in their semantics is that in recurring events, all occurrences of one event have different ids while they all share the same iCalUIDs. To retrieve an event using its iCalUID, call the events.list method using the iCalUID parameter. To retrieve an event using its id, call the events.get method. */
  iCalUID?: string
  /** The conference-related information, such as details of a Google Meet conference. To create new conference details use the createRequest field. To persist your changes, remember to set the conferenceDataVersion request parameter to 1 for all event modification requests. Warning: Reusing Google Meet conference data across different events can cause access issues and expose meeting details to unintended users. To help ensure meeting privacy, always generate a unique conference for each event by using the createRequest field. */
  conferenceData?: CalendarConferenceData
  /** Title of the event. */
  summary?: string
  /** Birthday or special event data. Used if eventType is "birthday". Immutable. */
  birthdayProperties?: CalendarEventBirthdayProperties
  /** The attendees of the event. See the Events with attendees guide for more information on scheduling events with other calendar users. Service accounts need to use domain-wide delegation of authority to populate the attendee list. */
  attendees?: Array<CalendarEventAttendee>
  /** Whether attendees may have been omitted from the event's representation. When retrieving an event, this may be due to a restriction specified by the maxAttendee query parameter. When updating an event, this can be used to only update the participant's response. Optional. The default is False. */
  attendeesOmitted?: boolean
  /** Extended properties of the event. */
  extendedProperties?: {
    /** Properties that are shared between copies of the event on other attendees' calendars. */
    shared?: Record<string, string>
    /** Properties that are private to the copy of the event that appears on this calendar. */
    private?: Record<string, string>
  }
  /** Source from which the event was created. For example, a web page, an email message or any document identifiable by an URL with HTTP or HTTPS scheme. Can only be seen or modified by the creator of the event. */
  source?: {
    /** Title of the source; for example a title of a web page or an email subject. */
    title?: string
    /** URL of the source pointing to a resource. The URL scheme must be HTTP or HTTPS. */
    url?: string
  }
  /** Last modification time of the main event data (as a RFC3339 timestamp). Updating event reminders will not cause this to change. Read-only. */
  updated?: string
  /** Whether attendees other than the organizer can see who the event's attendees are. Optional. The default is True. */
  guestsCanSeeOtherGuests?: boolean
  /** File attachments for the event. In order to modify attachments the supportsAttachments request parameter should be set to true. There can be at most 25 attachments per event, */
  attachments?: Array<CalendarEventAttachment>
  /** The ID of the event label assigned to the event. Optional. This refers to the ID of an entry in the labelProperties.eventLabels property of the calendar (see the Calendars.get endpoint.) This property supersedes the index-based colorId property. To set or change this property, you need to specify eventLabelVersion=1 in the parameters of the insert, import, update, and patch methods. Setting an empty string, or not setting this field at all, will remove the existing label from the event. */
  eventLabelId?: string
  /** Type of the resource ("calendar#event"). */
  kind?: string
  /** Visibility of the event. Optional. Possible values are: - "default" - Uses the default visibility for events on the calendar. This is the default value. - "public" - The event is public and event details are visible to all readers of the calendar. - "private" - The event is private and only event attendees may view event details. - "confidential" - The event is private. This value is provided for compatibility reasons. Note on recurring events: Changing the visibility of a single instance of a recurring event can affect all instances of the series. If the new setting is more restrictive (e.g. from public to private), it is applied to all instances. If the new setting is less restrictive (e.g. from private to public), the change is ignored. To make a recurring event less restrictive, you must update the parent recurring event. */
  visibility?: string
  /** Whether the event blocks time on the calendar. Optional. Possible values are: - "opaque" - Default value. The event does block time on the calendar. This is equivalent to setting Show me as to Busy in the Calendar UI. - "transparent" - The event does not block time on the calendar. This is equivalent to setting Show me as to Available in the Calendar UI. */
  transparency?: string
  /** The (exclusive) end time of the event. For a recurring event, this is the end time of the first instance. */
  end?: CalendarEventDateTime
  /** Whether the end time is actually unspecified. An end time is still provided for compatibility reasons, even if this attribute is set to True. The default is False. */
  endTimeUnspecified?: boolean
  /** The creator of the event. Read-only. */
  creator?: {
    /** The creator's email address, if available. */
    email?: string
    /** The creator's Profile ID, if available. */
    id?: string
    /** Whether the creator corresponds to the calendar on which this copy of the event appears. Read-only. The default is False. */
    self?: boolean
    /** The creator's name, if available. */
    displayName?: string
  }
  /** Specific type of the event. This cannot be modified after the event is created. Possible values are: - "birthday" - A special all-day event with an annual recurrence. - "default" - A regular event or not further specified. - "focusTime" - A focus-time event. - "fromGmail" - An event from Gmail. This type of event cannot be created. - "outOfOffice" - An out-of-office event. - "workingLocation" - A working location event. */
  eventType?: string
  /** Information about the event's reminders for the authenticated user. Note that changing reminders does not also change the updated property of the enclosing event. */
  reminders?: {
    /** If the event doesn't use the default reminders, this lists the reminders specific to the event, or, if not set, indicates that no reminders are set for this event. The maximum number of override reminders is 5. */
    overrides?: Array<CalendarEventReminder>
    /** Whether the default reminders of the calendar apply to the event. */
    useDefault?: boolean
  }
  /** Creation time of the event (as a RFC3339 timestamp). Read-only. */
  created?: string
  /** A gadget that extends this event. Gadgets are deprecated; this structure is instead only used for returning birthday calendar metadata. */
  gadget?: {
    /** The gadget's display mode. Deprecated. Possible values are: - "icon" - The gadget displays next to the event's title in the calendar view. - "chip" - The gadget displays when the event is clicked. */
    display?: string
    /** The gadget's URL. The URL scheme must be HTTPS. Deprecated. */
    link?: string
    /** The gadget's height in pixels. The height must be an integer greater than 0. Optional. Deprecated. */
    height?: number
    /** The gadget's width in pixels. The width must be an integer greater than 0. Optional. Deprecated. */
    width?: number
    /** The gadget's icon URL. The URL scheme must be HTTPS. Deprecated. */
    iconLink?: string
    /** The gadget's title. Deprecated. */
    title?: string
    /** The gadget's type. Deprecated. */
    type?: string
    /** Preferences. */
    preferences?: Record<string, string>
  }
  /** Whether anyone can invite themselves to the event (deprecated). Optional. The default is False. */
  anyoneCanAddSelf?: boolean
  /** Out of office event data. Used if eventType is outOfOffice. */
  outOfOfficeProperties?: CalendarEventOutOfOfficeProperties
  /** If set to True, Event propagation is disabled. Note that it is not the same thing as Private event properties. Optional. Immutable. The default is False. */
  privateCopy?: boolean
  /** For an instance of a recurring event, this is the id of the recurring event to which this instance belongs. Immutable. */
  recurringEventId?: string
  /** Whether attendees other than the organizer can invite others to the event. Optional. The default is True. */
  guestsCanInviteOthers?: boolean
  /** Opaque identifier of the event. When creating new single or recurring events, you can specify their IDs. Provided IDs must follow these rules: - characters allowed in the ID are those used in base32hex encoding, i.e. lowercase letters a-v and digits 0-9, see section 3.1.2 in RFC2938 - the length of the ID must be between 5 and 1024 characters - the ID must be unique per calendar Due to the globally distributed nature of the system, we cannot guarantee that ID collisions will be detected at event creation time. To minimize the risk of collisions we recommend using an established UUID algorithm such as one described in RFC4122. If you do not specify an ID, it will be automatically generated by the server. Note that the icalUID and the id are not identical and only one of them should be supplied at event creation time. One difference in their semantics is that in recurring events, all occurrences of one event have different ids while they all share the same icalUIDs. */
  id?: string
  /** The organizer of the event. If the organizer is also an attendee, this is indicated with a separate entry in attendees with the organizer field set to True. To change the organizer, use the move operation. Read-only, except when importing an event. */
  organizer?: {
    /** The organizer's Profile ID, if available. */
    id?: string
    /** The organizer's email address, if available. It must be a valid email address as per RFC5322. */
    email?: string
    /** The organizer's name, if available. */
    displayName?: string
    /** Whether the organizer corresponds to the calendar on which this copy of the event appears. Read-only. The default is False. */
    self?: boolean
  }
}

export type CalendarFreeBusyCalendar = {
  /** List of time ranges during which this calendar should be regarded as busy. */
  busy?: Array<CalendarTimePeriod>
  /** Optional error(s) (if computation for the calendar failed). */
  errors?: Array<CalendarError>
}

export type CalendarSetting = {
  /** ETag of the resource. */
  etag?: string
  /** Value of the user setting. The format of the value depends on the ID of the setting. It must always be a UTF-8 string of length up to 1024 characters. */
  value?: string
  /** Type of the resource ("calendar#setting"). */
  kind?: string
  /** The id of the user setting. */
  id?: string
}

export type CalendarConferenceParameters = {
  /** Additional add-on specific data. */
  addOnParameters?: CalendarConferenceParametersAddOnParameters
}

export type CalendarFreeBusyRequestItem = {
  /** The identifier of a calendar or a group. */
  id?: string
}

export type CalendarCalendar = {
  /** Label properties defined on this calendar. If specified, overwrites the existing label properties. If not specified, the label properties remain unchanged. */
  labelProperties?: CalendarLabelProperties
  /** Geographic location of the calendar as free-form text. Optional. */
  location?: string
  /** The time zone of the calendar. (Formatted as an IANA Time Zone Database name, e.g. "Europe/Zurich".) Optional. */
  timeZone?: string
  /** The email of the owner of the calendar. Set only for secondary calendars. Read-only. */
  dataOwner?: string
  /** Type of the resource ("calendar#calendar"). */
  kind?: string
  /** Identifier of the calendar. To retrieve IDs call the calendarList.list() method. */
  id?: string
  /** Title of the calendar. */
  summary?: string
  /** Conferencing properties for this calendar, for example what types of conferences are allowed. */
  conferenceProperties?: CalendarConferenceProperties
  /** ETag of the resource. */
  etag?: string
  /** Description of the calendar. Optional. */
  description?: string
  /** Whether this calendar automatically accepts invitations. Only valid for resource calendars. */
  autoAcceptInvitations?: boolean
}

export type CalendarConferenceProperties = {
  /** The types of conference solutions that are supported for this calendar. The possible values are: - "eventHangout" - "eventNamedHangout" - "hangoutsMeet" Optional. */
  allowedConferenceSolutionTypes?: Array<string>
}

export type CalendarEntryPoint = {
  /** The URI of the entry point. The maximum length is 1300 characters. Format: - for video, http: or https: schema is required. - for phone, tel: schema is required. The URI should include the entire dial sequence (e.g., tel:+12345678900,,,123456789;1234). - for sip, sip: schema is required, e.g., sip:12345678@myprovider.com. - for more, http: or https: schema is required. */
  uri?: string
  /** Features of the entry point, such as being toll or toll-free. One entry point can have multiple features. However, toll and toll-free cannot be both set on the same entry point. */
  entryPointFeatures?: Array<string>
  /** The label for the URI. Visible to end users. Not localized. The maximum length is 512 characters. Examples: - for video: meet.google.com/aaa-bbbb-ccc - for phone: +1 123 268 2601 - for sip: 12345678@altostrat.com - for more: should not be filled Optional. */
  label?: string
  /** The meeting code to access the conference. The maximum length is 128 characters. When creating new conference data, populate only the subset of {meetingCode, accessCode, passcode, password, pin} fields that match the terminology that the conference provider uses. Only the populated fields should be displayed. Optional. */
  meetingCode?: string
  /** The CLDR/ISO 3166 region code for the country associated with this phone access. Example: "SE" for Sweden. Calendar backend will populate this field only for EntryPointType.PHONE. */
  regionCode?: string
  /** The access code to access the conference. The maximum length is 128 characters. When creating new conference data, populate only the subset of {meetingCode, accessCode, passcode, password, pin} fields that match the terminology that the conference provider uses. Only the populated fields should be displayed. Optional. */
  accessCode?: string
  /** The passcode to access the conference. The maximum length is 128 characters. When creating new conference data, populate only the subset of {meetingCode, accessCode, passcode, password, pin} fields that match the terminology that the conference provider uses. Only the populated fields should be displayed. */
  passcode?: string
  /** The PIN to access the conference. The maximum length is 128 characters. When creating new conference data, populate only the subset of {meetingCode, accessCode, passcode, password, pin} fields that match the terminology that the conference provider uses. Only the populated fields should be displayed. Optional. */
  pin?: string
  /** The type of the conference entry point. Possible values are: - "video" - joining a conference over HTTP. A conference can have zero or one video entry point. - "phone" - joining a conference by dialing a phone number. A conference can have zero or more phone entry points. - "sip" - joining a conference over SIP. A conference can have zero or one sip entry point. - "more" - further conference joining instructions, for example additional phone numbers. A conference can have zero or one more entry point. A conference with only a more entry point is not a valid conference. */
  entryPointType?: string
  /** The password to access the conference. The maximum length is 128 characters. When creating new conference data, populate only the subset of {meetingCode, accessCode, passcode, password, pin} fields that match the terminology that the conference provider uses. Only the populated fields should be displayed. Optional. */
  password?: string
}

export type CalendarTimePeriod = {
  /** The (inclusive) start of the time period. */
  start?: string
  /** The (exclusive) end of the time period. */
  end?: string
}

export type CalendarCalendarListEntry = {
  /** Identifier of the calendar. */
  id?: string
  /** The summary that the authenticated user has set for this calendar. Optional. */
  summaryOverride?: string
  /** The main color of the calendar in the hexadecimal format "#0088aa". This property supersedes the index-based colorId property. To set or change this property, you need to specify colorRgbFormat=true in the parameters of the insert, update and patch methods. Optional. */
  backgroundColor?: string
  /** Whether the calendar has been hidden from the list. Optional. The attribute is only returned when the calendar is hidden, in which case the value is true. */
  hidden?: boolean
  /** The foreground color of the calendar in the hexadecimal format "#ffffff". This property supersedes the index-based colorId property. To set or change this property, you need to specify colorRgbFormat=true in the parameters of the insert, update and patch methods. Optional. */
  foregroundColor?: string
  /** Conferencing properties for this calendar, for example what types of conferences are allowed. */
  conferenceProperties?: CalendarConferenceProperties
  /** Whether the calendar is the primary calendar of the authenticated user. Read-only. Optional. The default is False. */
  primary?: boolean
  /** Geographic location of the calendar as free-form text. Optional. Read-only. */
  location?: string
  /** The time zone of the calendar. Optional. Read-only. */
  timeZone?: string
  /** The effective access role that the authenticated user has on the calendar. Read-only. Possible values are: - "freeBusyReader" - Provides read access to free/busy information. - "reader" - Provides read access to the calendar. Private events will appear to users with reader access, but event details will be hidden. - "writerWithoutPrivateAccess" - Provides read and write access to the calendar. Private events will appear to users with writerWithoutPrivateAccess access, but event details will be hidden. - "writer" - Provides read and write access to the calendar. Private events will appear to users with writer access, and event details will be visible. - "owner" - Provides manager access to the calendar. This role has all of the permissions of the writer role with the additional ability to see and modify access levels of other users. Important: the owner role is different from the calendar's data owner. A calendar has a single data owner, but can have multiple users with owner role. */
  accessRole?: string
  /** The notifications that the authenticated user is receiving for this calendar. */
  notificationSettings?: {
    /** The list of notifications set for this calendar. */
    notifications?: Array<CalendarCalendarNotification>
  }
  /** Title of the calendar. Read-only. */
  summary?: string
  /** Type of the resource ("calendar#calendarListEntry"). */
  kind?: string
  /** Whether the calendar content shows up in the calendar UI. Optional. The default is False. */
  selected?: boolean
  /** The email of the owner of the calendar. Set only for secondary calendars. Read-only. */
  dataOwner?: string
  /** Whether this calendar automatically accepts invitations. Only valid for resource calendars. Read-only. */
  autoAcceptInvitations?: boolean
  /** ETag of the resource. */
  etag?: string
  /** Description of the calendar. Optional. Read-only. */
  description?: string
  /** The color of the calendar. This is an ID referring to an entry in the calendar section of the colors definition (see the colors endpoint). This property is superseded by the backgroundColor and foregroundColor properties and can be ignored when using these properties. Optional. */
  colorId?: string
  /** The default reminders that the authenticated user has for this calendar. */
  defaultReminders?: Array<CalendarEventReminder>
  /** Whether this calendar list entry has been deleted from the calendar list. Read-only. Optional. The default is False. */
  deleted?: boolean
}

export type CalendarConferenceRequestStatus = {
  /** The current status of the conference create request. Read-only. The possible values are: - "pending": the conference create request is still being processed. - "success": the conference create request succeeded, the entry points are populated. - "failure": the conference create request failed, there are no entry points. */
  statusCode?: string
}

export type CalendarEventLabel = {
  /** Name of the label. Optional. If provided this must have at most 50 characters. */
  name?: string
  /** Background color of the label in hexadecimal format, such as "#039be5". Events with this label are displayed in this color. Required. */
  backgroundColor?: string
  /** The ID of the label. Optional when inserting a new label. If not provided, a unique ID will be generated. Required when updating a label. If provided, the ID must be unique within the calendar and follow UUID format. */
  id?: string
}

export type CalendarEventDateTime = {
  /** The time, as a combined date-time value (formatted according to RFC3339). A time zone offset is required unless a time zone is explicitly specified in timeZone. */
  dateTime?: string
  /** The time zone in which the time is specified. (Formatted as an IANA Time Zone Database name, e.g. "Europe/Zurich".) For recurring events this field is required and specifies the time zone in which the recurrence is expanded. For single events this field is optional and indicates a custom time zone for the event start/end. */
  timeZone?: string
  /** The date, in the format "yyyy-mm-dd", if this is an all-day event. */
  date?: string
}
