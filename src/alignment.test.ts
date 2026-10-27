import { readFileSync } from "node:fs"
import type { Command } from "commander"
import { describe, expect, it } from "vitest"
import { createProgram } from "./program.js"

interface Method {
  id: string
  parameters?: Record<string, { required?: boolean }>
  request?: unknown
}
interface Resource {
  methods?: Record<string, Method>
  resources?: Record<string, Resource>
}
interface Discovery extends Resource {
  parameters: Record<string, unknown>
}

const discovery = JSON.parse(
  readFileSync(new URL("../spec/google/calendar.json", import.meta.url), "utf8"),
) as Discovery

const methodsOf = (resource: Resource): Method[] => [
  ...Object.values(resource.methods ?? {}),
  ...Object.values(resource.resources ?? {}).flatMap(methodsOf),
]

// Push notifications need a public HTTPS address, which a CLI on a laptop has none of.
const OFFERED = methodsOf(discovery).filter(({ id }) => !/\.watch$|^calendar\.channels\./u.test(id))

const flagOf = (name: string) => `--${name.replace(/[A-Z]+/gu, (upper) => `-${upper.toLowerCase()}`)}`
// cli-base's Discovery reader drops these as transport parameters: the sign-in travels in a header, never a flag.
const GLOBAL = Object.keys(discovery.parameters).filter((name) => !["key", "oauth_token"].includes(name))

describe("generated commands against the Discovery snapshot", () => {
  const api = createProgram().commands.find((command) => command.name() === "api") as Command
  const commandOf = (id: string) =>
    api.commands.find((command) => command.name() === flagOf(id).slice(2).replaceAll(".", "-"))

  it("offers one command per method, and no other", () => {
    expect(api.commands.length - ["list", "show", "call"].length).toBe(OFFERED.length)
    for (const { id } of OFFERED) expect(commandOf(id), id).toBeDefined()
  })

  it.each(OFFERED.map((method) => [method.id, method] as const))("%s takes exactly its parameters", (_id, method) => {
    const command = commandOf(method.id) as Command
    const parameters = method.parameters ?? {}
    const expected = [
      ...GLOBAL.map(flagOf),
      ...Object.keys(parameters).map(flagOf),
      ...(method.request ? ["--body", "--body-file"] : []),
    ]
    const own = command.options.map((option) => option.long ?? "").filter((flag) => flag !== "--dry-run")
    expect(own.sort()).toEqual(expected.sort())
    const required = command.options.filter((option) => option.mandatory).map((option) => option.long)
    expect(required.sort()).toEqual(
      Object.entries(parameters)
        .filter(([, parameter]) => parameter.required)
        .map(([name]) => flagOf(name))
        .sort(),
    )
  })
})
