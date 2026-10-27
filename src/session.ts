import { readFileSync } from "node:fs"
import { CliError, type KeyringStore } from "@wirecat/cli-base"
import { accountFileFor, profilesHere, rememberAccount } from "@wirecat/cli-core/cli"
import type { OAuthClient } from "@wirecat/cli-core/oauth"
import { accountEmail, CALENDAR_READ_SCOPE, SIGN_IN_SCOPES, sessionKeeper, sessionStorage } from "./google.js"
import { IDENTITY } from "./identity.js"
import { openGcalStore, PROVIDER } from "./store.js"

interface Common {
  env: NodeJS.ProcessEnv
  profile: string
  keyring?: KeyringStore | undefined
  fetch?: typeof fetch | undefined
  signal?: AbortSignal | undefined
}

/** Which Google account a profile is, as its last sign-in left it; no keyring and no network. */
export const savedAccount = (env: NodeJS.ProcessEnv, profile: string): string | undefined => {
  try {
    const { account } = JSON.parse(readFileSync(accountFileFor(IDENTITY, profile, env), "utf8")) as {
      account?: unknown
    }
    return typeof account === "string" ? account : undefined
  } catch {
    return undefined
  }
}

const scopeMissing = () =>
  new CliError(
    "permission_error",
    "Google did not grant read access to Calendar; run session start again and allow it on the consent screen",
    { reason: "sign-in.scope-missing" },
  )

export interface SignInOptions extends Common {
  client: OAuthClient
  openBrowser: (url: string) => Promise<void>
  showUrl: (url: string) => void
  timeoutMs?: number | undefined
}

export const signIn = async (options: SignInOptions) => {
  const { env, profile } = options
  const keeper = sessionKeeper(options)
  let account = ""
  const { scopes } = await keeper.signIn({
    scopes: SIGN_IN_SCOPES,
    openBrowser: options.openBrowser,
    showUrl: options.showUrl,
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
    // Runs before anything is saved, so a refused account leaves the profile's sign-in as it was.
    accept: async (tokens) => {
      if (!tokens.scopes.includes(CALENDAR_READ_SCOPE)) throw scopeMissing()
      if (!tokens.accessToken) throw new CliError("authentication_error", "Google returned no access token")
      account = await accountEmail(tokens.accessToken, options.fetch ?? globalThis.fetch, options.signal)
      const previous = savedAccount(env, profile)
      if (previous && previous !== account)
        throw new CliError("authentication_error", "this profile belongs to another account; use a new profile", {
          reason: "profile.wrong-account",
        })
      const other = profilesHere(IDENTITY, [], env).find(
        (name) => name !== profile && savedAccount(env, name) === account,
      )
      if (other)
        throw new CliError("validation_error", `this Google account is already signed in as profile ${other}`, {
          reason: "profile.same-account",
        })
      return undefined
    },
  })
  rememberAccount(IDENTITY, profile, account, env)
  const store = await openGcalStore(env)
  try {
    await store.accounts.saveProfile(IDENTITY.command, profile, { provider: PROVIDER.name, account })
  } finally {
    await store.close()
  }
  return { profile, signed_in: true, account, scopes }
}

/** A profile's saved sign-in with the keeper that refreshes it, made with the client it was signed in with. */
export const savedSession = (options: Common) => {
  const saved = sessionStorage(options.env, options.profile, options.keyring).read()
  return saved ? { saved, keeper: sessionKeeper({ ...options, client: saved.client ?? { clientId: "" } }) } : undefined
}

export const sessionStatus = async (options: Common & { check: boolean }) => {
  const { env, profile } = options
  const account = savedAccount(env, profile) ?? null
  const session = savedSession(options)
  if (!session) return { profile, state: "missing", account, verified: false }
  const { saved, keeper } = session
  const status = { profile, state: "saved", account, scopes: saved.tokens.scopes, verified: false }
  if (!options.check) return status
  const tokens = await keeper.tokens()
  if (!tokens.scopes.includes(CALENDAR_READ_SCOPE)) throw scopeMissing()
  const live = await accountEmail(tokens.accessToken ?? "", options.fetch ?? globalThis.fetch, options.signal)
  if (account && live !== account)
    throw new CliError("authentication_error", "the saved sign-in belongs to another account; run session start", {
      reason: "profile.wrong-account",
    })
  return { ...status, account: live, scopes: tokens.scopes, verified: true }
}

export const signOut = async (options: Common) => {
  const session = savedSession(options)
  if (!session) return { profile: options.profile, ended: false, cached_data: "retained" }
  await session.keeper.signOut()
  return { profile: options.profile, ended: true, cached_data: "retained" }
}
