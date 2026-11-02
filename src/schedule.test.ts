import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryKeyring } from "@wirecat/cli-base"
import { describe, expect, it } from "vitest"
import { remindNotices } from "./commands/schedule.js"
import { run } from "./program.js"

const REMIND = ["events", "remind", "--due-within", "10m", "--", "/opt/bin/meeting-alert", "--loud"]

const machine = (platform: NodeJS.Platform, entry = ["/opt/node", "/opt/gcal/dist/bin/gcal.js"]) => {
  const ran: { argv: string[]; env: NodeJS.ProcessEnv }[] = []
  return {
    ran,
    system: {
      platform,
      uid: 501,
      entry,
      run: async (argv: string[], env: NodeJS.ProcessEnv) => {
        ran.push({ argv, env })
        return { code: 0, stdout: "", stderr: "" }
      },
      spawn: () => 0,
      pause: async () => {},
    },
  }
}

const harness = (platform: NodeJS.Platform = "linux", entry?: string[]) => {
  const root = mkdtempSync(join(tmpdir(), "schedule-"))
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: join(root, "home"),
    XDG_CONFIG_HOME: join(root, "home", ".config"),
    GCAL_CONFIG_DIR: join(root, "config"),
    GCAL_STATE_DIR: join(root, "state"),
    MESSAGING_STORE: join(root, "wirecat.db"),
  }
  const { system, ran } = machine(platform, entry)
  const keyring = memoryKeyring()
  const gcal = async (...argv: string[]) => {
    const out: string[] = []
    const err: string[] = []
    const code = await run(argv, {
      streams: { data: (text) => out.push(text), diagnostic: (text) => err.push(text) },
      tty: false,
      env,
      keyring,
      system,
    })
    return { code, out: out.join("\n"), err: err.join("\n") }
  }
  const file = join(root, "state", "schedules", "reminders", "schedule.json")
  return { gcal, env, ran, root, file }
}

