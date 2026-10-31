import { CliError, isCliError } from "@wirecat/cli-base"
import type { GoogleApi } from "../google-api.js"
import { IDENTITY } from "../identity.js"

const fixFor = (error: CliError, start: string): string | undefined => {
  const { reason, grant, next } = error.details
  switch (reason) {
    case "sign-in.expired":
      return `run ${start} again`
    case "profile.not-signed-in":
      return `run ${start}`
    // At sign-in the same reason means "use a new profile": signing in again there is what was just refused.
    case "profile.wrong-account":
      return next === "sign-in" ? `run ${start}` : undefined
    case "sign-in.scope-missing":
      if (grant === "read") return `run ${start} again and allow it on the consent screen`
      return typeof grant === "string"
        ? `run ${start} --grant ${grant} again and leave it ticked on the consent screen`
        : undefined
    case "sign-in.no-client":
      return "or pass --client-file <path> with the Desktop app client JSON from Google Cloud Console"
    case "api.scope-missing":
      return typeof grant === "string" ? `sign in again with ${start} --grant ${grant}` : undefined
    default:
      return undefined
  }
}

/** The command that signs a profile in; the layers below take these words from here and never write them. */
export const signInWords = (profile: string): string => `${IDENTITY.command} ${profile} session start`

/** The sign-in layers name a reason; the command to type is written here, where the commands are known. */
export const inWords = (error: unknown, profile: string): unknown => {
  if (!isCliError(error)) return error
  const fix = fixFor(error, signInWords(profile))
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
