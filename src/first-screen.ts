import { fileURLToPath } from "node:url"
import { metaOf } from "@wirecat/cli-base/commands"
import { type FirstScreen, guideCommand, type HelpSection, inSection, MEMO_SCENARIOS } from "@wirecat/cli-core/cli"
import type { Command } from "commander"
import { IDENTITY } from "./identity.js"

const SECTIONS: Record<string, HelpSection> = {
  calendars: "read",
  status: "read",
  people: "read",
  links: "organise",
  api: "read",
  sync: "automate",
  session: "setup",
}

export const guide = () =>
  guideCommand(IDENTITY, {
    directory: fileURLToPath(new URL("../scenarios", import.meta.url)),
    worksWith: [MEMO_SCENARIOS.personBrief],
  })

export const FIRST_SCREEN: FirstScreen = {
  pitch: "Google Calendar in a local store: search it offline, find free time, change events.",
  can: [
    { command: "calendars sync <calendar>", does: "choose calendars; only these are copied" },
    { command: "sync", does: "copy what changed since the last sync" },
    { command: 'search "budget review"', does: "every stored event, by words and meaning, offline" },
    { command: "events list week person:ana@example.com", does: "this week's events with one person" },
    { command: "calendars busy week --duration-minutes 30", does: "free stretches the calendars share" },
    { command: "events create <calendar> --title …", does: "add an event; attendees are mailed only if you say" },
    { command: "--read-only …", does: "this run refuses every change" },
  ],
  start: `${IDENTITY.command} personal session start`,
}

/** Sections for `commands`: gcal's own groups; `events` splits, its reads apart from the commands that change Google. */
export const placeInSections = (program: Command) => {
  for (const command of program.commands) {
    const section = SECTIONS[command.name()]
    if (section) inSection(command, section)
    if (command.name() === "events")
      for (const child of command.commands)
        inSection(child, metaOf(child).effects?.remote === "write" ? "write" : "read")
  }
}
