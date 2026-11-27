import { readFileSync } from "node:fs"
import { CliError, type KeyringStore } from "@wirecat/cli-base"
import { accountFileFor, type EventSink, profilesHere } from "@wirecat/cli-core/cli"
import { googleFetch, sessionKeeper, sessionStorage } from "./google.js"
import { IDENTITY } from "./identity.js"

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
    const saved: unknown = JSON.parse(readFileSync(accountFileFor(IDENTITY, profile, env), "utf8"))
    const account = typeof saved === "object" && saved !== null && "account" in saved ? saved.account : undefined
    return typeof account === "string" ? account : undefined
  } catch {
    return undefined
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
    fetch: options.fetch ?? googleFetch,
    signal: options.signal,
    scopes: () => session?.saved.tokens.scopes,
    accessToken: async () => {
      if (!session) throw new CliError("authentication_error", "not signed in to Google", { reason: "session.missing" })
      const { accessToken } = await session.keeper.tokens()
      if (!accessToken) throw new CliError("authentication_error", "Google returned no access token")
      return accessToken
    },
  }
}

/** Each profile on this computer that a sign-in tied to a Google account, with that account's address. */
export const signedInAccounts = (env: NodeJS.ProcessEnv, configured: readonly string[]): [string, string][] =>
  profilesHere(IDENTITY, configured, env).flatMap((profile) => {
    const account = savedAccount(env, profile)
    return account === undefined ? [] : [[profile, account] as [string, string]]
  })
