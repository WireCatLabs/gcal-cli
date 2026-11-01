import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describeProgram } from "@wirecat/cli-base/commands"
import { changesAuthorityAt, checkGuide, readsOverMcpAt } from "@wirecat/cli-core/cli"
import { toolsFromCommands } from "@wirecat/cli-core/mcp"
import { expect, it } from "vitest"
import { permissions } from "./config.js"
import { createProgram, run } from "./program.js"
import { mcpClient } from "./testing/mcp.js"

const ran = async (argv: string[]) => {
  const out: string[] = []
  const err: string[] = []
  const code = await run(argv, {
    tty: false,
    streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
  })
  return { code, out: out.join(""), err: err.join("") }
}

it("serves search, read and write, names the untrusted text, and runs a command through the CLI", async () => {
  const { client, close } = await mcpClient()
  try {
    const { tools } = await client.listTools()
    expect(tools.map((tool) => tool.name).sort()).toEqual(["gcal_read", "gcal_tools_search", "gcal_write"])
    expect(client.getInstructions()).toContain("attendee and organizer names")
    const doctor = (await client.callTool({ name: "gcal_read", arguments: { command: "doctor" } })) as {
      structuredContent: { item: Record<string, unknown> }
    }
    expect(doctor.structuredContent.item).toMatchObject({ version: expect.any(String), credential_file: {} })
  } finally {
    expect(await close()).toBe(0)
  }
})

it("pins the commands an agent can find, and offers neither api call nor clearing a calendar", async () => {
  const program = createProgram()
  const tools = toolsFromCommands(describeProgram(program), {
    includeUnavailable: true,
    exclude: [["mcp"]],
    authority: changesAuthorityAt(program),
    fetchOnly: readsOverMcpAt(program),
    permissions,
  })
  const catalogue = Object.fromEntries(tools.map((tool) => [tool.command, tool.writes ? "write" : "read"]))
  await expect(`${JSON.stringify(catalogue, null, 2)}\n`).toMatchFileSnapshot("../contracts/mcp-catalogue.json")
  expect(Object.keys(catalogue)).not.toContain("api call")
  expect(Object.keys(catalogue)).not.toContain("api calendar-calendars-clear")
  expect(catalogue["api calendar-acl-insert"]).toBe("write")
})

it("mcp serve refuses a --permission that names no command", async () => {
  const { code, err } = await ran(["personal", "mcp", "serve", "--permission", "api.calendar.events.nope=deny"])
  expect(code).toBe(2)
  expect(err).toContain("api.calendar.events.nope")
})

it("mcp serve refuses to start while the config file saves a key that names no command", async () => {
  const file = join(process.env.GCAL_CONFIG_DIR ?? "", "config.json")
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify({ defaults: { permissions: { "api.calendar.events.nope": "deny" } } }))
  try {
    const { code, err } = await ran(["personal", "mcp", "serve"])
    expect(code).not.toBe(0)
    expect(err).toContain("api.calendar.events.nope")
  } finally {
    rmSync(file, { force: true })
  }
})

it("mcp serve takes --permission api=readonly over the deny defaults under it", async () => {
  const { client, close } = await mcpClient({}, ["--permission", "api=readonly"])
  expect((await client.listTools()).tools).toHaveLength(3)
  expect(await close()).toBe(0)
})

it("keeps every scenario step runnable", async () => {
  const packageRoot = fileURLToPath(new URL("..", import.meta.url))
  expect(await checkGuide(() => createProgram(), { packageRoot })).toEqual([])
})

it("mcp config prints an entry that serves the named profile, or every profile only when told", async () => {
  const one = await ran(["personal", "mcp", "config", "--permission", "api=readonly", "--json"])
  expect(one.code).toBe(0)
  const entry = JSON.parse(one.out).item.config.mcpServers["gcal-personal"]
  expect(entry.args.slice(-5)).toEqual(["personal", "mcp", "serve", "--permission", "api=readonly"])
  const all = await ran(["mcp", "config", "--profiles", "all", "--json"])
  expect(JSON.parse(all.out).item.config.mcpServers.gcal.args.slice(-4)).toEqual(["mcp", "serve", "--profiles", "all"])
})

it("mcp serve --profiles refuses a profile this computer does not have", async () => {
  const { code, err } = await ran(["mcp", "serve", "--profiles", "nope"])
  expect(code).toBe(2)
  expect(err).toContain('no profile named \\"nope\\"')
})

it("mcp revoke answers for the profile it names", async () => {
  const { code, out } = await ran(["personal", "mcp", "revoke", "--json"])
  expect(code).toBe(0)
  expect(JSON.parse(out).item).toMatchObject({ profile: "personal" })
})

it("guide lists the scenarios and gives one step by step", async () => {
  const list = await ran(["guide", "--json"])
  expect(JSON.parse(list.out).items.map((one: { name: string }) => one.name)).toEqual([
    "agent-access",
    "digest",
    "find-time",
    "prepare-meeting",
    "set-up",
    "person-brief",
  ])
  const one = await ran(["guide", "set-up", "--json"])
  expect(JSON.parse(one.out).item.steps[0].run).toContain("session start")
})
