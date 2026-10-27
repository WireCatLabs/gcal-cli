// GENERATED. DO NOT EDIT.
// Source: spec/google/*.json, verified by provenance.json
// Run: pnpm generate

import { integer } from "@wirecat/cli-base/codegen/runtime"
import * as v from "valibot"
import type * as T from "./types.js"

export const CalendarLabelProperties: v.GenericSchema<unknown, T.CalendarLabelProperties> = v.looseObject({
  eventLabels: v.optional(v.array(v.lazy(() => CalendarEventLabel))),
})

export const CalendarFreeBusyGroup: v.GenericSchema<unknown, T.CalendarFreeBusyGroup> = v.looseObject({
  calendars: v.optional(v.array(v.string())),
  errors: v.optional(v.array(v.lazy(() => CalendarError))),
})

export const CalendarEventOutOfOfficeProperties: v.GenericSchema<unknown, T.CalendarEventOutOfOfficeProperties> =
  v.looseObject({
    autoDeclineMode: v.optional(v.string()),
    declineMessage: v.optional(v.string()),
  })

export const CalendarEventWorkingLocationProperties: v.GenericSchema<
  unknown,
  T.CalendarEventWorkingLocationProperties
> = v.looseObject({
  type: v.optional(v.string()),
  officeLocation: v.optional(
    v.looseObject({
      label: v.optional(v.string()),
      deskId: v.optional(v.string()),
      buildingId: v.optional(v.string()),
      floorSectionId: v.optional(v.string()),
      floorId: v.optional(v.string()),
    }),
  ),
  customLocation: v.optional(
    v.looseObject({
      label: v.optional(v.string()),
    }),
  ),
  homeOffice: v.optional(v.unknown()),
})

export const CalendarFreeBusyResponse: v.GenericSchema<unknown, T.CalendarFreeBusyResponse> = v.looseObject({
  calendars: v.optional(
    v.record(
      v.string(),
      v.lazy(() => CalendarFreeBusyCalendar),
    ),
  ),
  groups: v.optional(
    v.record(
      v.string(),
      v.lazy(() => CalendarFreeBusyGroup),
    ),
  ),
  timeMin: v.optional(v.string()),
  kind: v.optional(v.string()),
  timeMax: v.optional(v.string()),
})

export const CalendarConferenceData: v.GenericSchema<unknown, T.CalendarConferenceData> = v.looseObject({
  conferenceSolution: v.optional(v.lazy(() => CalendarConferenceSolution)),
  notes: v.optional(v.string()),
  parameters: v.optional(v.lazy(() => CalendarConferenceParameters)),
  createRequest: v.optional(v.lazy(() => CalendarCreateConferenceRequest)),
  signature: v.optional(v.string()),
  entryPoints: v.optional(v.array(v.lazy(() => CalendarEntryPoint))),
  conferenceId: v.optional(v.string()),
})

export const CalendarAcl: v.GenericSchema<unknown, T.CalendarAcl> = v.looseObject({
  nextPageToken: v.optional(v.string()),
  nextSyncToken: v.optional(v.string()),
  etag: v.optional(v.string()),
  items: v.optional(v.array(v.lazy(() => CalendarAclRule))),
  kind: v.optional(v.string()),
})

export const CalendarCalendarList: v.GenericSchema<unknown, T.CalendarCalendarList> = v.looseObject({
  nextSyncToken: v.optional(v.string()),
  etag: v.optional(v.string()),
  kind: v.optional(v.string()),
  nextPageToken: v.optional(v.string()),
  items: v.optional(v.array(v.lazy(() => CalendarCalendarListEntry))),
})

export const CalendarEventReminder: v.GenericSchema<unknown, T.CalendarEventReminder> = v.looseObject({
  minutes: v.optional(integer()),
  method: v.optional(v.string()),
})

