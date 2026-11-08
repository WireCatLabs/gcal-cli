import type { ManifestIdentity } from "@wirecat/cli-base/wcat/manifest"
import type { AppIdentity } from "@wirecat/cli-core/cli"
import { REASONS } from "./reasons.js"
import { VERSION } from "./version.js"

export const PACKAGE = "@wirecat/gcal-cli"

export const IDENTITY: AppIdentity = {
  command: "gcal",
  appName: "gcal-cli",
  envPrefix: "GCAL",
  description: "Google Calendar for the terminal, scripts and AI agents: sync, search and change events",
  version: VERSION,
  issues: "https://github.com/WireCatLabs/gcal-cli/issues/new",
  messenger: false,
  contentLanguages: ["en", "ru"],
  // One events.list page of up to 2500 events, or one series' events.instances, on an ordinary link; an estimate
  // until a live run measures it. The sync's request budget is the deadline, less its margin, divided by this.
  requestMs: 1_500,
  errors: { reasons: REASONS },
}

// What `wcat` and WireCat Desktop show before the tool is installed; src/wcat.ts adds the permission keys. `hosts` is
// also the list hostFetch holds every request to: a Google host missing here fails before anything is sent.
export const DESKTOP: ManifestIdentity & { hosts: readonly string[] } = {
  ...IDENTITY,
  docs: "https://github.com/WireCatLabs/gcal-cli#readme",
  tagline: "Google Calendar events, searchable on your computer",
  syncs: "calendars and their events",
  signIn: {
    gives: "Lets your agent read your Google calendars, and change events when you allow it.",
    asks: "Google asks you to sign in and allow read-only access to your calendars.",
  },
  hosts: ["accounts.google.com", "oauth2.googleapis.com", "openidconnect.googleapis.com", "www.googleapis.com"],
  userHosts: "the calendar feed (ICS) addresses you add",
}

export const SKILL = new URL("../skills/gcal-cli/SKILL.md", import.meta.url)
