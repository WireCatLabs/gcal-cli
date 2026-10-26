import type { AppIdentity } from "@wirecat/cli-core/cli"
import { VERSION } from "./version.js"

export const PACKAGE = "@wirecat/gcal-cli"

export const IDENTITY: AppIdentity = {
  command: "gcal",
  appName: "gcal-cli",
  envPrefix: "GCAL",
  description: "a new WireCat CLI, started from cli-template",
  version: VERSION,
  issues: "https://github.com/WireCatLabs/gcal-cli/issues/new",
  messenger: false,
  contentLanguages: ["en", "ru"],
}

export const SKILL = new URL("../skills/gcal-cli/SKILL.md", import.meta.url)
