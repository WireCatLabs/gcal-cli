import { createProgram } from "./command-program.ts"

const GENERATED =
  "generated from Google's Discovery document; src/alignment.test.ts checks every method's options against the " +
  "snapshot, and src/api.test.ts runs generated commands and `api call` through the one executor they share"

const api = createProgram().commands.find((command) => command.name() === "api")
const generatedOptions = [
  ...new Set(
    (api?.commands ?? [])
      .filter((command) => !["list", "show", "call"].includes(command.name()))
      .flatMap((command) => command.options.map((option) => option.long ?? "")),
  ),
].filter((name) => name && name !== "--help")

const SHARED_MCP =
  "cli-core's appMcpCommand; its app-mcp-command and mcp-server-command tests drive it, and src/mcp.test.ts runs " +
  "gcal's own server, config, revoke and refusals"
const SHARED_SCHEDULE =
  "cli-core's scheduleCommandFor; its schedule tests drive every timer and option, and src/schedule.test.ts installs, " +
  "lists, removes and runs gcal's reminder timer"

const LONG_RUNNING = `starts an HTTP server or a background process that runs until stopped; ${SHARED_MCP}`

export const UNTESTED: { command: string; option?: string; reason: string }[] = [
  ...[
    ...["--at", "--at-time", "--notify-on", "--deliver-to"].map((option) => ({ command: "schedule command", option })),
    { command: "schedule agent" },
    ...["--max-cost", "--every", "--at", "--at-time"].map((option) => ({ command: "schedule agent", option })),
    { command: "schedule run" },
  ].map((one) => ({ ...one, reason: SHARED_SCHEDULE })),
  ...["--http", "--port", "--public-url"].map((option) => ({ command: "mcp serve", option, reason: LONG_RUNNING })),
  ...[undefined, "--port", "--public-url", "--permission", "--profiles"].map((option) => ({
    command: "mcp server start",
    ...(option ? { option } : {}),
    reason: LONG_RUNNING,
  })),
  ...["mcp server stop", "mcp server status"].flatMap((command) => [
    { command, reason: LONG_RUNNING },
    { command, option: "--profiles", reason: LONG_RUNNING },
  ]),
  { command: "mcp revoke", option: "--profiles", reason: SHARED_MCP },
  {
    command: "models download",
    option: "--accept-terms",
    reason: "downloads a model from the network; cli-core's model-downloads tests drive the terms check",
  },
  {
    command: "models set",
    reason:
      "the shared model catalogue command from cli-core 0.609.0; cli-core's src/cli/model-catalogue-command.test.ts drives it offline",
  },
  {
    command: "models add",
    reason:
      "the shared model catalogue command from cli-core 0.609.0; cli-core's src/cli/model-catalogue-command.test.ts drives it offline",
  },
  {
    command: "models add",
    option: "--payload",
    reason:
      "the shared model catalogue command from cli-core 0.609.0; cli-core's src/cli/model-catalogue-command.test.ts drives it offline",
  },
  {
    command: "models add",
    option: "--offline",
    reason:
      "the shared model catalogue command from cli-core 0.609.0; cli-core's src/cli/model-catalogue-command.test.ts drives it offline",
  },
  ...[undefined, "--allow-writes", "--permission"].map((option) => ({
    command: "mcp add",
    ...(option ? { option } : {}),
    reason: `writes Codex's or Claude Code's own MCP settings; ${SHARED_MCP}`,
  })),
  ...[undefined, "--permission"].map((option) => ({
    command: "mcp check",
    ...(option ? { option } : {}),
    reason: `starts the installed gcal as a child process, as the agent would; ${SHARED_MCP}`,
  })),
  { command: "api *", reason: GENERATED },
  { command: "config migrate", reason: "cli-core's shared config command; its config-command tests drive it" },
  ...[undefined, "--dry-run"].map((option) => ({
    command: "config repair",
    ...(option ? { option } : {}),
    reason: "cli-core's shared config command; its config-repair and config-command tests drive it",
  })),
  ...generatedOptions.map((option) => ({ command: "api *", option, reason: GENERATED })),
  {
    command: "",
    option: "--help-all",
    reason: "Commander answers before any command runs, so the trace never sees it; contracts/help.snap covers help",
  },
  {
    command: "",
    option: "--version",
    reason: "Commander answers before any command runs, so the trace never sees it; `pnpm version:check` checks it",
  },
]
