import { join } from "node:path"
import type { KeyringStore } from "@wirecat/cli-base"
import { resolvePaths } from "@wirecat/cli-base"
import {
  appMcpCommand,
  commandsCommand,
  configCommand,
  createProgram as createSharedProgram,
  environmentOf,
  outputFor,
  type ProgramDefinition,
  type ProgramOptions,
  type RunOptions,
  run as runShared,
  runsCommand,
  skillCommand,
  upgradeCommand,
} from "@wirecat/cli-core/cli"
import { appUpdate } from "@wirecat/cli-core/update"
import type { Command } from "commander"
import { accountCommand } from "./commands/account.js"
import { apiCommand } from "./commands/api.js"
import { calendarCommands } from "./commands/calendar.js"
import { doctorCommand } from "./commands/doctor.js"
import { meetingsMount } from "./commands/meetings.js"
import { modelsCommand } from "./commands/models.js"
import { scheduleCommand } from "./commands/schedule.js"
import { sessionCommand } from "./commands/session.js"
import { configuration, OWNER_ONLY_SETTINGS } from "./config.js"
import { FIRST_SCREEN, guide, placeInSections } from "./first-screen.js"
import { holdsSignIn, moveOldSignInFile } from "./google.js"
import { IDENTITY, PACKAGE, SKILL } from "./identity.js"

const update = appUpdate({
  packageName: PACKAGE,
  command: IDENTITY.command,
  version: IDENTITY.version,
  entry: import.meta.url,
  statePath: (env) =>
    join(resolvePaths({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env }).state, "update-check.json"),
  enabled: (env) => configuration.resolveSettings({}, { env, needsProfile: false }).updateCheck,
  offVariables: [`${IDENTITY.envPrefix}_NO_UPDATE_CHECK`],
})

const mcpCommand = () => {
  // cli-core asks `signedIn` with no keyring; the run's own one, a test's `memoryKeyring()`, is taken here. Each
  // program builds its own `mcp`, so a tool call run beside it never swaps the server's keyring (WC-ARCH-22).
  let keyring: KeyringStore | undefined
  const mcp = appMcpCommand(IDENTITY, configuration, {
    name: "Google Calendar",
    untrusted: [
      "event titles",
      "descriptions",
      "locations",
      "attendee and organizer names",
      "shared calendar names",
      "feed events and feed names",
      "Google Meet participant names and what they said in a transcript",
      "the messages, sender names and meeting transcripts search all finds",
    ],
    permissionExample: "api.calendar.events.insert=deny",
    skill: SKILL,
    signedIn: (profile, env) => {
      try {
        return holdsSignIn(env, profile, keyring)
      } catch {
        // A keyring that cannot be read fails the server's tools as well.
        return false
      }
    },
  })
  return mcp.hook("preAction", (_mcp, action) => {
    keyring = environmentOf(action).keyring
  })
}

/** `--read-only` is `GCAL_READ_ONLY=1` for this run, as in drive. */
const readOnlyFlag = (program: Command) =>
  program.option("--read-only", "refuse every change, as GCAL_READ_ONLY=1 does").hook("preAction", (_root, action) => {
    if (!action.optsWithGlobals<{ readOnly?: boolean }>().readOnly) return
    // Every check, cli-core's and gcal's, and each tool run of `mcp serve` reads the lock from the run's environment.
    const env = environmentOf(program).env ?? process.env
    env[`${IDENTITY.envPrefix}_READ_ONLY`] = "1"
  })

/** cli-core's session command reads the config folder's sign-in file only, so an older gcal's file moves first. */
const moveSignInFile = (program: Command) =>
  program.hook("preAction", () => moveOldSignInFile(environmentOf(program).env ?? process.env))

export const definition = (): ProgramDefinition => {
  const meetings = meetingsMount()
  return {
    app: IDENTITY,
    configuration,
    configure: (program) => {
      placeInSections(program)
      readOnlyFlag(program)
      moveSignInFile(program)
      meetings.configure(program)
    },
    prepare: meetings.prepare,
    firstScreen: FIRST_SCREEN,
    commands: () => [
      commandsCommand(IDENTITY),
      sessionCommand(),
      accountCommand(),
      ...calendarCommands(),
      ...meetings.commands(),
      apiCommand(),
      doctorCommand(),
      modelsCommand(),
      guide(),
      skillCommand(IDENTITY, SKILL),
      mcpCommand(),
      upgradeCommand(IDENTITY, PACKAGE, (command) => ({
        ...outputFor(command),
        installer: () => update.installer({}),
        latest: () => update.latest({}),
        install: (argv) => update.runUpdate(argv, {}),
      })),
      configCommand(IDENTITY, configuration, { ownerOnly: OWNER_ONLY_SETTINGS }),
      runsCommand(IDENTITY),
      scheduleCommand(),
    ],
  }
}

export const createProgram = (options?: ProgramOptions): Command => createSharedProgram(definition(), options)

export const run = (argv: string[], options?: RunOptions): Promise<number> => runShared(argv, definition(), options)
