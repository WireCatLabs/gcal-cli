import { resolve } from "node:path"
import { syncDiscovery } from "@wirecat/cli-base/codegen"

await syncDiscovery(
  {
    calendar: "https://calendar-json.googleapis.com/$discovery/rest?version=v3",
    meet: "https://meet.googleapis.com/$discovery/rest?version=v2",
  },
  { dir: resolve(import.meta.dirname, "../spec/google") },
)
process.stderr.write("Public Discovery snapshot refreshed; review its diff and run pnpm generate\n")
