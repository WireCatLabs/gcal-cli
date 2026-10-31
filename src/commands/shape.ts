import { EventEmitter } from "node:events"
import { CliError } from "@wirecat/cli-base"
import { annotate, overrideSharedContract } from "@wirecat/cli-base/commands"
import {
  dateRange,
  type Predicate,
  type QueryRegistry,
  queryError,
  queryFieldsOf,
  timezoneOf,
} from "@wirecat/cli-base/query"
import { LIST_QUERY_GUIDE, listQuery, nativeTerms, type QueryWords, typedQuery, withQuery } from "@wirecat/cli-core/cli"
import { event } from "@wirecat/cli-core/meetings"
import { Argument, Command } from "commander"

const COMMAND = "events list"

const oneSided = (side: "lower" | "upper", alternative: string) => (node: Predicate) => {
  const open = node.operator === "range" && (side === "lower" ? node.upper === "*" : node.value === "*")
  if (!open)
    queryError("query.unsupported-operator", node.span, alternative, { command: COMMAND, guide: LIST_QUERY_GUIDE })
}

/**
 * The shared store finds events that end after one moment and start before another, so `starts_at` takes only its
 * latest value and `ends_at` only its earliest: anything else would be answered from part of the list.
 */
export const EVENTS_QUERY: QueryRegistry = {
  entity: "event",
  backend: "native",
  fields: queryFieldsOf(event, {
    native: ["starts_at", "ends_at", "changed_at", "calendar", "person"],
    relations: {
      calendar: { type: "kw", example: "calendar:3", relation: "one calendar, by its id or the provider's id" },
      person: {
        type: "kw",
        example: "person:ana@example.com",
        relation: "events one person attends: an address, or a person id from search",
      },
    },
    examples: {
      starts_at: "starts_at<2026-11-07",
      ends_at: "ends_at>=2026-11-02",
      changed_at: "changed_at>=2026-10-01",
    },
    validate: {
      starts_at: oneSided(
        "upper",
        "starts_at takes only a latest start, such as starts_at<2026-11-07; for the earliest, write ends_at>=2026-11-02",
      ),
      ends_at: oneSided(
        "lower",
        "ends_at takes only an earliest end, such as ends_at>=2026-11-02; for the latest, write starts_at<2026-11-07",
      ),
      changed_at: oneSided("lower", "changed_at takes only a start, such as changed_at>=2026-10-01"),
    },
  }).map((field) =>
    field.native
      ? { ...field, operators: field.type === "time" ? (["range"] as const) : (["term", "phrase"] as const) }
      : field,
  ),
}

const WITHOUT_TIME =
  "\nends_at keeps events that end after its moment, so one that ends exactly then is left out. Without starts_at " +
  "or ends_at: events from the start of today on, in your time zone."

/** The standard query as the words cli-core's `events list` reads, which the owner may no longer type (NEED-2056). */
export const eventsWords = (words: QueryWords): string[] => {
  const zone = timezoneOf()
  const at = (time: number) => new Date(time).toISOString()
  const terms = nativeTerms(listQuery(typedQuery(words), EVENTS_QUERY, COMMAND), COMMAND)
  return [...terms].map(([field, node]) => {
    if (node.operator !== "range") return `${field}:${node.value}`
    const range = dateRange(
      node.value,
      node.upper ?? "*",
      node.lower_inclusive !== false,
      node.upper_inclusive !== false,
      zone,
      node.span,
    )
    const { lower = 0, upper = 0 } = range
    if (field === "starts_at") return `to:${at(range.upper_inclusive ? upper : upper - 1)}`
    if (field === "ends_at") return `from:${at(lower)}`
    return `changed:${at(range.lower_inclusive ? lower : lower + 1)}`
  })
}

const childNamed = (parent: Command, name: string) => {
  const child = parent.commands.find((one) => one.name() === name)
  if (!child) throw new CliError("configuration_error", `the shared calendar commands have no ${name}`)
  return child
}

const detach = (parent: Command, child: Command) => {
  const children = parent.commands as Command[]
  children.splice(children.indexOf(child), 1)
}

/**
 * cli-core's calendar commands in the shape the other WireCat tools use (NEED-2052, NEED-2056): `store status`,
 * `search events <query>` and an `events list` that takes the standard field query. cli-core still builds the old
 * paths, so they are moved here; the commands keep their actions and answers.
 */
export const reshape = (program: Command): void => {
  const name = program.name()
  const status = childNamed(program, "status")
  const search = childNamed(program, "search")
  const list = childNamed(childNamed(program, "events"), "list")

  detach(program, status)
  overrideSharedContract(status, "gcal keeps the sync's progress under store status, as max does (NEED-2052)", (one) =>
    annotate(one, { examples: [`${name} personal store status --json`] }),
  )
  program.addCommand(new Command("store").description("the local store of calendar events").addCommand(status))

  detach(program, search)
  overrideSharedContract(
    search,
    "a search names what it finds, search events <query>, as max does (NEED-2052)",
    (one) => {
      one.name("events")
      ;(one.registeredArguments as Argument[]).splice(
        0,
        1,
        new Argument("<query...>", "what to find in titles, descriptions, places and attendees"),
      )
      annotate(one, {
        examples: [
          `${name} personal search events roadmap planning --json`,
          `${name} personal search events --backend server quarterly review`,
        ],
      })
    },
  )
  program.addCommand(new Command("search").description("find stored things by text: events").addCommand(search))

  overrideSharedContract(
    list,
    "events list takes the standard field query and no words of its own (NEED-2056)",
    (one) => {
      ;(one.registeredArguments as Argument[]).length = 0
      // cli-core attached help for the words this list no longer takes.
      if (one instanceof EventEmitter) one.removeAllListeners("afterHelp")
      withQuery(one, EVENTS_QUERY).addHelpText("after", WITHOUT_TIME)
      annotate(one, {
        examples: [
          `${name} personal events list ends_at>=2026-11-02 starts_at<2026-11-07 --json`,
          `${name} personal events list ends_at>=today person:ana@example.com`,
        ],
      })
      one.hook("preAction", (_list, command) => {
        command.processedArgs[0] = eventsWords(command.processedArgs[0] as QueryWords)
      })
    },
  )
}
