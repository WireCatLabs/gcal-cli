#!/usr/bin/env node
import { enableCompileCache } from "node:module"
import { errorObjectOf, exitCodeOfError, renderError } from "@wirecat/cli-base"

enableCompileCache()
const [{ startCli }, { IDENTITY }] = await Promise.all([
  import("@wirecat/cli-core/cli/start"),
  import("../identity.js"),
])
await startCli({
  app: IDENTITY,
  run: async ({ args, openBrowser, ask }) =>
    (await import("../program.js")).run(args, {
      openBrowser: (url: string) => openBrowser(url),
      // ask() says false with nobody at a terminal too; without one, the run says to add --yes instead of "no".
      ...(process.stdin.isTTY && process.stderr.isTTY
        ? { answer: async (question: string) => ((await ask(question)) ? "y" : "n") }
        : {}),
    }),
  fail: (error, { tty }) => {
    const object = errorObjectOf(error)
    process.stderr.write(`${renderError(object, { cli: IDENTITY.command, interactive: tty })}\n`)
    return exitCodeOfError(object)
  },
})
