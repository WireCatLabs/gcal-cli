import { hostFetch } from "@wirecat/cli-base/http"
import { createMeetingManagement, type ManagedMeetingChange } from "@wirecat/cli-core/meetings"
import { describe, expect, it } from "vitest"
import { DESKTOP } from "../identity.js"
import { MEET_ACCESS as ACCESS, fakeMeet } from "../testing/fake-meet.js"
import { meetOn } from "../testing/meet-sample.js"
import type { MeetApi } from "./api.js"
import { spacePorts } from "./spaces.js"

const NOW = Date.parse("2026-11-20T10:00:00Z")
const managed = (api: MeetApi) =>
  createMeetingManagement(
    { provider: "google-meet", account: "owner@example.com" },
    spacePorts(() => api),
    {
      now: () => NOW,
    },
  )
const createSpace = async (api: MeetApi, settings: Record<string, string | boolean>) =>
  (await managed(api).create({ settings }, { apply: true })).meeting
const updateSpace = (api: MeetApi, id: string, settings: Record<string, string | boolean>) =>
  managed(api).update(id, { settings }, { apply: true })
const apiOn = meetOn

const send = (meet: ReturnType<typeof fakeMeet>, method: string, path: string, body: unknown) =>
  meet.fetch(`https://meet.googleapis.com/${path}`, {
    method,
    headers: { authorization: `Bearer ${ACCESS}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  })

describe("create", () => {
  it("makes a space that starts now and answers its link, sending only the settings given", async () => {
    const meet = fakeMeet()
    const meeting = await createSpace(apiOn(meet), { access_type: "restricted", auto_transcription: true })
    expect(meeting).toEqual({
      id: "created-1",
      title: null,
      kind: "instant",
      startTime: new Date(NOW).toISOString(),
      durationMinutes: null,
      timezone: null,
      agenda: null,
      joinUrl: "https://meet.google.com/abc-mnop-xyz",
    })
    expect(meet.calls).toMatchObject([
      {
        method: "POST",
        path: "/v2/spaces",
        body: {
          config: {
            accessType: "RESTRICTED",
            artifactConfig: { transcriptionConfig: { autoTranscriptionGeneration: "ON" } },
          },
        },
      },
    ])
    expect(meet.refusals).toEqual([])
  })

  it("sends an empty config when no setting is given", async () => {
    const meet = fakeMeet()
    expect((await createSpace(apiOn(meet), {}))?.joinUrl).toBe("https://meet.google.com/abc-mnop-xyz")
    expect(meet.calls[0]?.body).toEqual({ config: {} })
  })

  it("refuses a title, a start time or an unknown setting before any request: a space has none", async () => {
    const meet = fakeMeet()
    const management = managed(apiOn(meet))
    const refused: ManagedMeetingChange[] = [
      { title: "Planning" },
      { startTime: "2026-11-20T10:00:00Z" },
      { settings: { entry_point_access: "all" } },
      { settings: { moderation: "maybe" } },
    ]
    for (const change of refused)
      await expect(management.create(change, { apply: true })).rejects.toMatchObject({ code: "validation_error" })
    expect(meet.calls).toEqual([])
  })

  it("a create that got no answer is outcome_unknown and never retried (WC-LIFE-9)", async () => {
    let calls = 0
    const api = meetOn({
      fetch: async () => {
        calls += 1
        throw new TypeError("fetch failed")
      },
    })
    await expect(createSpace(api, {})).rejects.toMatchObject({ code: "outcome_unknown", details: { retryable: false } })
    expect(calls).toBe(1)
  })
})

describe("update", () => {
  it("patches only the settings it names, in updateMask, and keeps the rest", async () => {
    const meet = fakeMeet()
    const api = apiOn(meet)
    await createSpace(api, { access_type: "restricted", moderation: true })
    const receipt = await updateSpace(api, "spaces/created-1", { access_type: "open", auto_recording: true })
    expect(receipt).toMatchObject({ applied: true, id: "spaces/created-1" })
    expect(meet.calls[1]).toMatchObject({
      method: "PATCH",
      path: "/v2/spaces/created-1",
      query: { updateMask: "config.accessType,config.artifactConfig.recordingConfig.autoRecordingGeneration" },
      body: { config: { accessType: "OPEN", artifactConfig: { recordingConfig: { autoRecordingGeneration: "ON" } } } },
    })
    expect(meet.refusals).toEqual([])
  })

  it("refuses an update that names no setting before any request", async () => {
    const meet = fakeMeet()
    await expect(updateSpace(apiOn(meet), "created-1", {})).rejects.toMatchObject({ code: "validation_error" })
    expect(meet.calls).toEqual([])
  })

  it("a space this app did not create is Google's refusal, and an unknown one is not found", async () => {
    const meet = fakeMeet({ spaces: [{ name: "spaces/owners-own", meetingCode: "own-meet-ing" }] })
    await expect(updateSpace(apiOn(meet), "owners-own", { moderation: true })).rejects.toMatchObject({
      code: "permission_error",
    })
    await expect(updateSpace(apiOn(meet), "nobody", { moderation: true })).rejects.toMatchObject({
      code: "not_found",
    })
  })
})

it("the fake refuses a write body Meet's schema does not allow, and a patch without its fields named", async () => {
  const meet = fakeMeet()
  expect((await send(meet, "POST", "v2/spaces", { config: { title: "Planning" } })).status).toBe(400)
  expect((await send(meet, "POST", "v2/spaces", { config: { accessType: "EVERYONE" } })).status).toBe(400)
  expect((await send(meet, "POST", "v2/spaces", { meetingUri: "https://meet.google.com/x" })).status).toBe(400)
  expect((await send(meet, "POST", "v2/spaces", {})).status).toBe(200)
  const patch = { config: { moderation: "ON" } }
  expect((await send(meet, "PATCH", "v2/spaces/created-1", patch)).status).toBe(400)
  expect((await send(meet, "PATCH", "v2/spaces/created-1?updateMask=*", patch)).status).toBe(400)
  expect((await send(meet, "PATCH", "v2/spaces/created-1?updateMask=config.title", patch)).status).toBe(400)
  expect((await send(meet, "PATCH", "v2/spaces/created-1?updateMask=config.moderation", patch)).status).toBe(200)
  expect(meet.refusals).toHaveLength(6)
})

it("a write keeps its method, body and content type through the host check a command's requests go through", async () => {
  const meet = fakeMeet()
  const fetch = hostFetch({ hosts: DESKTOP.hosts, fetch: meet.fetch })
  const api = meetOn({ fetch })
  await createSpace(api, { moderation: true })
  expect((await updateSpace(api, "created-1", { moderation: false })).applied).toBe(true)
  expect(meet.calls.map(({ method, body }) => ({ method, body }))).toEqual([
    { method: "POST", body: { config: { moderation: "ON" } } },
    { method: "PATCH", body: { config: { moderation: "OFF" } } },
  ])
  expect(meet.refusals).toEqual([])
})
