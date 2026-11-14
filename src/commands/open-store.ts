import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { isCliError } from "@wirecat/cli-base"
import { readOnlyLockOf } from "@wirecat/cli-core/cli"
import type { MessageStore } from "@wirecat/cli-core/store"
import { IDENTITY } from "../identity.js"

export type OpenStore = (env: NodeJS.ProcessEnv, options?: { readOnly?: boolean }) => Promise<MessageStore>

/** The rows a command needs in the store: found without a write, or saved. */
export interface StoreRows {
  /** The own account's id when its rows are already there; `locked` is the read-only lock, which saves none. */
  stored: (store: MessageStore, locked: boolean) => Promise<number | undefined>
  save: (store: MessageStore) => Promise<number>
}

const saved = async (env: NodeJS.ProcessEnv, rows: StoreRows, open: OpenStore) => {
  const store = await open(env)
  try {
    return { store, accountId: await rows.save(store) }
  } catch (error) {
    await store.close()
    throw error
  }
}

const empty = async (env: NodeJS.ProcessEnv, rows: StoreRows, open: OpenStore) => {
  const folder = mkdtempSync(join(tmpdir(), `${IDENTITY.command}-empty-`))
  const removing = () => rmSync(folder, { recursive: true, force: true })
  try {
    const opened = await saved({ ...env, MESSAGING_STORE: join(folder, "wirecat.db") }, rows, open)
    const close = opened.store.close.bind(opened.store)
    opened.store.close = () => close().finally(removing)
    return opened
  } catch (error) {
    removing()
    throw error
  }
}

/**
 * A command that only reads opens the store read-only, so parallel MCP reads take no write lock. The first read of a
 * profile, a store that is missing or needs a migration, and every command that writes open it for writing and save
 * the rows.
 *
 * Under `GCAL_READ_ONLY` a read whose rows are missing gets an empty store in a temporary folder instead, as
 * cli-core's `openCrmStore` does, so the lock creates no `wirecat.db`; the folder goes when the store closes.
 */
export const storeFor = async (env: NodeJS.ProcessEnv, readOnly: boolean, rows: StoreRows, open: OpenStore) => {
  const locked = readOnly && readOnlyLockOf(IDENTITY, env) !== undefined
  if (readOnly) {
    // Unlocked, a failed read-only open is never the answer: the writable open below says what is wrong, or fixes it.
    const store = await open(env, { readOnly: true }).catch((error) => {
      if (locked && !(isCliError(error) && error.code === "not_found")) throw error
      return undefined
    })
    if (store) {
      const accountId = await rows.stored(store, locked).catch(() => undefined)
      if (accountId !== undefined) return { store, accountId }
      await store.close()
    }
  }
  if (locked) return empty(env, rows, open)
  return saved(env, rows, open)
}
