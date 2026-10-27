<!--
GENERATED. DO NOT EDIT.
Source: spec/google/*.json, verified by provenance.json
Run: pnpm generate
-->

# Google Calendar API coverage

33 operations from other.

| Operation | Call | Command | Effect | Request source | Status | Summary |
|---|---|---|---|---|---|---|
| `calendar.acl.delete` | `DELETE calendars/{calendarId}/acl/{ruleId}` | `gcal <profile> api calendar-acl-delete` | destructive | — | generated | Deletes an access control rule. |
| `calendar.acl.get` | `GET calendars/{calendarId}/acl/{ruleId}` | `gcal <profile> api calendar-acl-get` | read | — | generated | Returns an access control rule. |
| `calendar.acl.insert` | `POST calendars/{calendarId}/acl` | `gcal <profile> api calendar-acl-insert` | write | contract | generated | Creates an access control rule. |
| `calendar.acl.list` | `GET calendars/{calendarId}/acl` | `gcal <profile> api calendar-acl-list` | read | — | generated | Returns the rules in the access control list for the calendar. |
| `calendar.acl.patch` | `PATCH calendars/{calendarId}/acl/{ruleId}` | `gcal <profile> api calendar-acl-patch` | write | contract | generated | Updates an access control rule. This method supports patch semantics. |
| `calendar.acl.update` | `PUT calendars/{calendarId}/acl/{ruleId}` | `gcal <profile> api calendar-acl-update` | write | contract | generated | Updates an access control rule. |
| `calendar.calendarList.delete` | `DELETE users/me/calendarList/{calendarId}` | `gcal <profile> api calendar-calendar-list-delete` | destructive | — | generated | Removes a calendar from the user's calendar list. |
| `calendar.calendarList.get` | `GET users/me/calendarList/{calendarId}` | `gcal <profile> api calendar-calendar-list-get` | read | — | generated | Returns a calendar from the user's calendar list. |
| `calendar.calendarList.insert` | `POST users/me/calendarList` | `gcal <profile> api calendar-calendar-list-insert` | write | contract | generated | Inserts an existing calendar into the user's calendar list. |
| `calendar.calendarList.list` | `GET users/me/calendarList` | `gcal <profile> api calendar-calendar-list-list` | read | — | generated | Returns the calendars on the user's calendar list. |
| `calendar.calendarList.patch` | `PATCH users/me/calendarList/{calendarId}` | `gcal <profile> api calendar-calendar-list-patch` | write | contract | generated | Updates an existing calendar on the user's calendar list. This method supports patch semantics. |
| `calendar.calendarList.update` | `PUT users/me/calendarList/{calendarId}` | `gcal <profile> api calendar-calendar-list-update` | write | contract | generated | Updates an existing calendar on the user's calendar list. |
| `calendar.calendars.clear` | `POST calendars/{calendarId}/clear` | `gcal <profile> api calendar-calendars-clear` | destructive | — | generated | Clears a primary calendar. This operation deletes all events associated with the primary calendar of an account. |
| `calendar.calendars.delete` | `DELETE calendars/{calendarId}` | `gcal <profile> api calendar-calendars-delete` | destructive | — | generated | Deletes a secondary calendar. Use calendars.clear for clearing all events on primary calendars. |
| `calendar.calendars.get` | `GET calendars/{calendarId}` | `gcal <profile> api calendar-calendars-get` | read | — | generated | Returns metadata for a calendar. |
| `calendar.calendars.insert` | `POST calendars` | `gcal <profile> api calendar-calendars-insert` | write | contract | generated | Creates a secondary calendar. |
| `calendar.calendars.patch` | `PATCH calendars/{calendarId}` | `gcal <profile> api calendar-calendars-patch` | write | contract | generated | Updates metadata for a calendar. This method supports patch semantics. |
| `calendar.calendars.transferOwnership` | `POST calendars/{calendarId}/transferOwnership` | `gcal <profile> api calendar-calendars-transfer-ownership` | destructive | — | generated | Transfers a secondary calendar between users within a Google Workspace organization. Requires user authentication with Manage Calendars administrator privilege, and one of the following authorization scopes: |
| `calendar.calendars.update` | `PUT calendars/{calendarId}` | `gcal <profile> api calendar-calendars-update` | write | contract | generated | Updates metadata for a calendar. |
| `calendar.colors.get` | `GET colors` | `gcal <profile> api calendar-colors-get` | read | — | generated | Returns the color definitions for calendars and events. |
| `calendar.events.delete` | `DELETE calendars/{calendarId}/events/{eventId}` | `gcal <profile> api calendar-events-delete` | destructive | — | generated | Deletes an event. |
| `calendar.events.get` | `GET calendars/{calendarId}/events/{eventId}` | `gcal <profile> api calendar-events-get` | read | — | generated | Returns an event based on its Google Calendar ID. To retrieve an event using its iCalendar ID, call the events.list method using the iCalUID parameter. |
| `calendar.events.import` | `POST calendars/{calendarId}/events/import` | `gcal <profile> api calendar-events-import` | write | contract | generated | Imports an event. This operation is used to add a private copy of an existing event to a calendar. Only events with an eventType of default may be imported. |
| `calendar.events.insert` | `POST calendars/{calendarId}/events` | `gcal <profile> api calendar-events-insert` | write | contract | generated | Creates an event. |
| `calendar.events.instances` | `GET calendars/{calendarId}/events/{eventId}/instances` | `gcal <profile> api calendar-events-instances` | read | — | generated | Returns instances of the specified recurring event. |
| `calendar.events.list` | `GET calendars/{calendarId}/events` | `gcal <profile> api calendar-events-list` | read | — | generated | Returns events on the specified calendar. |
| `calendar.events.move` | `POST calendars/{calendarId}/events/{eventId}/move` | `gcal <profile> api calendar-events-move` | write | — | generated | Moves an event to another calendar, i.e. changes an event's organizer. Note that only default events can be moved; birthday, focusTime, fromGmail, outOfOffice and workingLocation events cannot be moved. |
| `calendar.events.patch` | `PATCH calendars/{calendarId}/events/{eventId}` | `gcal <profile> api calendar-events-patch` | write | contract | generated | Updates an event. This method supports patch semantics. |
| `calendar.events.quickAdd` | `POST calendars/{calendarId}/events/quickAdd` | `gcal <profile> api calendar-events-quick-add` | write | — | generated | Creates an event based on a simple text string. |
| `calendar.events.update` | `PUT calendars/{calendarId}/events/{eventId}` | `gcal <profile> api calendar-events-update` | write | contract | generated | Updates an event. |
| `calendar.freebusy.query` | `POST freeBusy` | `gcal <profile> api calendar-freebusy-query` | read | contract | generated | Returns free/busy information for a set of calendars. |
| `calendar.settings.get` | `GET users/me/settings/{setting}` | `gcal <profile> api calendar-settings-get` | read | — | generated | Returns a single user setting. |
| `calendar.settings.list` | `GET users/me/settings` | `gcal <profile> api calendar-settings-list` | read | — | generated | Returns all user settings for the authenticated user. |