export const CalendarConferenceSolution: v.GenericSchema<unknown, T.CalendarConferenceSolution> = v.looseObject({
  key: v.optional(v.lazy(() => CalendarConferenceSolutionKey)),
  name: v.optional(v.string()),
  iconUri: v.optional(v.string()),
})

export const CalendarEventAttendee: v.GenericSchema<unknown, T.CalendarEventAttendee> = v.looseObject({
  displayName: v.optional(v.string()),
  additionalGuests: v.optional(integer()),
  responseStatus: v.optional(v.string()),
  resource: v.optional(v.boolean()),
  organizer: v.optional(v.boolean()),
  id: v.optional(v.string()),
  self: v.optional(v.boolean()),
  asyncOperation: v.optional(v.string()),
  comment: v.optional(v.string()),
  optional: v.optional(v.boolean()),
  email: v.optional(v.string()),
})

export const CalendarFreeBusyRequest: v.GenericSchema<unknown, T.CalendarFreeBusyRequest> = v.looseObject({
  items: v.optional(v.array(v.lazy(() => CalendarFreeBusyRequestItem))),
  calendarExpansionMax: v.optional(integer()),
  timeZone: v.optional(v.string()),
  timeMin: v.optional(v.string()),
  timeMax: v.optional(v.string()),
  groupExpansionMax: v.optional(integer()),
})

export const CalendarCalendarNotification: v.GenericSchema<unknown, T.CalendarCalendarNotification> = v.looseObject({
  method: v.optional(v.string()),
  type: v.optional(v.string()),
})

export const CalendarConferenceParametersAddOnParameters: v.GenericSchema<
  unknown,
  T.CalendarConferenceParametersAddOnParameters
> = v.looseObject({
  parameters: v.optional(v.record(v.string(), v.string())),
})

export const CalendarColorDefinition: v.GenericSchema<unknown, T.CalendarColorDefinition> = v.looseObject({
  foreground: v.optional(v.string()),
  background: v.optional(v.string()),
})

export const CalendarSettings: v.GenericSchema<unknown, T.CalendarSettings> = v.looseObject({
  items: v.optional(v.array(v.lazy(() => CalendarSetting))),
  nextPageToken: v.optional(v.string()),
  etag: v.optional(v.string()),
  nextSyncToken: v.optional(v.string()),
  kind: v.optional(v.string()),
})

export const CalendarEventFocusTimeProperties: v.GenericSchema<unknown, T.CalendarEventFocusTimeProperties> =
  v.looseObject({
    declineMessage: v.optional(v.string()),
    autoDeclineMode: v.optional(v.string()),
    chatStatus: v.optional(v.string()),
  })

export const CalendarAclRule: v.GenericSchema<unknown, T.CalendarAclRule> = v.looseObject({
  etag: v.optional(v.string()),
  kind: v.optional(v.string()),
  id: v.optional(v.string()),
  role: v.optional(v.string()),
  scope: v.optional(
    v.looseObject({
      type: v.optional(v.string()),
      value: v.optional(v.string()),
    }),
  ),
})

export const CalendarChannel: v.GenericSchema<unknown, T.CalendarChannel> = v.looseObject({
  id: v.optional(v.string()),
  token: v.optional(v.string()),
  kind: v.optional(v.string()),
  type: v.optional(v.string()),
  expiration: v.optional(v.pipe(v.string(), v.regex(/^-?\d+$/))),
  resourceId: v.optional(v.string()),
  address: v.optional(v.string()),
  payload: v.optional(v.boolean()),
  resourceUri: v.optional(v.string()),
  params: v.optional(v.record(v.string(), v.string())),
})

export const CalendarConferenceSolutionKey: v.GenericSchema<unknown, T.CalendarConferenceSolutionKey> = v.looseObject({
  type: v.optional(v.string()),
})

export const CalendarEventAttachment: v.GenericSchema<unknown, T.CalendarEventAttachment> = v.looseObject({
  fileId: v.optional(v.string()),
  fileUrl: v.optional(v.string()),
  title: v.optional(v.string()),
  iconLink: v.optional(v.string()),
  mimeType: v.optional(v.string()),
})