describe("gcal schedule", () => {
  it("installs a systemd timer for events remind, keeping the program after the second --, and says the hook is denied", async () => {
    const { gcal, env, ran, file } = harness("linux")
    const added = await gcal("personal", "schedule", "command", "reminders", "--every", "5m", "--json", "--", ...REMIND)
    expect(added.code, added.err).toBe(0)
    expect(JSON.parse(readFileSync(file, "utf8"))).toMatchObject({
      kind: "command",
      argv: REMIND,
      when: { every: 5 },
      environment: { GCAL_PROFILE: "personal" },
    })
    const units = join(env.XDG_CONFIG_HOME ?? "", "systemd", "user")
    const service = readFileSync(join(units, "gcal-schedule-reminders.service"), "utf8")
    expect(service).toContain(
      `ExecStart="/opt/node" "/opt/gcal/dist/bin/gcal.js" "schedule" "exec" "${file.replaceAll("\\", "\\\\")}"`,
    )
    expect(readFileSync(join(units, "gcal-schedule-reminders.timer"), "utf8")).toContain("OnUnitInactiveSec=5min")
    expect(ran.map(({ argv }) => argv.join(" "))).toEqual([
      "systemctl --user daemon-reload",
      "systemctl --user enable --now gcal-schedule-reminders.timer",
    ])
    expect(added.err).toContain(
      "events.remind.hook is deny for profile personal, so every run refuses to start /opt/bin/meeting-alert",
    )
    expect(added.err).toContain("`gcal personal config set permissions.events.remind.hook allow`")
  })

  it("installing a schedule leaves events.remind.hook denied, and says nothing once the owner allows it", async () => {
    const { gcal } = harness("linux")
    await gcal("personal", "schedule", "command", "reminders", "--every", "5m", "--", ...REMIND)
    const level = await gcal("personal", "config", "get", "permissions.events.remind.hook", "--json")
    expect(level.out).not.toContain("allow")
    expect((await gcal("personal", "config", "set", "permissions.events.remind.hook", "allow")).code).toBe(0)
    const again = await gcal("personal", "schedule", "command", "reminders", "--every", "5m", "--", ...REMIND)
    expect(again.code, again.err).toBe(0)
    expect(again.err).not.toContain("events.remind.hook")
  })

  it("installs a launchd agent on macOS and a scheduled task on Windows", async () => {
    const mac = harness("darwin")
    expect(
      (await mac.gcal("personal", "schedule", "command", "reminders", "--every", "5m", "--", ...REMIND)).code,
    ).toBe(0)
    const plist = readFileSync(
      join(mac.env.HOME ?? "", "Library", "LaunchAgents", "gcal-cli.schedule.reminders.plist"),
      "utf8",
    )
    expect(plist).toContain("<key>StartInterval</key><integer>300</integer>")
    expect(plist).toContain(`<string>${mac.file}</string>`)
    expect(mac.ran.at(-1)?.argv.slice(0, 3)).toEqual(["launchctl", "bootstrap", "gui/501"])

    const windows = harness("win32", ["C:\\node.exe", "C:\\gcal\\gcal.js"])
    expect(
      (await windows.gcal("personal", "schedule", "command", "reminders", "--every", "5m", "--", ...REMIND)).code,
    ).toBe(0)
    const [task] = windows.ran
    expect(task?.argv[0]).toBe("powershell.exe")
    expect(task?.argv.at(-1)).toContain("Register-ScheduledTask")
    expect(task?.env).toMatchObject({ WIRECAT_EXE: "C:\\node.exe", WIRECAT_NAME: "reminders", WIRECAT_MINUTES: "5" })
    expect(task?.env.WIRECAT_ARGS).toContain('"schedule" "exec"')
  })

  it("lists the schedule, then removes its timer and file", async () => {
    const { gcal, env, file } = harness("linux")
    await gcal("personal", "schedule", "command", "reminders", "--every", "5m", "--", ...REMIND)
    const listed = JSON.parse((await gcal("personal", "schedule", "list", "--json")).out)
    expect(listed.items).toEqual([{ name: "reminders", kind: "command", when: "every 5m", last: null }])
    const removed = await gcal("personal", "schedule", "remove", "reminders", "--json")
    expect(removed.code, removed.err).toBe(0)
    expect(existsSync(file)).toBe(false)
    expect(existsSync(join(env.XDG_CONFIG_HOME ?? "", "systemd", "user", "gcal-schedule-reminders.timer"))).toBe(false)
  })

  it("refuses to install, remove, run or exec a schedule under GCAL_READ_ONLY", async () => {
    const { gcal, env, ran, file } = harness("linux")
    env.GCAL_READ_ONLY = "1"
    const added = await gcal("personal", "schedule", "command", "reminders", "--every", "5m", "--json", "--", ...REMIND)
    expect(added.code).not.toBe(0)
    expect(JSON.parse(added.err).error.code).toBe("permission_error")
    expect(existsSync(file)).toBe(false)
    expect(ran).toEqual([])

    delete env.GCAL_READ_ONLY
    await gcal("personal", "schedule", "command", "reminders", "--every", "5m", "--", ...REMIND)
    env.GCAL_READ_ONLY = "1"
    for (const words of [
      ["remove", "reminders"],
      ["run", "reminders"],
    ]) {
      const refused = await gcal("personal", "schedule", ...words, "--json")
      expect(JSON.parse(refused.err).error.code, words.join(" ")).toBe("permission_error")
    }
    const exec = await gcal("schedule", "exec", file, "--json")
    expect(JSON.parse(exec.err).error.code).toBe("permission_error")
    expect(existsSync(join(file, "..", "last.json"))).toBe(false)
  })

  it.skipIf(process.platform === "win32")(
    "the timer's schedule exec runs events remind with the program, with no terminal, no profile and no --yes",
    async () => {
      const root = mkdtempSync(join(tmpdir(), "entry-"))
      const seen = join(root, "seen.json")
      const script = join(root, "fake-gcal.js")
      writeFileSync(
        script,
        `require("fs").writeFileSync(${JSON.stringify(seen)}, JSON.stringify({ argv: process.argv.slice(2), profile: process.env.GCAL_PROFILE }))\n`,
      )
      const { gcal, file } = harness("linux", [process.execPath, script])
      await gcal("personal", "schedule", "command", "reminders", "--every", "5m", "--", ...REMIND)
      const exec = await gcal("schedule", "exec", file)
      expect(exec.code, exec.err).toBe(0)
      expect(JSON.parse(readFileSync(seen, "utf8"))).toEqual({ argv: REMIND, profile: "personal" })
      expect(JSON.parse(readFileSync(join(file, "..", "last.json"), "utf8")).exitCode).toBe(0)
    },
  )
})

describe("remindNotices", () => {
  const denied = { profile: "work", permissions: {} }
  const asks = { profile: "work", permissions: { "events.remind.hook": "ask" as const } }
  const allowed = { profile: "work", permissions: { "events.remind.hook": "allow" as const } }

  it("says nothing about another command, a reminder that only prints, or a dry run", () => {
    expect(remindNotices(["sync"], "5m", denied)).toEqual([])
    expect(remindNotices(["events", "remind", "--due-within", "10m"], "5m", denied)).toEqual([])
    expect(remindNotices(["events", "remind", "--dry-run", "--", "/bin/x"], "5m", denied)).toEqual([])
  })

  it("finds the program without a second --, and says a denied hook refuses it", () => {
    const [notice] = remindNotices(["events", "remind", "--due-within=15m", "/bin/x"], "5m", denied)
    expect(notice).toContain("events.remind.hook is deny for profile work, so every run refuses to start /bin/x")
  })

  it("says a hook that asks stops on a timer unless --yes is scheduled", () => {
    expect(remindNotices(["events", "remind", "--", "/bin/x"], "5m", asks)[0]).toContain("no terminal to answer it")
    expect(remindNotices(["events", "remind", "--yes", "--", "/bin/x"], "5m", asks)).toEqual([])
  })

  it("warns about a relative program path and a timer slower than the window", () => {
    const notices = remindNotices(["events", "remind", "--due-within", "5m", "--", "bin/alert"], "15m", allowed)
    expect(notices).toHaveLength(2)
    expect(notices[0]).toContain("every 15m but reminds only 5m ahead")
    expect(notices[1]).toContain("bin/alert is a relative path")
    expect(remindNotices(["events", "remind", "--", "notify-send"], "5m", allowed)).toEqual([])
  })
})
