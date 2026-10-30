import type { MessageStore } from "@wirecat/cli-core/store"
import { IDENTITY } from "./identity.js"

export const PROVIDER = {
  name: "google-calendar",
  kind: "events",
  aliases: ["gcal", "calendar"],
  command: IDENTITY.command,
} as const

/** The shared store, with gcal's provider entry written, so every other CLI's search knows it (WC-ARCH-21). */
export const openGcalStore = async (env: NodeJS.ProcessEnv): Promise<MessageStore> => {
  const { ensureSqlite } = await import("@wirecat/cli-core/sqlite-runtime")
  await ensureSqlite()
  const { openStore, storePath } = await import("@wirecat/cli-core/store")
  const store = await openStore({ path: storePath(env), env, command: IDENTITY.command, version: IDENTITY.version })
  try {
    // cli-core 0.475.0 still does not export its `registerProvider` wrapper from `./store`; this is the call it makes.
    await store.accounts.registerProvider(PROVIDER)
    return store
  } catch (error) {
    await store.close()
    throw error
  }
}
