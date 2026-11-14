import { openAppStore } from "@wirecat/cli-core/cli"
import type { MessageStore } from "@wirecat/cli-core/store"
import { IDENTITY } from "./identity.js"

export const PROVIDER = {
  name: "google-calendar",
  kind: "events",
  aliases: ["gcal", "calendar"],
  command: IDENTITY.command,
} as const

/**
 * Google Meet calls, kept as meetings beside the calendar's events under the same Google address. cli-core's own entry
 * names another command; this one, written on every store open that writes, points its hints at gcal.
 */
export const MEET_PROVIDER = { name: "google-meet", kind: "meetings", aliases: [], command: IDENTITY.command } as const

/** The upgrade contract's seed opens the store through this name in the previous release, so it stays. */
export const openGcalStore = (env: NodeJS.ProcessEnv, { readOnly = false } = {}): Promise<MessageStore> =>
  openAppStore(env, { app: IDENTITY, provider: PROVIDER, readOnly })
