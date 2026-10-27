import { CliError } from "@wirecat/cli-base"
import { annotate } from "@wirecat/cli-base/commands"
import type { QueryRegistry } from "@wirecat/cli-base/query"
import {
  answerEntity,
  baseContext,
  checkApiBody,
  checkApiParameter,
  environmentOf,
  generatedApiCommand,
  itemOf,
  LOCAL_READ,
  listOf,
  NO_EFFECTS,
  outputFor,
  overrideSharedContract,
  queryTerms,
  REMOTE_WRITE,
  readApiBody,
  readOnlyLockOf,
  readOnlyRefusal,
  refuseUnknownPermissionKeys,
  renderAnswer,
  snakeKeys,
  termField,
  terminalAsker,
  withQuery,
} from "@wirecat/cli-core/cli"
import { guardedWrite, guardFor, levelFor, newOperationId } from "@wirecat/cli-core/sends"
import { Command } from "commander"
import * as v from "valibot"
import { jsonObject, operationOf, operations, schemas } from "../api-contract.js"
import { type ApiMethod, apiMethod, apiMethods, validateApiParams } from "../api-methods.js"
import { CONFERENCE_SECRETS_NOTE, withoutConferenceSecrets } from "../conference.js"
import { apiKey, configuration, OWNER_ONLY, permissions } from "../config.js"
import { IDENTITY } from "../identity.js"
import { requestSchema } from "../schema.js"
import { contextOf } from "./session.js"

const EVENT_ANSWERS = new Set(["CalendarEvent", "CalendarEvents"])

const API_METHOD_QUERY = {
  entity: "api_method",
  backend: "native",
  fields: [termField("service", "enum", "service:calendar", { values: ["calendar"] })],
} as const satisfies QueryRegistry

/**
 * The profile's level for api.<method>, as the shared check gives a keyed command before it runs: `api call` has no
 * key of its own, and the shared check never sees its method. A write's `deny`, `readonly` and `ask` are the guard's.
 */
const permittedSettings = (command: Command, method: ApiMethod) => {
  const { flags, common } = contextOf(command)
  const overrides = environmentOf(command).agent?.overrides ?? []
  const settings = configuration.resolveSettings(
    overrides.length > 0 ? { ...flags, permission: [...overrides, ...(flags.permission ?? [])] } : flags,
    { env: common.env },
  )
  refuseUnknownPermissionKeys(command, settings, IDENTITY.command, permissions)
  const key = apiKey(method.name)
  const { level, key: named } = levelFor(settings.permissions, key, permissions.defaults)
  if (level === "deny" && !method.mutates)
    throw new CliError(
      "permission_error",
      `profile ${settings.profile} denies ${key} (permissions.${named} is deny, from the ` +
        `${settings.permissionSources[named ?? ""] ?? "default"})`,
      { permission: key },
    )
  return settings
}

const writeGuard = (command: Command, settings: ReturnType<typeof configuration.resolveSettings>) =>
  guardFor(
    IDENTITY,
    // Google enforces its own quotas; the guard is here for the levels and the journal, not a send limit.
    { ...settings, sendsPerHour: Number.MAX_SAFE_INTEGER, permissionDefaults: permissions.defaults },
    outputFor(command).renderer.warn,
    environmentOf(command).env ?? process.env,
    terminalAsker(command),
  )

const call = async (
  command: Command,
  name: string,
  params: Record<string, unknown>,
  body?: Record<string, unknown>,
) => {
  const { flags, common } = contextOf(command)
  const method = apiMethod(name)
  if (flags.offline)
    throw new CliError("permission_error", "this needs Google; leave out --offline", { reason: "offline.refused" })
  const lock = readOnlyLockOf(IDENTITY, common.env)
  if (lock && method.mutates) throw readOnlyRefusal(lock, "change Google Calendar")
  const settings = permittedSettings(command, method)
  const [{ apiAccess }, { googleApi }] = await Promise.all([import("../session.js"), import("../google-api.js")])
  const options = apiAccess(common)
  const act = () =>
    baseContext(command, configuration.resolveSettings).run((events) =>
      googleApi({ ...options, events }).call(name, params, body),
    )
  const operationId = method.mutates ? newOperationId() : undefined
  const result = operationId
    ? await guardedWrite(
        writeGuard(command, settings),
        { chatId: null, kind: "edit", key: apiKey(name), operationId },
        act,
      )
    : await act()
  // gcal's rule: a meeting's passcode never leaves Google through gcal, whichever method returned the event.
  const safe = withoutConferenceSecrets(result)
  const shown = safe === null || typeof safe !== "object" || Array.isArray(safe) ? { data: safe } : safe
  renderAnswer(
    command,
    outputFor(command),
    itemOf(snakeKeys({ ...shown, ...(operationId ? { operation_id: operationId } : {}) })),
  )
}

