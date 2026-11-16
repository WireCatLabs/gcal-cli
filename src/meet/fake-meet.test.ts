import { expect, it } from "vitest"
import { MEET_ACCESS as ACCESS, fakeMeet } from "../testing/fake-meet.js"
import { CONFERENCES, SPACES } from "../testing/meet-sample.js"

const get = (meet: ReturnType<typeof fakeMeet>, path: string, token = ACCESS) =>
  meet.fetch(`https://meet.googleapis.com/${path}`, { headers: { authorization: `Bearer ${token}` } })

it("the fake refuses what Meet refuses, so a name typed from memory fails a test (WC-TEST-19)", async () => {
  const meet = fakeMeet({ conferences: CONFERENCES, spaces: SPACES })
  expect((await get(meet, "v2/conferenceRecords?orderBy=start_time")).status).toBe(400)
  expect((await get(meet, 'v2/conferenceRecords?filter=title%3D"x"')).status).toBe(400)
  expect((await get(meet, "v2/conferenceRecords?filter=start_time>yesterday")).status).toBe(400)
  expect((await get(meet, "v2/conferenceRecords/rec-2/attendees")).status).toBe(404)
  expect((await get(meet, "v2/conferenceRecords", "someone-else")).status).toBe(401)
  expect(meet.refusals).toHaveLength(4)
  expect(() => fakeMeet({ conferences: [{ record: { name: "conferenceRecords/x", topic: "made up" } }] })).toThrow(
    "topic",
  )
  expect(() => fakeMeet({ conferences: [{ record: { name: "conferenceRecords/x", startTime: 5 } }] })).toThrow(
    "startTime",
  )
})

it("the fake coerces a page size past the maximum, and refuses a negative one", async () => {
  const conferences = Array.from({ length: 120 }, (_, at) => ({
    record: { name: `conferenceRecords/r${at}`, startTime: new Date(Date.UTC(2026, 10, 1, 0, at)).toISOString() },
  }))
  const meet = fakeMeet({ conferences })
  const page = (await (await get(meet, "v2/conferenceRecords?pageSize=500")).json()) as {
    conferenceRecords: unknown[]
    nextPageToken?: string
  }
  expect(page.conferenceRecords).toHaveLength(100)
  expect(page.nextPageToken).toEqual(expect.any(String))
  expect((await get(meet, "v2/conferenceRecords?pageSize=-1")).status).toBe(400)
  expect(meet.refusals).toHaveLength(1)
})

it("the fake refuses a page token used with another filter", async () => {
  const meet = fakeMeet({ conferences: CONFERENCES, spaces: SPACES })
  const first = (await (await get(meet, "v2/conferenceRecords?pageSize=1")).json()) as { nextPageToken: string }
  const other = `v2/conferenceRecords?pageSize=1&filter=end_time%20IS%20NULL&pageToken=${first.nextPageToken}`
  expect((await get(meet, other)).status).toBe(400)
})
