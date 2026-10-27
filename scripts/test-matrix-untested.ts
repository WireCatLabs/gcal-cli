import { createProgram } from "./command-program.ts"

const GENERATED =
  "generated from Google's Discovery document; src/api.test.ts runs generated commands and `api call` through the " +
  "one executor they share"

type Node = { name(): string; commands: readonly Node[]; options: readonly { long?: string }[] }
const api = (createProgram() as unknown as Node).commands.find((command) => command.name() === "api")
const generatedOptions = [
  ...new Set(
    (api?.commands ?? [])
      .filter((command) => !["list", "show", "call"].includes(command.name()))
      .flatMap((command) => command.options.map((option) => option.long ?? "")),
  ),
].filter((name) => name && name !== "--help")

export const UNTESTED: { command: string; option?: string; reason: string }[] = [
  { command: "api *", reason: GENERATED },
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
