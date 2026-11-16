import { expect, it } from "vitest"
import { fakeMeet } from "../testing/fake-meet.js"
import { CONFERENCES, meetOn, SPACES } from "../testing/meet-sample.js"

it("an answer in another shape than Meet's schema is invalid_response, named for Google Meet", async () => {
  const api = meetOn({ fetch: async () => new Response(JSON.stringify({ name: 5 })) })
  await expect(api.record("rec-1")).rejects.toMatchObject({
    code: "invalid_response",
    message: expect.stringContaining("Google Meet"),
  })
})

it("an id is one path segment: a slash in it never reaches another Meet method", async () => {
  const meet = fakeMeet({ conferences: CONFERENCES, spaces: SPACES })
  await expect(meetOn(meet).participants("rec-2/participants/p1")).rejects.toMatchObject({ code: "not_found" })
  expect(meet.calls.map(({ path }) => path)).toEqual(["/v2/conferenceRecords/rec-2%2Fparticipants%2Fp1/participants"])
  await expect(meetOn(meet).record("..")).rejects.toMatchObject({ details: { reason: "api.bad-path-id" } })
})

it("a list longer than one page is read to its end", async () => {
  const entries = Array.from({ length: 230 }, (_, at) => ({
    name: `conferenceRecords/rec-2/transcripts/t1/entries/e${at}`,
    text: `line ${at}`,
    startTime: new Date(Date.UTC(2026, 10, 9, 10, 0, at)).toISOString(),
  }))
  const conferences = structuredClone(CONFERENCES)
  const long = conferences[1]?.transcripts?.[0]
  if (!long) throw new Error("the sample has no transcript")
  long.entries = entries
  const meet = fakeMeet({ conferences, spaces: SPACES })
  expect(await meetOn(meet).entries("rec-2", "t1")).toHaveLength(230)
  expect(meet.calls).toHaveLength(3)
})
