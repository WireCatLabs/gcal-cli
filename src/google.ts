import { chmodSync, constants, copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { CliError, Credentials, isMovedRun, type KeyringStore, resolvePaths, systemKeyring } from "@wirecat/cli-base"
import { type FetchLike, hostFetch } from "@wirecat/cli-base/http"
import { type EventSink, providerRequest } from "@wirecat/cli-core/cli"
import { googleApp } from "@wirecat/cli-core/constants"
import {
  credentialStorage,
  googleProvider,
  googleTokenCodec,
  type OAuthClient,
  oauthAccount,
  type TokenKeeper,
  type TokenStorage,
  tokenKeeper,
} from "@wirecat/cli-core/oauth"
import * as v from "valibot"
import { DESKTOP, IDENTITY } from "./identity.js"

// Made per call: hostFetch takes the global fetch when it is made, and a test that stubs fetch stubs it later.
export const googleFetch: FetchLike = (input, init) => hostFetch({ hosts: DESKTOP.hosts })(input, init)

export const CALENDAR_READ_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
export const SIGN_IN_SCOPES = ["openid", "email", CALENDAR_READ_SCOPE] as const
// https://accounts.google.com/.well-known/openid-configuration
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

const SIGN_IN_FILE = "credentials.json"

const paths = (env: NodeJS.ProcessEnv) => resolvePaths({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env })

export type CredentialStorage = "keyring" | "file"

/** Up to 0.23.0 the sign-in file was in the state folder; it moves once to the config folder, as in the other CLIs. */
export const moveOldSignInFile = (
  env: NodeJS.ProcessEnv,
  moved = isMovedRun({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env }),
) => {
  // One moved folder can leave the other at the owner's own, and the owner's file must never move into a test's.
  if (moved) return
  const { config, state } = paths(env)
  const old = join(state, SIGN_IN_FILE)
  const current = join(config, SIGN_IN_FILE)
  if (!existsSync(old) || existsSync(current)) return
  mkdirSync(config, { recursive: true, mode: 0o700 })
  try {
    // A copy, not a rename: the two folders may be on different disks.
    copyFileSync(old, current, constants.COPYFILE_EXCL)
  } catch (error) {
    // Another gcal moved it first.
    if (["ENOENT", "EEXIST"].includes((error as NodeJS.ErrnoException).code ?? "")) return
    throw error
  }
  chmodSync(current, 0o600)
  rmSync(old, { force: true })
}

export const credentialsOptions = (
  env: NodeJS.ProcessEnv,
  storage: CredentialStorage | "auto",
  keyring?: KeyringStore,
) => {
  moveOldSignInFile(env)
  return {
    // cli-base writes the file 600. The keyring falls back to it (WC-SECR-4), so `storageOf` finds it either way.
    configDir: paths(env).config,
    service: IDENTITY.appName,
    storage,
    env,
    isolated: isMovedRun({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env }),
    keyring: keyring ?? systemKeyring,
  }
}

const signInFile = (env: NodeJS.ProcessEnv) => new Credentials(credentialsOptions(env, "file"))

export const signInFilePath = (env: NodeJS.ProcessEnv): string => join(paths(env).config, SIGN_IN_FILE)

/**
 * The file when it holds this profile's sign-in, the keyring otherwise. cli-base reads the file first and drops its
 * copy once a sign-in reaches the keyring, so only one of them counts.
 */
export const storageOf = (env: NodeJS.ProcessEnv, profile: string): CredentialStorage =>
  signInFile(env).read(oauthAccount("google", profile)) ? "file" : "keyring"

/** After `--credential-storage file`: an older keyring copy must not outlive the file the owner chose. */
export const forgetKeyringCopy = (env: NodeJS.ProcessEnv, profile: string, keyring?: KeyringStore): void => {
  try {
    new Credentials(credentialsOptions(env, "keyring", keyring)).remove(oauthAccount("google", profile))
  } catch {
    // No keyring on this computer: there is no copy to forget.
  }
}

/** `file` only for `--credential-storage file`; otherwise the keyring, falling back to the file (WC-SECR-4). */
export const sessionStorage = (
  env: NodeJS.ProcessEnv,
  profile: string,
  keyring?: KeyringStore,
  storage?: CredentialStorage,
): TokenStorage =>
  credentialStorage({
    credentials: credentialsOptions(env, storage === "file" ? "file" : "auto", keyring),
    account: oauthAccount("google", profile),
    codec: googleTokenCodec,
  })

/**
 * Whether this computer holds the profile's Google sign-in, in the file or the keyring; no network. The account file
 * is no answer: `session end` keeps it, so offline reads still find the profile's rows.
 */
export const holdsSignIn = (env: NodeJS.ProcessEnv, profile: string, keyring?: KeyringStore): boolean =>
  sessionStorage(env, profile, keyring).read() !== undefined

export interface KeeperOptions {
  /** Where a new sign-in goes; a saved one is read and refreshed where it is. */
  storage?: CredentialStorage | undefined
  env: NodeJS.ProcessEnv
  profile: string
  signInCommand: string
  client: OAuthClient
  keyring?: KeyringStore | undefined
  fetch?: typeof fetch | undefined
  signal?: AbortSignal | undefined
}
/** One profile's saved sign-in, refreshed and saved under a lock every gcal process shares. */
export const sessionKeeper = (options: KeeperOptions): TokenKeeper =>
  tokenKeeper({
    provider: googleProvider(options.client),
    storage: sessionStorage(options.env, options.profile, options.keyring, options.storage),
    lockDir: paths(options.env).config,
    fetch: options.fetch ?? googleFetch,
    signInCommand: options.signInCommand,
    ...(options.signal ? { signal: options.signal } : {}),
  })

export interface AppChoice {
  /** `--client-file`. */
  file?: string | undefined
  /** `--client-id`. */
  clientId?: string | undefined
  /** The profile's `google_client_id`, else the defaults'. */
  configClientId?: string | undefined
}

/** The Google app a sign-in uses (WC-SECR-25): a flag, GCAL_GOOGLE_CLIENT_ID, `google_client_id`, then WireCat's. */
export const googleClient = (
  env: NodeJS.ProcessEnv,
  { file, clientId, configClientId }: AppChoice = {},
  platform = process.platform,
): OAuthClient => googleApp({ env, prefix: "GCAL", clientFile: file, clientId, configClientId, platform }).client

const UserInfo = v.object({ email: v.optional(v.string()), email_verified: v.optional(v.boolean()) })

/**
 * The signed-in account's address, from Google's OpenID Connect userinfo endpoint. The token goes in the header,
 * never the address, so no failure can print it.
 */
export const accountEmail = async (
  accessToken: string,
  fetcher: typeof fetch,
  signal?: AbortSignal,
  events?: EventSink,
) => {
  const answered = providerRequest("GET /v1/userinfo", events)
  // Not AbortSignal.timeout: its timer holds the run's async context until the deadline (tg-cli #827).
  const deadline = new AbortController()
  const timer = setTimeout(() => deadline.abort(new DOMException("timed out", "TimeoutError")), 30_000)
  timer.unref()
  try {
    let response: Response
    try {
      response = await fetcher(USERINFO_URL, {
        headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
        signal: signal ? AbortSignal.any([signal, deadline.signal]) : deadline.signal,
        redirect: "error",
      })
    } catch (error) {
      answered({ error, errorCode: "provider_unavailable" })
      throw new CliError("provider_unavailable", "Google did not answer the account lookup; try again", {
        reason: "sign-in.lookup-unavailable",
        retryable: true,
      })
    }
    answered(response.ok ? { status: response.status } : { status: response.status, errorCode: "provider_error" })
    if (!response.ok)
      throw new CliError("authentication_error", `Google refused the account lookup (HTTP ${response.status})`, {
        reason: "sign-in.lookup-refused",
        status: response.status,
      })
    const info = v.safeParse(UserInfo, await response.json().catch(() => undefined))
    const email = info.success ? info.output.email : undefined
    if (!email || (info.success && info.output.email_verified === false))
      throw new CliError(
        "authentication_error",
        "Google did not share a verified email address for this account; sign in again and allow it",
        { reason: "sign-in.no-email" },
      )
    return email.toLowerCase()
  } finally {
    clearTimeout(timer)
  }
}
