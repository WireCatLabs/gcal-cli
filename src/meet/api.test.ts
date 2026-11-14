import { hostFetch } from "@wirecat/cli-base/http"
import { afterEach, expect, it, vi } from "vitest"
import { meetApi } from "./api.js"

const token = async () => "synthetic-token"
const answering =
  (body: string, status = 200) =>
  async () =>
    new Response(body, { status })
const hanging = async (_url: unknown, init?: RequestInit) =>
  new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)))

afterEach(() => {
  vi.useRealTimers()
})

it("a request that got no answer is provider_unavailable and safe to retry", async () => {
  const api = meetApi({ fetch: async () => Promise.reject(new TypeError("fetch failed")), accessToken: token })
  await expect(api.record("rec-1")).rejects.toMatchObject({
    code: "provider_unavailable",
    details: { retryable: true },
  })
})

it("a stopped run cancels its request", async () => {
  const stop = new AbortController()
  stop.abort()
  const api = meetApi({
    fetch: async () => Promise.reject(new Error("aborted")),
    accessToken: token,
    signal: stop.signal,
  })
  await expect(api.record("rec-1")).rejects.toMatchObject({ code: "cancelled" })
})

it("a request Google does not answer in 30 s is hostFetch's timeout, kept as it is", async () => {
  vi.useFakeTimers()
  const fetch = hostFetch({ hosts: ["meet.googleapis.com"], fetch: hanging })
  const pending = meetApi({ fetch, accessToken: token }).record("rec-1")
  const settled = expect(pending).rejects.toMatchObject({ code: "timeout", details: { retryable: true } })
  await vi.advanceTimersByTimeAsync(30_000)
  await settled
})

it("hostFetch's own refusals keep their codes", async () => {
  const offList = meetApi({ fetch: hostFetch({ hosts: ["example.com"] }), accessToken: token })
  await expect(offList.record("rec-1")).rejects.toMatchObject({ code: "configuration_error" })
  const down = hostFetch({ hosts: ["meet.googleapis.com"], fetch: async () => Promise.reject(new TypeError("down")) })
  await expect(meetApi({ fetch: down, accessToken: token }).record("rec-1")).rejects.toMatchObject({
    code: "network_error",
  })
})

it.each([
  ["something other than JSON", "<html>"],
  ["JSON in another shape", JSON.stringify({ name: 5 })],
])("an answer in %s is invalid_response", async (_what, body) => {
  await expect(meetApi({ fetch: answering(body), accessToken: token }).record("rec-1")).rejects.toMatchObject({
    code: "invalid_response",
  })
})

it("a list whose page token comes back again stops instead of looping", async () => {
  const fetch = answering(JSON.stringify({ participants: [], nextPageToken: "same" }))
  await expect(meetApi({ fetch, accessToken: token }).participants("rec-1")).rejects.toMatchObject({
    code: "invalid_response",
  })
})
