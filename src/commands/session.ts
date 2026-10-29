import { CliError } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import {
  type BaseEnvironment,
  baseContext,
  commandWords,
  environmentOf,
  type GlobalFlags,
  itemOf,
  LOCAL_READ,
  LOCAL_WRITE,
  listOf,
  logsInOrOut,
  outputFor,
  profileFree,
  REMOTE_READ,
  REMOTE_WRITE,
  refuseCommandName,
  renderAnswer,
  rootOf,
  signInSteps,
} from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { configuration } from "../config.js"
import type { CredentialStorage } from "../google.js"
import { GRANTS, type Grant } from "../grants.js"
import { IDENTITY } from "../identity.js"
import { worded } from "./words.js"

/** What a test hands `run()` in place of Google and the system browser. */
export interface GcalEnvironment extends BaseEnvironment {
  fetch?: typeof fetch
  openBrowser?: (url: string) => Promise<void>
}

export const contextOf = (command: Command) => {
  const environment = environmentOf<GcalEnvironment>(command)
  const env = environment.env ?? process.env
  const flags = command.optsWithGlobals<GlobalFlags>()
  const { profile } = configuration.resolveSettings(flags, { env })
  return {
    environment,
    flags,
    common: {
      env,
      profile,
      keyring: environment.keyring,
      fetch: environment.fetch,
      signal: environment.signal,
    },
  }
}

const refuseOffline = (flags: GlobalFlags) => {
  if (flags.offline)
    throw new CliError("permission_error", "this needs Google; leave out --offline", { reason: "offline.refused" })
}

const grantList = (raw: string): Grant[] => {
  const values = raw.split(",").map((value) => value.trim())
  const unknown = values.filter((value) => !(GRANTS as readonly string[]).includes(value))
  if (unknown.length)
    throw new CliError("validation_error", `--grant takes ${GRANTS.join(", ")}; got ${unknown.join(", ")}`)
  return [...new Set(values as Grant[])]
}

const CREDENTIAL_STORAGES: readonly CredentialStorage[] = ["keyring", "file"]

const credentialStorage = (raw: string): CredentialStorage => {
  if (!(CREDENTIAL_STORAGES as readonly string[]).includes(raw))
    throw new CliError("validation_error", `--credential-storage takes ${CREDENTIAL_STORAGES.join(" or ")}; got ${raw}`)
  return raw as CredentialStorage
}

const answer = (command: Command, item: unknown) => renderAnswer(command, outputFor(command), itemOf(item))

const startCommand = () =>
  logsInOrOut(
    annotate(new Command("start"), {
      effects: REMOTE_WRITE,
      lifetime: "interactive",
      mcp: false,
      examples: [
        `${IDENTITY.command} personal session start --client-file ~/client_secret.json`,
        `${IDENTITY.command} personal session start --no-browser`,
        `${IDENTITY.command} personal session start --grant write,sharing`,
      ],
    }),
  )
    .description("sign in to Google in the browser; read-only unless you pass --grant write")
    .option("--client-file <file>", "your own Desktop app OAuth client JSON from Google Cloud Console")
    .option("--no-browser", "print the sign-in URL instead of opening a browser")
    .option(
      "--credential-storage <storage>",
      "where the sign-in is kept: keyring, or file for a private file where no keyring works",
      credentialStorage,
      "keyring",
    )
    .option(
      "--grant <scopes>",
      "also ask for these, comma-separated: write (create, change and delete events, and answer invitations), " +
        "sharing (see and change who can see a calendar)",
      grantList,
    )
    .action(async function (
      this: Command,
      args: { clientFile?: string; browser: boolean; grant?: Grant[]; credentialStorage: CredentialStorage },
    ) {
      const { environment, flags, common } = contextOf(this)
      refuseCommandName(common.profile, commandWords(rootOf(this)), IDENTITY.command)
      refuseOffline(flags)
      const { googleClient } = await import("../google.js")
      const client = googleClient(common.env, args.clientFile)
      const { streams } = outputFor(this)
      const steps = signInSteps({
        diagnostic: (line) => streams.diagnostic(`${line}\n`),
        json: flags.json === true || flags.jsonl === true || environment.tty === false,
        answers: false,
      })
      const { signIn } = await import("../session.js")
      const signedIn = await baseContext(this, configuration.resolveSettings).run((events) =>
        worded(common.profile, () =>
          signIn({
            ...common,
            events,
            client,
            grants: args.grant,
            storage: args.credentialStorage,
            openBrowser: args.browser ? (environment.openBrowser ?? (async () => {})) : async () => {},
            showUrl: (url) => {
              steps.openUrl(
                url,
                args.grant?.length
                  ? "Choose the Google account and allow read access to Calendar and the permissions it lists"
                  : "Choose the Google account and allow read access to Calendar",
              )
              streams.diagnostic(`Open Google sign-in: ${url}\n`)
            },
          }),
        ),
      )
      answer(this, signedIn)
    })

const statusCommand = () =>
  annotate(new Command("status"), {
    effects: REMOTE_READ,
    examples: [
      `${IDENTITY.command} personal session status`,
      `${IDENTITY.command} personal session status --check --json`,
    ],
  })
    .description("show this profile's saved Google sign-in; tokens are never printed")
    .option("--check", "ask Google whether the sign-in still works and which account it is")
    .action(async function (this: Command, args: { check?: boolean }) {
      const { flags, common } = contextOf(this)
      if (args.check) refuseOffline(flags)
      const { sessionStatus } = await import("../session.js")
      const status = await baseContext(this, configuration.resolveSettings).run((events) =>
        worded(common.profile, () => sessionStatus({ ...common, events, check: args.check === true })),
      )
      answer(this, status)
    })

const endCommand = () =>
  logsInOrOut(
    annotate(new Command("end"), {
      effects: LOCAL_WRITE,
      mcp: false,
      examples: [`${IDENTITY.command} personal session end`],
    }),
  )
    .description("sign this profile out of Google on this computer; stored calendar data stays")
    .action(async function (this: Command) {
      const { common } = contextOf(this)
      const { signOut } = await import("../session.js")
      answer(this, await baseContext(this, configuration.resolveSettings).run(() => signOut(common)))
    })

const listCommand = () =>
  profileFree(
    annotate(new Command("list"), {
      effects: LOCAL_READ,
      examples: [`${IDENTITY.command} session list`, `${IDENTITY.command} session list --json`],
    }),
  )
    .summary("list the profiles here and whether each is signed in")
    .description("list the profiles on this computer and whether each holds a Google sign-in; picks none")
    .action(async function (this: Command) {
      const environment = environmentOf<GcalEnvironment>(this)
      const env = environment.env ?? process.env
      const { configuredProfiles } = configuration.resolveSettings({}, { env, needsProfile: false })
      const { profileSignIns } = await import("../session.js")
      const items = profileSignIns(env, configuredProfiles, environment.keyring)
      renderAnswer(
        this,
        outputFor(this),
        listOf("session list", { items, limit: Math.max(1, items.length), has_more: false }),
      )
    })

export const sessionCommand = (): Command =>
  annotate(new Command("session"), { effects: LOCAL_READ })
    .description("sign in to Google and manage this profile's sign-in")
    .addCommand(startCommand())
    .addCommand(statusCommand())
    .addCommand(endCommand())
    .addCommand(listCommand())
