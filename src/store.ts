import type { MessageStore } from "@wirecat/cli-core/store"
import { IDENTITY } from "./identity.js"

export const PROVIDER = {
  name: "google-calendar",
  kind: "events",
  aliases: ["gcal", "calendar"],
  command: IDENTITY.command,
} as const

/**
 * The shared store, with gcal's provider entry written, so every other CLI's search knows it (WC-ARCH-21). A read-only
 * open writes nothing, the entry included, and fails when the file is missing or needs a migration.
 */
export const openGcalStore = async (env: NodeJS.ProcessEnv, { readOnly = false } = {}): Promise<MessageStore> => {
  const { ensureSqlite } = await import("@wirecat/cli-core/sqlite-runtime")
  await ensureSqlite()
  const { openStore, storePath } = await import("@wirecat/cli-core/store")
  const store = await openStore({
    path: storePath(env),
    env,
    command: IDENTITY.command,
    version: IDENTITY.version,
    ...(readOnly ? { readOnly } : {}),
  })
  try {
    // cli-core 0.551.0 does not export its `registerProvider` wrapper from `./store`; this is the call it makes.
    if (!readOnly) await store.accounts.registerProvider(PROVIDER)
    return store
  } catch (error) {
    await store.close()
    throw error
  }
}
