import { isAbsolute } from "node:path"
import { annotate, overrideSharedContract } from "@wirecat/cli-base/commands"
import { EVENTS_REMIND_HOOK_KEY } from "@wirecat/cli-core/calendar"
import { baseContext, parseDuration, scheduleCommandFor } from "@wirecat/cli-core/cli"
import { levelFor } from "@wirecat/cli-core/sends"
import type { Command } from "commander"
import { configuration, permissions } from "../config.js"
import { IDENTITY } from "../identity.js"

const contextOf = (command: Command, resolving?: { needsProfile?: boolean }) => {
  const base = baseContext(command, (flags, options) =>
    configuration.resolveSettings(flags, { ...options, ...resolving }),
  )
  return { ...base, profile: base.settings.profile }
}

/** `events remind`'s window and program, from the words a schedule runs; undefined for any other command. */
const remindOf = (args: readonly string[]) => {
  if (args[0] !== "events" || args[1] !== "remind") return undefined
  const words = args.slice(2)
  let dueWithin = "10m"
  for (let at = 0; at < words.length; at++) {
    const word = words[at] ?? ""
    if (word === "--") return { dueWithin, program: words.slice(at + 1), words }
    if (word === "--due-within") dueWithin = words[++at] ?? dueWithin
    else if (word.startsWith("--due-within=")) dueWithin = word.slice("--due-within=".length)
    else if (!word.startsWith("-")) return { dueWithin, program: words.slice(at), words }
  }
  return { dueWithin, program: [], words }
}

const minutesOf = (duration: string | undefined, name: string) => {
  try {
    return duration === undefined ? undefined : parseDuration(duration, name) / 60_000
  } catch {
    return undefined
  }
}

/** What would make a scheduled `events remind` fail or miss meetings on every run, said when it is installed. */
export const remindNotices = (
  args: readonly string[],
  every: string | undefined,
  settings: { profile: string; permissions: Parameters<typeof levelFor>[0] },
): string[] => {
  const remind = remindOf(args)
  if (!remind) return []
  const notices: string[] = []
  const window = minutesOf(remind.dueWithin, "--due-within")
  const interval = minutesOf(every, "--every")
  if (window !== undefined && interval !== undefined && interval > window)
    notices.push(
      `the timer runs every ${every} but reminds only ${remind.dueWithin} ahead, so a meeting can start between two ` +
        `runs unreminded — use --every ${remind.dueWithin} or less`,
    )
  const [program] = remind.program
  if (program === undefined || remind.words.includes("--dry-run")) return notices
  if (!isAbsolute(program) && /[\\/]/.test(program))
    notices.push(`${program} is a relative path, and the timer runs from the schedule's folder — give its full path`)
  const allow = `\`${IDENTITY.command} ${settings.profile} config set permissions.${EVENTS_REMIND_HOOK_KEY} allow\``
  const { level } = levelFor(settings.permissions, EVENTS_REMIND_HOOK_KEY, permissions.defaults)
  if (level === "deny" || level === "readonly")
    notices.push(
      `${EVENTS_REMIND_HOOK_KEY} is ${level} for profile ${settings.profile}, so every run refuses to start ` +
        `${program} until you allow it: ${allow}`,
    )
  else if (level === "ask" && !args.includes("--yes"))
    notices.push(
      `${EVENTS_REMIND_HOOK_KEY} is ask, and a timer has no terminal to answer it, so every run stops before ` +
        `${program} — allow it: ${allow}, or add --yes to the scheduled words`,
    )
  return notices
}

/**
 * cli-core's `schedule`, kept off MCP: `run` and `exec` start the owner's reminder program, and `command` installs
 * a timer that keeps doing it. The read-only lock and `mcp.authority` already refuse installing; this keeps an
 * agent from even seeing the tools.
 */
export const scheduleCommand = (): Command => {
  const schedule = overrideSharedContract(
    scheduleCommandFor({ app: IDENTITY, context: contextOf }),
    "gcal keeps schedule off MCP: run and exec start the owner's reminder program",
    (command) => annotate(command, { mcp: false }),
  )
  schedule.commands
    .find((one) => one.name() === "command")
    ?.hook("postAction", (_self, action) => {
      const context = contextOf(action)
      const args = (action.processedArgs[1] as string[] | undefined) ?? []
      for (const notice of remindNotices(args, action.opts<{ every?: string }>().every, context.settings))
        context.renderer.warn(notice)
    })
  return schedule
}
