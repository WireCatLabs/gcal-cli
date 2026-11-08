import { resolvePaths } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import { alive, checkpointPath, readLock } from "@wirecat/cli-core/background"
import { type AccountRemoval, accountRemoveCommand, LOCAL_READ } from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { configuration } from "../config.js"
import { credentialsOptions } from "../google.js"
import { IDENTITY } from "../identity.js"
import { savedAccount, savedSession } from "../session.js"
import { PROVIDER } from "../store.js"
import { signInWords } from "./words.js"

const removal: AccountRemoval = {
  signOut: async (profile, { env, keyring, mayRevoke }) => {
    const session = savedSession({ env, profile, signInCommand: signInWords(profile), keyring })
    if (!session) return { revoked: null, removed: [] }
    const { revoked } = await session.keeper.signOut({ revoke: mayRevoke })
    return { revoked, removed: ["the Google sign-in"] }
  },
  account: (profile, { env }) => {
    const email = savedAccount(env, profile)
    return email ? { provider: PROVIDER.name, account: email } : undefined
  },
  secrets: (profile, { env, keyring }) => [
    { credentials: credentialsOptions(env, "auto", keyring), accounts: [`feeds:${profile}`] },
  ],
  busy: (profile, { env }) => {
    const state = resolvePaths({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env }).state
    const lock = readLock(`${checkpointPath(state, profile, "events-remind")}.lock`)
    return lock && alive(lock.pid) ? "an `events remind` run" : undefined
  },
}

export const accountCommand = (): Command =>
  annotate(new Command("account"), { effects: LOCAL_READ })
    .description("remove this profile from this computer")
    .addCommand(accountRemoveCommand(IDENTITY, removal, { resolveSettings: configuration.resolveSettings }))
