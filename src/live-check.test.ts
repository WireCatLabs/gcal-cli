import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"

const check = (...args: string[]) => spawnSync("bin/gcal-live-check", args, { encoding: "utf8", env: process.env })

describe.skipIf(process.platform === "win32")("bin/gcal-live-check", () => {
  it("lists its steps in order on --dry-run, without building or calling Google", () => {
    const { status, stdout } = check("--dry-run", "personal", "planning")
    expect(status).toBe(0)
    expect(
      stdout
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split(":")[0]),
    ).toEqual(["session", "calendars", "sync", "sync-again", "embed", "search", "memo"])
  })

  it("refuses to run without a profile and a word; it never picks a profile", () => {
    const { status, stderr } = check("--dry-run", "personal")
    expect(status).toBe(2)
    expect(stderr).toContain("usage: bin/gcal-live-check")
  })
})
