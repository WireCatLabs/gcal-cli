import { hostFetch } from "@wirecat/cli-base/http"
import { describe, expect, it } from "vitest"
import { DESKTOP } from "../identity.js"
import { MEET_ACCESS as ACCESS, fakeMeet } from "../testing/fake-meet.js"
import { meetOn } from "../testing/meet-sample.js"
import { createSpace, updateSpace } from "./spaces.js"

const apiOn = meetOn

const send = (meet: ReturnType<typeof fakeMeet>, method: string, path: string, body: unknown) =>
  meet.fetch(`https://meet.googleapis.com/${path}`, {
    method,
    headers: { authorization: `Bearer ${ACCESS}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  })

describe("create", () => {
  it("makes a space and answers its link and code, with Google's defaults for what it left out", async () => {
    const meet = fakeMeet()
    const space = await createSpace(apiOn(meet), { access_type: "restricted", auto_transcription: "on" })
    expect(space).toEqual({
      id: "created-1",
      join_url: "https://meet.google.com/abc-mnop-xyz",
      meeting_code: "abc-mnop-xyz",
      access_type: "restricted",
      entry_point_access: "all",
      moderation: null,
      auto_recording: null,
      auto_transcription: "on",
      auto_smart_notes: null,
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
    expect((await createSpace(apiOn(meet), {})).join_url).toBe("https://meet.google.com/abc-mnop-xyz")
    expect(meet.calls[0]?.body).toEqual({ config: {} })
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
    await createSpace(api, { access_type: "restricted", moderation: "on" })
    const space = await updateSpace(api, "spaces/created-1", { access_type: "open", auto_recording: "on" })
    expect(space).toMatchObject({ id: "created-1", access_type: "open", moderation: "on", auto_recording: "on" })
    expect(meet.calls[1]).toMatchObject({
      method: "PATCH",
      path: "/v2/spaces/created-1",
      query: { updateMask: "config.accessType,config.artifactConfig.recordingConfig.autoRecordingGeneration" },
    })
    expect(meet.refusals).toEqual([])
  })

  it("refuses an update that names no setting before any request", async () => {
    const meet = fakeMeet()
    await expect(updateSpace(apiOn(meet), "created-1", {})).rejects.toMatchObject({
      code: "validation_error",
    })
    expect(meet.calls).toEqual([])
  })

  it("a space this app did not create is Google's refusal, and an unknown one is not found", async () => {
    const meet = fakeMeet({ spaces: [{ name: "spaces/owners-own", meetingCode: "own-meet-ing" }] })
    await expect(updateSpace(apiOn(meet), "owners-own", { moderation: "on" })).rejects.toMatchObject({
      code: "permission_error",
    })
    await expect(updateSpace(apiOn(meet), "nobody", { moderation: "on" })).rejects.toMatchObject({
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
  await createSpace(api, { moderation: "on" })
  expect((await updateSpace(api, "created-1", { moderation: "off" })).moderation).toBe("off")
  expect(meet.calls.map(({ method, body }) => ({ method, body }))).toEqual([
    { method: "POST", body: { config: { moderation: "ON" } } },
    { method: "PATCH", body: { config: { moderation: "OFF" } } },
  ])
  expect(meet.refusals).toEqual([])
})
