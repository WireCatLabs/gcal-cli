import { readFileSync } from "node:fs"
import { join } from "node:path"
import { CliError, Credentials, isMovedRun, type KeyringStore, resolvePaths, systemKeyring } from "@wirecat/cli-base"
import { type EventSink, privateFiles, providerRequest } from "@wirecat/cli-core/cli"
import {
  credentialStorage,
  type OAuthClient,
  type OAuthProvider,
  oauthAccount,
  standardCodec,
  type TokenCodec,
  type TokenKeeper,
  type TokenStorage,
  tokenKeeper,
} from "@wirecat/cli-core/oauth"
import * as v from "valibot"
import { IDENTITY } from "./identity.js"

export const CALENDAR_READ_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
export const SIGN_IN_SCOPES = ["openid", "email", CALENDAR_READ_SCOPE] as const
// https://accounts.google.com/.well-known/openid-configuration
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

export const googleProvider = (client: OAuthClient): OAuthProvider => ({
  id: "google",
  name: "Google",
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  revokeUrl: "https://oauth2.googleapis.com/revoke",
  client,
  redirect: { kind: "loopback" },
  // Without offline access Google returns no refresh token; without consent it does not return one again.
  authorizeParams: { access_type: "offline", prompt: "select_account consent" },
})

const standard = standardCodec("google")
// The standard codec reads and writes only a JSON object, so this never throws on text it has handled.
const entryObject = (text: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(text)
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new CliError("authentication_error", "the saved sign-in cannot be read; sign in again", {
      reason: "oauth.invalid",
    })
  return { ...value }
}
// Called only after the standard codec has parsed the same text.
const secretOf = (raw: string): string | undefined => {
  const { clientSecret } = entryObject(raw)
  return typeof clientSecret === "string" && clientSecret ? clientSecret : undefined
}
/**
 * cli-core's standard entry keeps no client secret, and Google's Desktop clients need one to refresh: the client file
 * is read once, at sign-in, so the entry carries the secret the way drive's does.
 */
export const sessionCodec: TokenCodec = {
  decode: (raw) => {
    const stored = standard.decode(raw)
    const clientSecret = secretOf(raw)
    return clientSecret ? { ...stored, client: { clientId: stored.client?.clientId ?? "", clientSecret } } : stored
  },
  encode: (input) => {
    const entry = entryObject(standard.encode(input))
    // A client without a secret must not inherit the secret of the app this profile signed in with before.
    if (input.client.clientSecret) entry.clientSecret = input.client.clientSecret
    else delete entry.clientSecret
    return JSON.stringify(entry)
  },
}

const paths = (env: NodeJS.ProcessEnv) => resolvePaths({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env })

export type CredentialStorage = "keyring" | "file"

const credentialsOptions = (env: NodeJS.ProcessEnv, storage: CredentialStorage | "auto", keyring?: KeyringStore) => ({
  // A sign-in kept in a file is state this computer holds, not configuration to copy elsewhere; cli-base writes it 600.
  // The keyring falls back to that same file (WC-SECR-4), so `storageOf` finds it either way.
  configDir: paths(env).state,
  service: IDENTITY.appName,
  storage,
  env,
  isolated: isMovedRun({ appName: IDENTITY.appName, prefix: IDENTITY.envPrefix, env }),
  keyring: keyring ?? systemKeyring,
})

const signInFile = (env: NodeJS.ProcessEnv) => new Credentials(credentialsOptions(env, "file"))

export const signInFilePath = (env: NodeJS.ProcessEnv): string => join(paths(env).state, "credentials.json")

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
    codec: sessionCodec,
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
    fetch: options.fetch ?? globalThis.fetch,
    signInCommand: options.signInCommand,
    ...(options.signal ? { signal: options.signal } : {}),
  })

const NO_CLIENT =
  "no Google OAuth client is set up: set GCAL_GOOGLE_CLIENT_ID and GCAL_GOOGLE_CLIENT_SECRET to your own Desktop app client"

const ClientFile = v.object({
  installed: v.object({ client_id: v.pipe(v.string(), v.minLength(1)), client_secret: v.optional(v.string()) }),
})

/** The owner's own Google app, from a client file or the environment; gcal bundles none yet. */
export const googleClient = (env: NodeJS.ProcessEnv, file?: string, platform = process.platform): OAuthClient => {
  if (!file) {
    const clientId = env.GCAL_GOOGLE_CLIENT_ID
    const clientSecret = env.GCAL_GOOGLE_CLIENT_SECRET
    if (!clientId) {
      if (clientSecret)
        throw new CliError("configuration_error", "GCAL_GOOGLE_CLIENT_SECRET requires GCAL_GOOGLE_CLIENT_ID", {
          reason: "sign-in.no-client",
        })
      throw new CliError("configuration_error", NO_CLIENT, { reason: "sign-in.no-client" })
    }
    return { clientId, ...(clientSecret ? { clientSecret } : {}) }
  }
  const mode = privateFiles({ files: [file], dirs: [] }, platform)
  if (mode.checked && !mode.ok)
    throw new CliError(
      "configuration_error",
      `the client file can be read by other users of this computer; run chmod 600 ${file} and try again`,
      { reason: "sign-in.client-file-open" },
    )
  try {
    const { installed } = v.parse(ClientFile, JSON.parse(readFileSync(file, "utf8")))
    return {
      clientId: installed.client_id,
      ...(installed.client_secret ? { clientSecret: installed.client_secret } : {}),
    }
  } catch {
    throw new CliError(
      "configuration_error",
      "could not read a Desktop app OAuth client JSON from the client file; its contents were not logged",
      { reason: "sign-in.client-file-invalid" },
    )
  }
}

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
  const timeout = AbortSignal.timeout(30_000)
  let response: Response
  try {
    response = await fetcher(USERINFO_URL, {
      headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
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
}
