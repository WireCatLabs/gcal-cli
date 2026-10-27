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
  errors: { reasons: REASONS },
}

export const SKILL = new URL("../skills/gcal-cli/SKILL.md", import.meta.url)
