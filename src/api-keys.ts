import { EVENTS_DELETE_SERIES_KEY, EVENTS_NOTIFY_KEY } from "@wirecat/cli-core/calendar"

export { EVENTS_DELETE_SERIES_KEY, EVENTS_NOTIFY_KEY }

/** Google mailing the person a calendar is shared with. Its own key, as `events.notify` is for attendees (WC-PERM-22). */
export const SHARING_NOTIFY_KEY = "sharing.notify"

/** The events methods that take `sendUpdates` and `sendNotifications` (Discovery snapshot, spec/google/calendar.json). */
const MAILING = new Set([
  "calendar.events.insert",
  "calendar.events.patch",
  "calendar.events.update",
  "calendar.events.delete",
  "calendar.events.move",
  "calendar.events.quickAdd",
])

/**
 * Whether Google mails the attendees. Left out, both mean no mail: Google documents `sendNotifications` as false by
 * default and `sendUpdates` as taking its place
 * (https://developers.google.com/workspace/calendar/api/v3/reference/events/insert#parameters).
 */
export const notifies = (method: string, params: Record<string, unknown>): boolean => {
  if (!MAILING.has(method)) return false
  const updates = params.sendUpdates
  if (updates !== undefined && updates !== null && updates !== "none") return true
  return params.sendNotifications === true || params.sendNotifications === "true"
}

const SHARING = new Set(["calendar.acl.insert", "calendar.acl.patch", "calendar.acl.update"])

/**
 * Whether Google mails the person a calendar is shared with. Unlike events, left out means it does: "The default is
 * True" (https://developers.google.com/workspace/calendar/api/v3/reference/acl/insert#parameters). `acl.delete` mails
 * nobody ("there are no notifications on access removal").
 */
export const notifiesSharing = (method: string, params: Record<string, unknown>): boolean =>
  SHARING.has(method) && params.sendNotifications !== false && params.sendNotifications !== "false"

/** A write that removes the event it names: a delete, or a patch or update to `status: "cancelled"`. */
export const cancels = (method: string, body: Record<string, unknown> | undefined): boolean =>
  method === "calendar.events.delete" ||
  ((method === "calendar.events.patch" || method === "calendar.events.update") && body?.status === "cancelled")

/** Google omits `recurrence` for single events and for one occurrence of a series. */
export const isSeries = (event: unknown): boolean => {
  if (typeof event !== "object" || event === null || !("recurrence" in event)) return false
  return Array.isArray(event.recurrence) && event.recurrence.length > 0
}

/** The events command each method does the work of, reads too, so `api` cannot get round `events.delete: deny`. */
const COMMAND_KEYS: Record<string, string> = {
  "calendar.events.list": "events.list",
  "calendar.events.instances": "events.list",
  "calendar.events.get": "events.show",
  "calendar.events.insert": "events.create",
  "calendar.events.quickAdd": "events.create",
  "calendar.events.import": "events.import",
  "calendar.events.patch": "events.update",
  "calendar.events.update": "events.update",
  "calendar.events.delete": "events.delete",
  "calendar.events.move": "events.move",
}

const CANCELLED = "the body sets status cancelled"

/** The command keys a call checks besides its own; a body that cancels the event is a delete. */
export const commandKeysOf = (method: string, body?: Record<string, unknown>): string[] => {
  const key = COMMAND_KEYS[method]
  if (!key) return []
  return key !== "events.delete" && cancels(method, body) ? [key, "events.delete"] : [key]
}

/** What `api show` names: the keys every call checks, and the delete a cancelling body adds. */
export const describedKeysOf = (method: string): (string | { key: string; when: string })[] => {
  const keys: (string | { key: string; when: string })[] = commandKeysOf(method)
  return cancels(method, { status: "cancelled" }) && method !== "calendar.events.delete"
    ? [...keys, { key: "events.delete", when: CANCELLED }]
    : keys
}
