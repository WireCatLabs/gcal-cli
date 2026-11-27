import { CliError } from "@wirecat/cli-base"
import {
  type BaseEnvironment,
  environmentOf,
  fromFile,
  type GlobalFlags,
  oauthSessionCommand,
  outputFor,
  profilesHere,
  rememberAccount,
} from "@wirecat/cli-core/cli"
import { googleProvider, googleTokenCodec } from "@wirecat/cli-core/oauth"
import { type Command, Option } from "commander"
import { configuration } from "../config.js"
import {
  accountEmail,
  CALENDAR_READ_SCOPE,
  googleClient,
  googleFetch,
  SIGN_IN_SCOPES,
  sessionStorage,
} from "../google.js"
import { GRANT_SCOPES, GRANTS, type Grant, grantMissing, grantsOf, MEET_WRITE_SCOPE, scopesFor } from "../grants.js"
import { IDENTITY } from "../identity.js"
import { savedAccount } from "../session.js"
import { openGcalStore, PROVIDER } from "../store.js"
import { inWords, signInWords, worded } from "./words.js"

/** What a test hands `run()` in place of Google and the system browser. */
export interface GcalEnvironment extends BaseEnvironment {
  fetch?: typeof fetch
  /** Gets the command, so the entry opens nothing under `--json`, `--no-input`, CI or without a terminal (WC-CMD-15). */
  openBrowser?: (url: string, command?: Command) => Promise<void>
}

export const contextOf = (command: Command) => {
  const environment = environmentOf<GcalEnvironment>(command)
  const env = environment.env ?? process.env
  const flags = command.optsWithGlobals<GlobalFlags>()
  const settings = configuration.resolveSettings(flags, { env })
  const { profile } = settings
  return {
    environment,
    flags,
    settings,
    common: {
      env,
      profile,
      signInCommand: signInWords(profile),
      keyring: environment.keyring,
      fetch: environment.fetch,
      signal: environment.signal,
      trackCloseable: environment.trackCloseable,
    },
  }
}

const isGrant = (value: string): value is Grant => GRANTS.some((grant) => grant === value)

const grantList = (raw: string): Grant[] => {
  const values = raw.split(",").map((value) => value.trim())
  const unknown = values.filter((value) => !isGrant(value))
  if (unknown.length)
    throw new CliError("validation_error", `--grant takes ${GRANTS.join(", ")}; got ${unknown.join(", ")}`)
  return [...new Set(values.filter(isGrant))]
}

interface StartOptions {
  clientFile?: string
  clientId?: string
  grant?: Grant[]
}

const START_OPTIONS = [
  new Option("--client-file <file>", "your own Desktop app OAuth client JSON; without it, WireCat's app"),
  new Option(
    "--client-id <id>",
    "your own Desktop app OAuth client ID, used instead of WireCat's; its secret comes from GCAL_GOOGLE_CLIENT_SECRET",
  ),
  new Option(
    "--grant <scopes>",
    "also ask for these, comma-separated: write (create, change and delete events, answer invitations), sharing " +
      "(see and change who can see a calendar), meetings (read Google Meet calls, who joined, their transcripts and " +
      "Drive files); write,meetings also makes Google Meet spaces and changes the ones gcal made",
  ).argParser(grantList),
]

const scopeMissing = () =>
  new CliError("permission_error", "Google did not grant read access to Calendar", {
    reason: "oauth.scope-missing",
    grant: "read",
  })

/** Google lets the account untick a scope it was asked for, and still signs in. */
const refuseMissingScopes = (granted: readonly string[], grants: readonly Grant[]) => {
  if (!granted.includes(CALENDAR_READ_SCOPE)) throw scopeMissing()
  const missing = grants.find((grant) => !granted.includes(GRANT_SCOPES[grant]))
  if (missing) throw grantMissing(missing, `Google did not grant the ${missing} permission`, grants)
  if (scopesFor(grants).includes(MEET_WRITE_SCOPE) && !granted.includes(MEET_WRITE_SCOPE))
    throw grantMissing(["write", "meetings"], "Google did not grant the permission to make Google Meet spaces", grants)
}

const signingIn = (command: Command) => command.name() === "start"

export const sessionCommand = (): Command =>
  oauthSessionCommand({
    app: IDENTITY,
    resolveSettings: configuration.resolveSettings,
    providerId: "google",
    service: "Google",
    codec: googleTokenCodec,
    startOptions: START_OPTIONS,
    preset: (command, steps) => {
      const { settings, common } = contextOf(command)
      const { clientFile, clientId, grant = [] } = command.opts<StartOptions>()
      // A refresh or a revoke needs the client the profile signed in with, and its secret.
      const saved = signingIn(command) ? undefined : sessionStorage(common.env, common.profile, common.keyring).read()
      let client = saved?.client
      if (!client) {
        const configClientId = fromFile<string | undefined>(settings, "google_client_id", undefined).value
        try {
          client = googleClient(common.env, { file: clientFile, clientId, configClientId })
        } catch (error) {
          throw inWords(error, common.profile)
        }
      }
      if (steps && !client.clientSecret)
        outputFor(command).streams.diagnostic(
          "your Google app has no secret here, and Google refuses a Desktop app without one: set GCAL_GOOGLE_CLIENT_SECRET\n",
        )
      return { provider: googleProvider(client), scopes: [...SIGN_IN_SCOPES, ...scopesFor(grant)], rotating: false }
    },
    verify: (command, accessToken, events, scopes) => {
      const { common } = contextOf(command)
      return worded(common.profile, async () => {
        refuseMissingScopes(scopes, command.opts<StartOptions>().grant ?? [])
        const account = await accountEmail(accessToken, common.fetch ?? googleFetch, common.signal, events)
        const saved = savedAccount(common.env, common.profile)
        if (!signingIn(command) && saved && saved !== account)
          throw new CliError("authentication_error", "the saved sign-in belongs to another account", {
            reason: "profile.wrong-account",
            next: "sign-in",
          })
        return { id: account, account: { account, grants: grantsOf(scopes) } }
      })
    },
    claim: (env, profile, account) => {
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
    },
    afterSignIn: async (command, { env, profile, id }) => {
      rememberAccount(IDENTITY, profile, id, env)
      const store = await openGcalStore(env)
      let closed: Promise<void> | undefined
      const close = () => (closed ??= store.close())
      environmentOf<GcalEnvironment>(command).trackCloseable?.({ close })
      try {
        await store.accounts.saveProfile(IDENTITY.command, profile, { provider: PROVIDER.name, account: id })
      } finally {
        await close()
      }
    },
  })
