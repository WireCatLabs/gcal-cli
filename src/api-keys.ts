import { EVENTS_DELETE_SERIES_KEY, EVENTS_NOTIFY_KEY } from "@wirecat/cli-core/calendar"
import type { Asker, GuardRequest, Level, SendGuard } from "@wirecat/cli-core/sends"

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

/**
 * The profile's guard over a write's main key and its extra keys, as cli-core's calendar writes check theirs: a key
 * that refuses refuses before anything is asked, and one question names every key at `ask`. Extra keys are probed
 * as reads, so the write itself holds the one journal line.
 */
export const keyedGuard = (
  build: (ask: Asker) => SendGuard,
  ask: Asker,
  levelOf: (key: string) => Level,
  extra: readonly string[],
): SendGuard & { refuse(request: GuardRequest): void } => {
  let question: string | undefined
  let answered = false
  const guard = build(async (key, request) => {
    if (answered) return
    await ask(question || key, request)
    answered = true
  })
  const probes = new WeakMap<GuardRequest, GuardRequest[]>()
  const all = (request: GuardRequest) => {
    let found = probes.get(request)
    if (!found) {
      found = extra.map((key): GuardRequest => ({ chatId: null, kind: "read", key }))
      probes.set(request, found)
    }
    return [request, ...found]
  }
  const refuse = (request: GuardRequest) => {
    const refused = all(request).find(({ key }) => ["deny", "readonly"].includes(levelOf(key ?? "")))
    if (refused) guard.check(refused, { reserve: false })
  }
  return {
    refuse,
    ask: async (request) => {
      refuse(request)
      question = all(request)
        .filter(({ key }) => levelOf(key ?? "") === "ask")
        .map(({ key }) => key)
        .join(" and ")
      for (const one of all(request)) await guard.ask?.(one)
    },
    check: (request, options) => {
      for (const one of all(request).slice(1)) guard.check(one, { reserve: false })
      guard.check(request, options)
    },
    ...(guard.reserve ? { reserve: guard.reserve } : {}),
    record: (entry) => guard.record(entry),
  }
}
