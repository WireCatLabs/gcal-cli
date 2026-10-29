import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"

const check = (...args: string[]) => spawnSync("bin/gcal-write-check", args, { encoding: "utf8", env: process.env })

describe.skipIf(process.platform === "win32")("bin/gcal-write-check", () => {
  it("lists its steps in order on --dry-run, without building or calling Google", () => {
    const { status, stdout } = check("--dry-run", "personal", "test@group.calendar.example.com")
    expect(status).toBe(0)
    expect(
      stdout
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split(":")[0]),
    ).toEqual(["session", "calendar", "create", "update", "respond", "delete"])
  })

  it("refuses to run without both a profile and a calendar; it never picks either", () => {
    for (const args of [["--dry-run"], ["--dry-run", "personal"]]) {
      const { status, stderr } = check(...args)
      expect(status).toBe(2)
      expect(stderr).toContain("usage: bin/gcal-write-check")
    }
  })
})
