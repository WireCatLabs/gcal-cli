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
import { apiCommand } from "./commands/api.js"
import { calendarMount } from "./commands/calendar.js"
import { doctorCommand } from "./commands/doctor.js"
import { modelsCommand } from "./commands/models.js"
import { sessionCommand } from "./commands/session.js"
import { configuration } from "./config.js"
import { FIRST_SCREEN, guide, placeInSections } from "./first-screen.js"
import { holdsSignIn } from "./google.js"
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

export const definition = (): ProgramDefinition => {
  const calendar = calendarMount()
  // cli-core asks `signedIn` with no keyring; the run's own one, a test's `memoryKeyring()`, is taken here.
  let keyring: KeyringStore | undefined
  return {
    app: IDENTITY,
    configuration,
    configure: (program) => {
      program.hook("preAction", (_root, action) => {
        keyring = environmentOf(action).keyring
      })
      calendar.configure?.(program)
      placeInSections(program)
    },
    firstScreen: FIRST_SCREEN,
    prepare: calendar.prepare,
    commands: () => [
      commandsCommand(IDENTITY),
      sessionCommand(),
      ...calendar.commands(),
      apiCommand(),
      doctorCommand(),
      modelsCommand(),
      guide(),
      skillCommand(IDENTITY, SKILL),
      appMcpCommand(IDENTITY, configuration, {
        name: "Google Calendar",
        untrusted: [
          "event titles",
          "descriptions",
          "locations",
          "attendee and organizer names",
          "shared calendar names",
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
      }),
      upgradeCommand(IDENTITY, PACKAGE, (command) => ({
        ...outputFor(command),
        installer: () => update.installer({}),
        latest: () => update.latest({}),
        install: (argv) => update.runUpdate(argv, {}),
      })),
      configCommand(IDENTITY, configuration),
      runsCommand(IDENTITY),
    ],
  }
}

export const createProgram = (options?: ProgramOptions): Command => createSharedProgram(definition(), options)

export const run = (argv: string[], options?: RunOptions): Promise<number> => runShared(argv, definition(), options)
