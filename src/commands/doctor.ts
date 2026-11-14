import { existsSync, readFileSync } from "node:fs"
import { appDoctorCommand, environmentOf, privateFiles } from "@wirecat/cli-core/cli"
import { googleApp, oauthClientReport } from "@wirecat/cli-core/constants"
import type { Command } from "commander"
import { configuration } from "../config.js"
import { signInFilePath } from "../google.js"
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

// doctor names no profile, so it reports the app of a profile without its own google_client_id.
const oauthClient = (env: NodeJS.ProcessEnv) => {
  const { shared } = configuration.resolveSettings({}, { env, readOnly: true, needsProfile: false, withIssues: true })
  const configClientId = typeof shared.google_client_id === "string" ? shared.google_client_id : undefined
  return oauthClientReport(googleApp({ env, prefix: "GCAL", configClientId }))
}

const DAY_MS = 86_400_000
/** Google deletes a call's record, its people and its transcript 30 days after it ends; this leaves five to sync. */
const MEET_STALE_DAYS = 25

interface MeetSync {
  profile: string
  last_sync: string | null
  days_ago: number | null
  stale: boolean
}

/**
 * When each profile last finished a Google Meet sync: the store's cursor for its `google-meet` account. Read-only,
 * and only for a profile that has one; a config or a store that cannot be read is a field, never a failed doctor.
 */
const meetSyncs = async (env: NodeJS.ProcessEnv, now: number): Promise<MeetSync[] | { error: string }> => {
  const [{ storePath }, { openGcalStore, MEET_PROVIDER }, { signedInAccounts }] = await Promise.all([
    import("@wirecat/cli-core/store"),
    import("../store.js"),
    import("../session.js"),
  ])
  try {
    const { configuredProfiles } = configuration.resolveSettings({}, { env, readOnly: true, needsProfile: false })
    const accounts = signedInAccounts(env, configuredProfiles)
    if (accounts.length === 0 || !existsSync(storePath(env))) return []
    const store = await openGcalStore(env, { readOnly: true })
    try {
      const found: MeetSync[] = []
      for (const [profile, account] of accounts) {
        const saved = await store.accounts
          .storedAccount({ provider: MEET_PROVIDER.name, account })
          .catch(() => undefined)
        if (!saved) continue
        const cursor = await store.meetings.cursor(saved.id)
        const days = cursor === null ? null : Math.floor((now - Date.parse(cursor)) / DAY_MS)
        found.push({ profile, last_sync: cursor, days_ago: days, stale: days === null || days >= MEET_STALE_DAYS })
      }
      return found
    } finally {
      await store.close()
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

const staleNote = ({ profile, days_ago }: MeetSync) =>
  `${profile}: ${days_ago === null ? "Google Meet was never synced" : `the last Google Meet sync was ${days_ago} days ago`}; ` +
  `Google deletes a call's record and transcript 30 days after it ends: run ${IDENTITY.command} ${profile} meetings sync`

/**
 * cli-core's doctor, with `--online`, where each profile's sign-in is kept, and how old each profile's last Google Meet
 * sync is. `local` cannot wait, so the store is read before it, in the command's own hook.
 */
export const doctorCommand = (): Command => {
  let meet: MeetSync[] | { error: string } = []
  const doctor = appDoctorCommand(IDENTITY, configuration, {
    oauthClient,
    packageName: PACKAGE,
    local: (env) => {
      const credentials = credentialFile(env)
      return {
        fields: { credential_file: credentials.report, meet_sync: meet },
        notes: [
          ...credentials.fixes.map((fix) => `to make it private: ${fix}`),
          ...(Array.isArray(meet) ? meet.filter((one) => one.stale).map(staleNote) : []),
        ],
      }
    },
  })
  return doctor.hook("preAction", async (_doctor, action) => {
    meet = await meetSyncs(environmentOf(action).env ?? process.env, Date.now())
  })
}