export const CalendarError: v.GenericSchema<unknown, T.CalendarError> = v.looseObject({
  domain: v.optional(v.string()),
  reason: v.optional(v.string()),
})

export const CalendarColors: v.GenericSchema<unknown, T.CalendarColors> = v.looseObject({
  event: v.optional(
    v.record(
      v.string(),
      v.lazy(() => CalendarColorDefinition),
    ),
  ),
  kind: v.optional(v.string()),
  calendar: v.optional(
    v.record(
      v.string(),
      v.lazy(() => CalendarColorDefinition),
    ),
  ),
  updated: v.optional(v.string()),
})

export const CalendarEvents: v.GenericSchema<unknown, T.CalendarEvents> = v.looseObject({
  nextPageToken: v.optional(v.string()),
  updated: v.optional(v.string()),
  etag: v.optional(v.string()),
  description: v.optional(v.string()),
  nextSyncToken: v.optional(v.string()),
  defaultReminders: v.optional(v.array(v.lazy(() => CalendarEventReminder))),
  summary: v.optional(v.string()),
  timeZone: v.optional(v.string()),
  accessRole: v.optional(v.string()),
  kind: v.optional(v.string()),
  items: v.optional(v.array(v.lazy(() => CalendarEvent))),
})

export const CalendarCreateConferenceRequest: v.GenericSchema<unknown, T.CalendarCreateConferenceRequest> =
  v.looseObject({
    requestId: v.optional(v.string()),
    conferenceSolutionKey: v.optional(v.lazy(() => CalendarConferenceSolutionKey)),
    status: v.optional(v.lazy(() => CalendarConferenceRequestStatus)),
  })

export const CalendarEventBirthdayProperties: v.GenericSchema<unknown, T.CalendarEventBirthdayProperties> =
  v.looseObject({
    contact: v.optional(v.string()),
    type: v.optional(v.string()),
    customTypeName: v.optional(v.string()),
  })

