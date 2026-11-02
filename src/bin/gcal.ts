#!/usr/bin/env node
import { enableCompileCache } from "node:module"
import { errorObjectOf, exitCodeOfError, renderError } from "@wirecat/cli-base"
import { wcatStart } from "@wirecat/cli-base/wcat/start"
import { IDENTITY } from "../identity.js"

enableCompileCache()
const wcat = await wcatStart({
  command: IDENTITY.command,
  version: IDENTITY.version,
  description: IDENTITY.description,
  docs: "https://github.com/WireCatLabs/gcal-cli#readme",
})
if (wcat.code !== undefined) {
  process.exitCode = wcat.code
} else {
  const { startCli } = await import("@wirecat/cli-core/cli/start")
  await startCli({
    app: IDENTITY,
    run: async ({ args, openBrowser }) =>
      (await import("../program.js")).run(args, { openBrowser: (url: string) => openBrowser(url) }),
    fail: (error, { tty }) => {
      const object = errorObjectOf(error)
      process.stderr.write(`${renderError(object, { cli: IDENTITY.command, interactive: tty })}\n`)
      return exitCodeOfError(object)
    },
  })
}
