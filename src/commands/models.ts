import { environmentOf, modelCatalogueCommand, outputFor, profileFree, renderAnswer } from "@wirecat/cli-core/cli"
import type { Command } from "commander"
import { IDENTITY } from "../identity.js"

/** The text models `search` and `sync --embed` use, in the folder every WireCat CLI shares. */
export const modelsCommand = (): Command => {
  let running: Command | undefined
  const environment = () => (running ? environmentOf(running) : {})
  const models = modelCatalogueCommand(IDENTITY, {
    kinds: ["text"],
    env: () => environment().env ?? process.env,
    output: (answer, command) => renderAnswer(command, outputFor(command), answer),
    diagnostic: (line) => environment().streams?.diagnostic(line),
  })
  models.hook("preAction", (_models, action) => {
    running = action
  })
  for (const command of models.commands) profileFree(command)
  return profileFree(models)
}
