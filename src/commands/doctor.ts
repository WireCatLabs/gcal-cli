import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { CliError, resolvePaths } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import { timezoneOf } from "@wirecat/cli-base/query"
import { clockMeta } from "@wirecat/cli-base/standards"
import {
  appDoctorReport,
  environmentOf,
  itemOf,
  LOCAL_READ,
  outputFor,
  privateFiles,
  profileFree,
  renderAnswer,
} from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { configuration } from "../config.js"
import { googleClient } from "../google.js"
import { IDENTITY } from "../identity.js"

const ACCOUNT = "oauth:google:"

/**
 * Which profiles keep their sign-in in the file of `session start --credential-storage file`; the others use the
 * keyring, which doctor never opens.
 */
const credentialFile = (state: string) => {
  const path = join(state, "credentials.json")
  if (!existsSync(path)) return { report: { path, found: false, profiles: [] }, fixes: [] }
  const mode = privateFiles({ files: [path], dirs: [] })
  let profiles: string[] | null
  try {
    profiles = Object.keys(JSON.parse(readFileSync(path, "utf8")))
      .filter((account) => account.startsWith(ACCOUNT))
      .map((account) => account.slice(ACCOUNT.length))
  } catch {
    profiles = null
  }
  return {
    report: { path, found: true, profiles, private: !mode.checked || mode.ok },
    fixes: mode.checked ? mode.problems.map((problem) => problem.fix) : [],
  }
}

/** Without a client here, a profile signed in with `--client-file` still works: its sign-in keeps its client. */
const oauthClient = (env: NodeJS.ProcessEnv) => {
  try {
    googleClient(env)
    return { client: env.GCAL_GOOGLE_CLIENT_ID ? ("own" as const) : ("wirecat" as const) }
  } catch (error) {
    if (!(error instanceof CliError)) throw error
    throw new CliError(
      "configuration_error",
      `${error.message}; a profile already signed in with --client-file keeps its own client`,
    )
  }
}

export const doctorReport = (env: NodeJS.ProcessEnv, command: Command) => {
  const shared = appDoctorReport(IDENTITY, configuration, env, command, { oauthClient })
  const state = resolvePaths({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env }).state
  const credentials = credentialFile(state)
  return {
    report: { ...shared.report, credential_file: credentials.report },
    fixes: [...shared.fixes, ...credentials.fixes],
  }
}

// cli-core's appDoctorCommand has no hook for a field of the CLI's own, and gcal must keep `credential_file`.
export const doctorCommand = (): Command =>
  profileFree(
    annotate(new Command("doctor"), {
      effects: LOCAL_READ,
      examples: [`${IDENTITY.command} doctor`, `${IDENTITY.command} doctor --json`],
    }),
  )
    .summary("check this installation; no keyring or network")
    .description(
      "check this installation: version, paths, config, profiles, store, OAuth client, where each sign-in is kept; " +
        "no keyring or network",
    )
    .action(function (this: Command) {
      const env = environmentOf(this).env ?? process.env
      const { report, fixes } = doctorReport(env, this)
      const output = outputFor(this)
      renderAnswer(this, output, itemOf(report, { meta: clockMeta(Date.now(), timezoneOf()) }))
      for (const fix of fixes) output.renderer.note(`to make it private: ${fix}`)
    })
