import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import {
  adaptDiscovery,
  coverageGenerator,
  definitionsGenerator,
  generate,
  manifestGenerator,
  readDiscovery,
  typesGenerator,
  valibotGenerator,
  writeArtifacts,
} from "@wirecat/cli-base/codegen"

const root = resolve(import.meta.dirname, "..")
const webhook = "needs a public HTTPS address to receive Google's notifications, which a local CLI does not have"
const { calendar, meet } = readDiscovery(`${root}/spec/google`)
const { model, metadata, services } = adaptDiscovery(
  { calendar },
  {
    sourceRevision: "spec/google/provenance.json",
    exclude: {
      "calendar.events.watch": webhook,
      "calendar.calendarList.watch": webhook,
      "calendar.acl.watch": webhook,
      "calendar.settings.watch": webhook,
      "calendar.channels.stop": "stops a notification channel, and gcal never opens one",
    },
  },
)
const unread = "gcal reads a call through the list methods, which return every field the get would"
const members = "meeting space members are not part of the meetings commands"
type Method = { path: string; flatPath?: string; parameters?: Record<string, unknown>; parameterOrder?: string[] }
type Resource = { methods?: Record<string, Method>; resources?: Record<string, Resource> }
/**
 * Meet's paths are `v2/{+name}`, one template for a call and a space alike, which a manifest cannot tell apart; its
 * `flatPath` names each id on its own, and gcal encodes each as one segment, so an id never reaches another method.
 */
const withFlatPaths = (resource: Resource): Resource => ({
  ...resource,
  ...(resource.methods && {
    methods: Object.fromEntries(
      Object.entries(resource.methods).map(([name, method]) => {
        if (!method.flatPath || method.flatPath === method.path) return [name, method]
        const ids = [...method.flatPath.matchAll(/\{(\w+)\}/g)].map(([, id]) => id as string)
        const { name: _name, parent: _parent, ...rest } = method.parameters ?? {}
        const own = Object.fromEntries(
          ids.map((id) => [
            id,
            {
              type: "string",
              location: "path",
              required: true,
              description: `The id after ${id.replace(/Id$/, "")}/.`,
            },
          ]),
        )
        const order = (method.parameterOrder ?? []).filter((one) => one !== "name" && one !== "parent")
        return [
          name,
          { ...method, path: method.flatPath, parameters: { ...own, ...rest }, parameterOrder: [...ids, ...order] },
        ]
      }),
    ),
  }),
  ...(resource.resources && {
    resources: Object.fromEntries(Object.entries(resource.resources).map(([name, one]) => [name, withFlatPaths(one)])),
  }),
})
/** Meet's states and settings as plain strings: a value Google adds later must not fail the whole answer. */
const withoutEnums = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.map(withoutEnums)
  if (!node || typeof node !== "object") return node
  const { enum: _enum, enumDescriptions: _descriptions, ...rest } = node as Record<string, unknown>
  return Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, withoutEnums(value)]))
}
// Meet is generated apart so its methods stay out of `gcal api`, its permission keys and its coverage page.
const meetModel = adaptDiscovery(
  {
    meet: {
      ...withFlatPaths(meet as Resource),
      schemas: withoutEnums((meet as { schemas: unknown }).schemas),
    },
  },
  {
    sourceRevision: "spec/google/provenance.json",
    exclude: {
      "meet.spaces.endActiveConference": "ends a call for everyone in it, which no gcal command does",
      "meet.spaces.members.list": members,
      "meet.spaces.members.get": members,
      "meet.spaces.members.create": members,
      "meet.spaces.members.patch": members,
      "meet.spaces.members.delete": members,
      "meet.spaces.members.batchUpdate": members,
      "meet.conferenceRecords.recordings.get": unread,
      "meet.conferenceRecords.smartNotes.get": unread,
      "meet.conferenceRecords.transcripts.get": unread,
      "meet.conferenceRecords.transcripts.entries.get": unread,
      "meet.conferenceRecords.participants.get": unread,
      "meet.conferenceRecords.participants.participantSessions.list":
        "gcal keeps a participant's first join and last leave only",
      "meet.conferenceRecords.participants.participantSessions.get":
        "gcal keeps a participant's first join and last leave only",
    },
  },
)
const artifacts = generate(
  model,
  [
    typesGenerator({ path: "src/generated/types.ts" }),
    valibotGenerator({ path: "src/generated/schemas.ts", typesImport: "./types.js" }),
    manifestGenerator({ path: "src/generated/manifest.ts" }),
    definitionsGenerator({ path: "src/generated/definitions.ts" }),
    coverageGenerator({
      path: "docs/dev/API_COVERAGE.md",
      title: "Google Calendar API coverage",
      command: (op) => `gcal <profile> api ${op.command}`,
    }),
  ],
  {
    banner: ["Source: spec/google/*.json, verified by provenance.json", "Run: pnpm generate"],
    overrides: {
      "calendar.freebusy.query": { effect: "read", reason: "a POST that only reads when calendars are busy" },
      "calendar.calendars.clear": {
        effect: "destructive",
        reason: "a POST that deletes every event of the primary calendar",
      },
      "calendar.calendars.transferOwnership": {
        effect: "destructive",
        reason: "a POST that gives the calendar to another account; the owner loses it",
      },
    },
  },
)
artifacts.push({
  path: "src/generated/metadata.ts",
  content: `export const metadata = ${JSON.stringify({ ...metadata, services }, null, 2)}\n`,
})
const banner = ["Source: spec/google/meet.json, verified by provenance.json", "Run: pnpm generate"]
artifacts.push(
  ...generate(
    meetModel.model,
    [
      typesGenerator({ path: "src/generated/meet/types.ts" }),
      valibotGenerator({ path: "src/generated/meet/schemas.ts", typesImport: "./types.js" }),
      manifestGenerator({ path: "src/generated/meet/manifest.ts" }),
    ],
    { banner },
  ),
  {
    path: "src/generated/meet/metadata.ts",
    content: `export const metadata = ${JSON.stringify({ ...meetModel.metadata, services: meetModel.services }, null, 2)}\n`,
  },
)
const format = (path: string, content: string) =>
  path.endsWith(".ts")
    ? execFileSync(
        process.execPath,
        [`${root}/node_modules/@biomejs/biome/bin/biome`, "check", "--write", `--stdin-file-path=${path}`],
        { cwd: root, encoding: "utf8", input: content },
      )
    : content
const stale = writeArtifacts(artifacts, { root, check: process.argv.includes("--check"), format })
if (process.argv.includes("--check") && stale.length) {
  process.stderr.write(`Generated files are stale: ${stale.join(", ")}; run pnpm generate\n`)
  process.exitCode = 1
}
process.stderr.write(
  `${model.operations.length + meetModel.model.operations.length} operations generated from a verified offline snapshot\n`,
)
