import { CliError, isCliError } from "@wirecat/cli-base"
import type { GoogleApi } from "../google-api.js"
import { IDENTITY } from "../identity.js"

const fixFor = (error: CliError, start: string): string | undefined => {
  const { reason, grant } = error.details
  switch (reason) {
    case "sign-in.expired":
      return `run ${start} again`
    case "profile.not-signed-in":
    case "profile.wrong-account":
      return `run ${start}`
    case "sign-in.scope-missing":
      return grant === "read"
        ? `run ${start} again and allow it on the consent screen`
        : `run ${start} --grant ${String(grant)} again and leave it ticked on the consent screen`
    case "api.scope-missing":
      return typeof grant === "string" ? `sign in again with ${start} --grant ${grant}` : undefined
    default:
      return undefined
  }
}

/** The sign-in layers name a reason; the command to type is written here, where the commands are known. */
export const inWords = (error: unknown, profile: string): unknown => {
  if (!isCliError(error)) return error
  const fix = fixFor(error, `${IDENTITY.command} ${profile} session start`)
  return fix ? new CliError(error.code, `${error.message}; ${fix}`, error.details) : error
}

export const worded = async <T>(profile: string, act: () => Promise<T>): Promise<T> => {
  try {
    return await act()
  } catch (error) {
    throw inWords(error, profile)
  }
}

export const wordedApi = (api: GoogleApi, profile: string): GoogleApi => ({
  call: (...args) => worded(profile, () => api.call(...args)),
})
