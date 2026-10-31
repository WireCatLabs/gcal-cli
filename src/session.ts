import { readFileSync } from "node:fs"
import { CliError, isCliError, type KeyringStore } from "@wirecat/cli-base"
import { accountFileFor, type EventSink, profilesHere, rememberAccount } from "@wirecat/cli-core/cli"
import type { OAuthClient } from "@wirecat/cli-core/oauth"
import {
  accountEmail,
  CALENDAR_READ_SCOPE,
  type CredentialStorage,
  forgetOtherStorage,
  holdsSignIn,
  SIGN_IN_SCOPES,
  sessionKeeper,
  sessionStorage,
  storageOf,
} from "./google.js"
import { GRANT_SCOPES, type Grant, grantsOf } from "./grants.js"
import { IDENTITY } from "./identity.js"
import { openGcalStore, PROVIDER } from "./store.js"

interface Common {
  env: NodeJS.ProcessEnv
  profile: string
  /** cli-core's sign-in keeper puts these words in its failures; the command layer writes them (WC-ARCH-16). */
  signInCommand: string
  keyring?: KeyringStore | undefined
  fetch?: typeof fetch | undefined
  signal?: AbortSignal | undefined
  events?: EventSink | undefined
  /** The runner's tracker, so a timeout or a signal closes what the command opened (WC-LIFE-3). */
  trackCloseable?: ((closeable: { close: () => Promise<void> }) => void) | undefined
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
  new CliError("permission_error", "Google did not grant read access to Calendar", {
    reason: "sign-in.scope-missing",
    grant: "read",
  })

const grantMissing = (grant: Grant) =>
  new CliError("permission_error", `Google did not grant the ${grant} permission`, {
    reason: "sign-in.scope-missing",
    grant,
  })

export interface SignInOptions extends Common {
  client: OAuthClient
  grants?: readonly Grant[] | undefined
  storage: CredentialStorage
  openBrowser: (url: string) => Promise<void>
  showUrl: (url: string) => void
  timeoutMs?: number | undefined
}

export const signIn = async (options: SignInOptions) => {
  const { env, profile } = options
  const keeper = sessionKeeper(options)
  let account = ""
  const { scopes } = await keeper.signIn({
    scopes: [...SIGN_IN_SCOPES, ...(options.grants ?? []).map((grant) => GRANT_SCOPES[grant])],
    openBrowser: options.openBrowser,
    showUrl: options.showUrl,
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
    // Runs before anything is saved, so a refused account leaves the profile's sign-in as it was.
    accept: async (tokens) => {
      if (!tokens.scopes.includes(CALENDAR_READ_SCOPE)) throw scopeMissing()
      // Google lets the account untick a scope it was asked for, and still signs in.
      const missing = (options.grants ?? []).find((grant) => !tokens.scopes.includes(GRANT_SCOPES[grant]))
      if (missing) throw grantMissing(missing)
      if (!tokens.accessToken) throw new CliError("authentication_error", "Google returned no access token")
      account = await accountEmail(
        tokens.accessToken,
        options.fetch ?? globalThis.fetch,
        options.signal,
        options.events,
      )
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
  forgetOtherStorage(env, profile, options.storage, options.keyring)
  rememberAccount(IDENTITY, profile, account, env)
  const store = await openGcalStore(env)
  let closed: Promise<void> | undefined
  const close = () => (closed ??= store.close())
  options.trackCloseable?.({ close })
  try {
    await store.accounts.saveProfile(IDENTITY.command, profile, { provider: PROVIDER.name, account })
  } finally {
    await close()
  }
  return {
    profile,
    signed_in: true,
    account,
    scopes,
    grants: grantsOf(scopes),
    credential_storage: options.storage,
  }
}

/** A profile's saved sign-in with the keeper that refreshes it, made with the client it was signed in with. */
export const savedSession = (options: Common) => {
  const saved = sessionStorage(options.env, options.profile, options.keyring).read()
  return saved ? { saved, keeper: sessionKeeper({ ...options, client: saved.client ?? { clientId: "" } }) } : undefined
}

/** What `googleApi` needs from a profile's saved sign-in; a missing one fails only when a request needs a token. */
export const apiAccess = (options: Common) => {
  const session = savedSession(options)
  return {
    fetch: options.fetch ?? globalThis.fetch,
    signal: options.signal,
    scopes: () => session?.saved.tokens.scopes,
    accessToken: async () => {
      if (!session)
        throw new CliError("authentication_error", "not signed in to Google", { reason: "profile.not-signed-in" })
      const { accessToken } = await session.keeper.tokens()
      if (!accessToken) throw new CliError("authentication_error", "Google returned no access token")
      return accessToken
    },
  }
}

/**
 * The saved sign-in for a status or a sign-out. A file sign-in is read without the keyring, so a keyring out of reach
 * means this computer holds no sign-in a run can use: there is nothing to show or end (WC-SECR-4).
 */
const reachableSession = (options: Common) => {
  try {
    return { session: savedSession(options) }
  } catch (error) {
    if (isCliError(error) && error.details.reason === "oauth.not-saved")
      return { session: undefined, keyring: "unreachable" as const }
    throw error
  }
}

export const sessionStatus = async (options: Common & { check: boolean }) => {
  const { env, profile } = options
  const account = savedAccount(env, profile) ?? null
  const { session, keyring } = reachableSession(options)
  if (!session) return { profile, state: "missing", account, verified: false, ...(keyring ? { keyring } : {}) }
  const { saved, keeper } = session
  const status = {
    profile,
    state: "saved",
    account,
    scopes: saved.tokens.scopes,
    grants: grantsOf(saved.tokens.scopes),
    credential_storage: storageOf(env, profile),
    verified: false,
  }
  if (!options.check) return status
  const tokens = await keeper.tokens()
  if (!tokens.scopes.includes(CALENDAR_READ_SCOPE)) throw scopeMissing()
  const live = await accountEmail(
    tokens.accessToken ?? "",
    options.fetch ?? globalThis.fetch,
    options.signal,
    options.events,
  )
  if (account && live !== account)
    throw new CliError("authentication_error", "the saved sign-in belongs to another account", {
      reason: "profile.wrong-account",
      next: "sign-in",
    })
  return { ...status, account: live, scopes: tokens.scopes, grants: grantsOf(tokens.scopes), verified: true }
}

export const signOut = async (options: Common) => {
  const { session, keyring } = reachableSession(options)
  if (!session)
    return { profile: options.profile, ended: false, cached_data: "retained", ...(keyring ? { keyring } : {}) }
  const storage = storageOf(options.env, options.profile)
  const { removed } = await session.keeper.signOut()
  // A run with moved folders removes only its own keyring entry and then reads the owner's, which it never removes.
  if (storage === "keyring" && reachableSession(options).session)
    return {
      profile: options.profile,
      ended: removed.includes("keyring"),
      kept: "keyring",
      why:
        "this run has moved folders: it still reads the owner's sign-in in the system keyring, which every run of " +
        "gcal shares and this run never removes, so it is still signed in",
      cached_data: "retained",
    }
  return { profile: options.profile, ended: true, cached_data: "retained" }
}

/** Every profile this computer knows, named in the config or signed in once, with where its sign-in is now. */
export const profileSignIns = (env: NodeJS.ProcessEnv, configured: readonly string[], keyring?: KeyringStore) =>
  profilesHere(IDENTITY, configured, env).map((profile) => {
    const account = savedAccount(env, profile) ?? null
    try {
      const signedIn = holdsSignIn(env, profile, keyring)
      return { profile, signed_in: signedIn, account, credential_storage: signedIn ? storageOf(env, profile) : null }
    } catch (error) {
      if (!(error instanceof CliError)) throw error
      return { profile, signed_in: null, account, credential_storage: null, error: error.message }
    }
  })