const listCommand = () =>
  withQuery(
    answerEntity(
      annotate(new Command("list"), {
        effects: NO_EFFECTS,
        examples: [`${IDENTITY.command} api list`, `${IDENTITY.command} api list service:calendar`],
      }).description("list the Google Calendar API methods gcal can call"),
      "api_method",
      v.strictObject({ name: v.string(), mutates: v.boolean(), destructive: v.boolean(), scope: v.string() }),
    ),
    API_METHOD_QUERY,
  ).action(function (this: Command, words: string[]) {
    const items = apiMethods(queryTerms(words, API_METHOD_QUERY, "api list").get("service"))
    renderAnswer(this, outputFor(this), listOf("", { items, limit: Math.max(1, items.length), has_more: false }))
  })

const showCommand = () =>
  annotate(new Command("show"), {
    effects: NO_EFFECTS,
    examples: [`${IDENTITY.command} api show calendar.events.list --json`],
  })
    .description("show one method's request schema and contract, without calling Google")
    .argument("<method>", "Google method name, as api list prints it")
    .action(function (this: Command, method: string) {
      renderAnswer(
        this,
        outputFor(this),
        itemOf({
          operation: operationOf(method),
          request_schema: requestSchema(method),
          ...(EVENT_ANSWERS.has(operationOf(method).response?.schema ?? "") ? { answer: CONFERENCE_SECRETS_NOTE } : {}),
        }),
      )
    })

const callCommand = () =>
  annotate(new Command("call"), {
    mcp: false,
    effects: REMOTE_WRITE,
    examples: [
      `${IDENTITY.command} personal api call calendar.events.list --params '{"calendarId":"primary","maxResults":10}'`,
      `${IDENTITY.command} personal api call calendar.freebusy.query --body '{"timeMin":"2026-11-02T00:00:00Z","timeMax":"2026-11-03T00:00:00Z","items":[{"id":"primary"}]}'`,
    ],
  })
    .description("call one Google Calendar API method by name with JSON parameters")
    .argument("<method>", "Google method name, as api list prints it")
    .option("--params <json>", "query and path parameters as a JSON object", jsonObject, {})
    .option("--body <json>", "request body as a JSON object", jsonObject)
    .action(async function (
      this: Command,
      name: string,
      args: { params: Record<string, unknown>; body?: Record<string, unknown> },
    ) {
      validateApiParams(args.params)
      await call(this, name, args.params, args.body)
    })

export const apiCommand = (): Command => {
  const api = annotate(new Command("api"), { effects: LOCAL_READ }).description(
    "discover and call the official Google Calendar API methods",
  )
  api.addCommand(listCommand()).addCommand(showCommand()).addCommand(callCommand())
  const generated = generatedApiCommand({
    operations,
    checkParameter: (name, schema, raw) => checkApiParameter(name, schema, raw, schemas),
    checkBody: (operation, text) => checkApiBody(operation, text, schemas),
    readBody: (_command, options) => readApiBody(options),
    execute: async (command, operation, input) =>
      call(
        command,
        operation.id,
        { ...input.path, ...input.query },
        input.body === undefined ? undefined : jsonObject(input.body),
      ),
  })
  for (const child of generated.commands) {
    const operation = operations.find((one) => one.command === child.name())
    if (operation && OWNER_ONLY.test(operation.id))
      overrideSharedContract(
        child,
        "sharing a calendar, emptying it and giving it away stay with the owner at a terminal (NEED-1857)",
        (command) => annotate(command, { mcp: false }),
      )
  }
  // Only the children: the generated group's own --store-token is for Bot API credentials.
  for (const child of [...generated.commands]) api.addCommand(child)
  return api
}