export const CalendarEvent: v.GenericSchema<unknown, T.CalendarEvent> = v.looseObject({
  description: v.optional(v.string()),
  start: v.optional(v.lazy(() => CalendarEventDateTime)),
  status: v.optional(v.string()),
  sequence: v.optional(integer()),
  focusTimeProperties: v.optional(v.lazy(() => CalendarEventFocusTimeProperties)),
  colorId: v.optional(v.string()),
  recurrence: v.optional(v.array(v.string())),
  location: v.optional(v.string()),
  locked: v.optional(v.boolean()),
  guestsCanModify: v.optional(v.boolean()),
  htmlLink: v.optional(v.string()),
  originalStartTime: v.optional(v.lazy(() => CalendarEventDateTime)),
  etag: v.optional(v.string()),
  hangoutLink: v.optional(v.string()),
  workingLocationProperties: v.optional(v.lazy(() => CalendarEventWorkingLocationProperties)),
  iCalUID: v.optional(v.string()),
  conferenceData: v.optional(v.lazy(() => CalendarConferenceData)),
  summary: v.optional(v.string()),
  birthdayProperties: v.optional(v.lazy(() => CalendarEventBirthdayProperties)),
  attendees: v.optional(v.array(v.lazy(() => CalendarEventAttendee))),
  attendeesOmitted: v.optional(v.boolean()),
  extendedProperties: v.optional(
    v.looseObject({
      shared: v.optional(v.record(v.string(), v.string())),
      private: v.optional(v.record(v.string(), v.string())),
    }),
  ),
  source: v.optional(
    v.looseObject({
      title: v.optional(v.string()),
      url: v.optional(v.string()),
    }),
  ),
  updated: v.optional(v.string()),
  guestsCanSeeOtherGuests: v.optional(v.boolean()),
  attachments: v.optional(v.array(v.lazy(() => CalendarEventAttachment))),
  eventLabelId: v.optional(v.string()),
  kind: v.optional(v.string()),
  visibility: v.optional(v.string()),
  transparency: v.optional(v.string()),
  end: v.optional(v.lazy(() => CalendarEventDateTime)),
  endTimeUnspecified: v.optional(v.boolean()),
  creator: v.optional(
    v.looseObject({
      email: v.optional(v.string()),
      id: v.optional(v.string()),
      self: v.optional(v.boolean()),
      displayName: v.optional(v.string()),
    }),
  ),
  eventType: v.optional(v.string()),
  reminders: v.optional(
    v.looseObject({
      overrides: v.optional(v.array(v.lazy(() => CalendarEventReminder))),
      useDefault: v.optional(v.boolean()),
    }),
  ),
  created: v.optional(v.string()),
  gadget: v.optional(
    v.looseObject({
      display: v.optional(v.string()),
      link: v.optional(v.string()),
      height: v.optional(integer()),
      width: v.optional(integer()),
      iconLink: v.optional(v.string()),
      title: v.optional(v.string()),
      type: v.optional(v.string()),
      preferences: v.optional(v.record(v.string(), v.string())),
    }),
  ),
  anyoneCanAddSelf: v.optional(v.boolean()),
  outOfOfficeProperties: v.optional(v.lazy(() => CalendarEventOutOfOfficeProperties)),
  privateCopy: v.optional(v.boolean()),
  recurringEventId: v.optional(v.string()),
  guestsCanInviteOthers: v.optional(v.boolean()),
  id: v.optional(v.string()),
  organizer: v.optional(
    v.looseObject({
      id: v.optional(v.string()),
      email: v.optional(v.string()),
      displayName: v.optional(v.string()),
      self: v.optional(v.boolean()),
    }),
  ),
})

export const CalendarFreeBusyCalendar: v.GenericSchema<unknown, T.CalendarFreeBusyCalendar> = v.looseObject({
  busy: v.optional(v.array(v.lazy(() => CalendarTimePeriod))),
  errors: v.optional(v.array(v.lazy(() => CalendarError))),
})

export const CalendarSetting: v.GenericSchema<unknown, T.CalendarSetting> = v.looseObject({
  etag: v.optional(v.string()),
  value: v.optional(v.string()),
  kind: v.optional(v.string()),
  id: v.optional(v.string()),
})

export const CalendarConferenceParameters: v.GenericSchema<unknown, T.CalendarConferenceParameters> = v.looseObject({
  addOnParameters: v.optional(v.lazy(() => CalendarConferenceParametersAddOnParameters)),
})

export const CalendarFreeBusyRequestItem: v.GenericSchema<unknown, T.CalendarFreeBusyRequestItem> = v.looseObject({
  id: v.optional(v.string()),
})

export const CalendarCalendar: v.GenericSchema<unknown, T.CalendarCalendar> = v.looseObject({
  labelProperties: v.optional(v.lazy(() => CalendarLabelProperties)),
  location: v.optional(v.string()),
  timeZone: v.optional(v.string()),
  dataOwner: v.optional(v.string()),
  kind: v.optional(v.string()),
  id: v.optional(v.string()),
  summary: v.optional(v.string()),
  conferenceProperties: v.optional(v.lazy(() => CalendarConferenceProperties)),
  etag: v.optional(v.string()),
  description: v.optional(v.string()),
  autoAcceptInvitations: v.optional(v.boolean()),
})

export const CalendarConferenceProperties: v.GenericSchema<unknown, T.CalendarConferenceProperties> = v.looseObject({
  allowedConferenceSolutionTypes: v.optional(v.array(v.string())),
})

