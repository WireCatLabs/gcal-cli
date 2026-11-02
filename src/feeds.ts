import { CliError, Credentials, type KeyringStore } from "@wirecat/cli-base"
import type { FeedRecord, FeedRegistry } from "@wirecat/cli-core/calendar"
import * as v from "valibot"
import { credentialsOptions, storageOf } from "./google.js"

const FEEDS = v.array(v.object({ id: v.string(), url: v.string(), title: v.nullable(v.string()) }))

/**
 * The profile's feeds, addresses and all, as one secret kept where its Google sign-in is: the keyring, or the 0600 file
 * when there is none or the owner chose it (WC-SECR-4). A moved run reads the owner's entry and writes only its own
 * (WC-SECR-24).
 */
export const feedRegistry = (env: NodeJS.ProcessEnv, profile: string, keyring?: KeyringStore): FeedRegistry => {
  const credentials = () =>
    new Credentials(credentialsOptions(env, storageOf(env, profile) === "file" ? "file" : "auto", keyring))
  const account = `feeds:${profile}`
  return {
    read: async (): Promise<FeedRecord[]> => {
      const saved = credentials().read(account)
      if (!saved) return []
      let parsed: unknown
      try {
        parsed = JSON.parse(saved.secret)
      } catch {
        parsed = undefined
      }
      if (!v.is(FEEDS, parsed))
        throw new CliError("configuration_error", `the feeds kept for profile ${profile} cannot be read`, {
          reason: "feed.no-address",
        })
      return parsed
    },
    write: async (feeds) => {
      if (feeds.length) credentials().write(account, JSON.stringify(feeds))
      else credentials().remove(account)
    },
  }
}
