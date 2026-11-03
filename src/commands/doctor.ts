import { existsSync, readFileSync } from "node:fs"
import { CliError } from "@wirecat/cli-base"
import { appDoctorCommand, privateFiles } from "@wirecat/cli-core/cli"
import type { Command } from "commander"
import { configuration } from "../config.js"
import { googleClient, signInFilePath } from "../google.js"
import { IDENTITY, PACKAGE } from "../identity.js"

// The prefix of `oauthAccount("google", profile)`, which refuses an empty profile.
const ACCOUNT = "oauth:google:"

/**
 * Which profiles keep their sign-in in the file of `session start --credential-storage file`; the others use the
 * keyring, which doctor never opens.
 */
const credentialFile = (env: NodeJS.ProcessEnv) => {
  const path = signInFilePath(env)
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

/** cli-core's doctor, with `--online`, and where each profile's sign-in is kept as gcal's own field. */
export const doctorCommand = (): Command =>
  appDoctorCommand(IDENTITY, configuration, {
    oauthClient,
    packageName: PACKAGE,
    local: (env) => {
      const credentials = credentialFile(env)
      return {
        fields: { credential_file: credentials.report },
        notes: credentials.fixes.map((fix) => `to make it private: ${fix}`),
      }
    },
  })
