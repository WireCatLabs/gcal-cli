import { CliError } from "@wirecat/cli-base"

/** The services `events create|update --conference` takes: Calendar makes the Meet link itself. */
export const CONFERENCES = ["google-meet"] as const

const unsafe = (id: string) => id === "" || id === "." || id === ".." || /[/?#\\\s]/.test(id)

/** A resource name Google sent: any other shape is Google's fault, not the caller's. */
export const ownId = (prefix: string, name: string | undefined): string => {
  const id = name?.startsWith(`${prefix}/`) ? name.slice(prefix.length + 1) : ""
  if (unsafe(id))
    throw new CliError("invalid_response", `Google Meet sent a ${prefix} name in a shape it does not document`)
  return id
}

export const idOf = (prefix: string, name: string): string =>
  name.startsWith(`${prefix}/`) ? name.slice(prefix.length + 1) : name

/** The space the owner named, checked before they are asked: a code or an empty id would only fail after. */
export const spaceIdOf = (given: string): string => {
  const id = idOf("spaces", given.trim())
  if (unsafe(id) || /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(id))
    throw new CliError(
      "validation_error",
      "name a space by the id meetings create answered (meeting.id), not its meeting code or link",
      { param: "meeting" },
    )
  return id
}
