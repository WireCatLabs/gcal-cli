import { CliError } from "@wirecat/cli-base"
import { annotate, describeProgram } from "@wirecat/cli-base/commands"
import {
  changesAuthorityAt,
  environmentOf,
  type GlobalFlags,
  REMOTE_WRITE,
  readOnlyLockOf,
  refuseUnknownPermissionKeys,
  rootOf,
} from "@wirecat/cli-core/cli"
import { Command } from "commander"
import { configuration, permissions } from "../config.js"
import { IDENTITY } from "../identity.js"

export const mcpCommand = (): Command =>
  annotate(new Command("mcp"), {
    effects: REMOTE_WRITE,
    lifetime: "persistent",
    mcp: false,
    examples: [`${IDENTITY.command} personal mcp`],
  })
    .summary("serve this profile's commands to an AI agent")
    .description(
      `serve this profile's commands to an agent over MCP, on stdin and stdout, writes included; the profile's permissions decide — \`claude mcp add ${IDENTITY.command} -- ${IDENTITY.command} personal mcp\``,
    )
    .option(
      "--permission <key=level>",
      "make a permission stricter for this server only, like api.calendar.events.insert=deny; it never loosens the profile; repeat for more keys",
      (value: string, previous: string[] = []) => [...previous, value],
    )
    .action(async function (this: Command) {
      const flags = this.optsWithGlobals<GlobalFlags>()
      if (flags.json || flags.jsonl)
        throw new CliError("validation_error", "MCP over stdio controls its own output; leave out --json and --jsonl")
      const environment = environmentOf(this)
      const env = environment.env ?? process.env
      const settings = configuration.resolveSettings(flags, { env })
      // mcp has no key of its own, so the shared check before a run never looks at the keys --permission names.
      refuseUnknownPermissionKeys(this, settings, IDENTITY.command, permissions)
      const run = environment.runCommand
      if (!run) throw new Error("mcp runs inside the program's run(), which provides runCommand")
      const program = rootOf(this)
      const { serveMcp } = await import("../mcp.js")
      await serveMcp({
        profile: settings.profile,
        commands: describeProgram(program),
        levels: () => configuration.resolveSettings(flags, { env }).permissions,
        authority: changesAuthorityAt(program),
        permissions,
        readOnly: readOnlyLockOf(IDENTITY, env) !== undefined,
        ...(flags.permission?.length ? { overrides: flags.permission } : {}),
        run,
        ...(environment.signal ? { signal: environment.signal } : {}),
      })
    })