export const CalendarEntryPoint: v.GenericSchema<unknown, T.CalendarEntryPoint> = v.looseObject({
  uri: v.optional(v.string()),
  entryPointFeatures: v.optional(v.array(v.string())),
  label: v.optional(v.string()),
  meetingCode: v.optional(v.string()),
  regionCode: v.optional(v.string()),
  accessCode: v.optional(v.string()),
  passcode: v.optional(v.string()),
  pin: v.optional(v.string()),
  entryPointType: v.optional(v.string()),
  password: v.optional(v.string()),
})

export const CalendarTimePeriod: v.GenericSchema<unknown, T.CalendarTimePeriod> = v.looseObject({
  start: v.optional(v.string()),
  end: v.optional(v.string()),
})

export const CalendarCalendarListEntry: v.GenericSchema<unknown, T.CalendarCalendarListEntry> = v.looseObject({
  id: v.optional(v.string()),
  summaryOverride: v.optional(v.string()),
  backgroundColor: v.optional(v.string()),
  hidden: v.optional(v.boolean()),
  foregroundColor: v.optional(v.string()),
  conferenceProperties: v.optional(v.lazy(() => CalendarConferenceProperties)),
  primary: v.optional(v.boolean()),
  location: v.optional(v.string()),
  timeZone: v.optional(v.string()),
  accessRole: v.optional(v.string()),
  notificationSettings: v.optional(
    v.looseObject({
      notifications: v.optional(v.array(v.lazy(() => CalendarCalendarNotification))),
    }),
  ),
  summary: v.optional(v.string()),
  kind: v.optional(v.string()),
  selected: v.optional(v.boolean()),
  dataOwner: v.optional(v.string()),
  autoAcceptInvitations: v.optional(v.boolean()),
  etag: v.optional(v.string()),
  description: v.optional(v.string()),
  colorId: v.optional(v.string()),
  defaultReminders: v.optional(v.array(v.lazy(() => CalendarEventReminder))),
  deleted: v.optional(v.boolean()),
})

export const CalendarConferenceRequestStatus: v.GenericSchema<unknown, T.CalendarConferenceRequestStatus> =
  v.looseObject({
    statusCode: v.optional(v.string()),
  })

export const CalendarEventLabel: v.GenericSchema<unknown, T.CalendarEventLabel> = v.looseObject({
  name: v.optional(v.string()),
  backgroundColor: v.optional(v.string()),
  id: v.optional(v.string()),
})

export const CalendarEventDateTime: v.GenericSchema<unknown, T.CalendarEventDateTime> = v.looseObject({
  dateTime: v.optional(v.string()),
  timeZone: v.optional(v.string()),
  date: v.optional(v.string()),
})

export const schemas = {
  CalendarLabelProperties,
  CalendarFreeBusyGroup,
  CalendarEventOutOfOfficeProperties,
  CalendarEventWorkingLocationProperties,
  CalendarFreeBusyResponse,
  CalendarConferenceData,
  CalendarAcl,
  CalendarCalendarList,
  CalendarEventReminder,
  CalendarConferenceSolution,
  CalendarEventAttendee,
  CalendarFreeBusyRequest,
  CalendarCalendarNotification,
  CalendarConferenceParametersAddOnParameters,
  CalendarColorDefinition,
  CalendarSettings,
  CalendarEventFocusTimeProperties,
  CalendarAclRule,
  CalendarChannel,
  CalendarConferenceSolutionKey,
  CalendarEventAttachment,
  CalendarError,
  CalendarColors,
  CalendarEvents,
  CalendarCreateConferenceRequest,
  CalendarEventBirthdayProperties,
  CalendarEvent,
  CalendarFreeBusyCalendar,
  CalendarSetting,
  CalendarConferenceParameters,
  CalendarFreeBusyRequestItem,
  CalendarCalendar,
  CalendarConferenceProperties,
  CalendarEntryPoint,
  CalendarTimePeriod,
  CalendarCalendarListEntry,
  CalendarConferenceRequestStatus,
  CalendarEventLabel,
  CalendarEventDateTime,
} as const
