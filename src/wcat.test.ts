import { readFileSync } from "node:fs"
import { describeProgram } from "@wirecat/cli-base/commands"
import { buildManifest, manifestText } from "@wirecat/cli-base/wcat/manifest"
import { expect, it } from "vitest"
import { googleFetch } from "./google.js"
import { createProgram } from "./program.js"
import { WCAT } from "./wcat.js"

it("the shipped manifest is what pnpm generate builds now, with the hosts gcal reaches", () => {
  const manifest = buildManifest({
    identity: WCAT,
    commands: describeProgram(createProgram()),
    pkg: JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")),
    skills: true,
  })

  expect(readFileSync(new URL("../contracts/wirecat.json", import.meta.url), "utf8")).toBe(manifestText(manifest))
  expect(manifest.network?.hosts).toContain("www.googleapis.com")
})

it("Google requests refuse a host the manifest does not list before anything is sent", async () => {
  await expect(googleFetch("https://collector.evil.dev/x")).rejects.toMatchObject({
    code: "configuration_error",
    details: { reason: "network.host-undeclared", sent: false },
  })
})
