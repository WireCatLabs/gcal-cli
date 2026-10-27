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
  issueMessage,
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
  renderAnswer,
  snakeKeys,
  termField,
  unknownPermissionIssues,
  withQuery,
} from "@wirecat/cli-core/cli"
import {
  type Asker,
  guardedWrite,
  levelFor,
  newOperationId,
  RecipientList,
  recipientsPathFor,
  SendJournal,
  sendGuard,
  sendsPathFor,
} from "@wirecat/cli-core/sends"
import { Command } from "commander"
import * as v from "valibot"
import { jsonObject, operationOf, operations, schemas } from "../api-contract.js"
import { type ApiMethod, apiMethod, apiMethods, validateApiParams } from "../api-methods.js"
import { apiKey, configuration, OWNER_ONLY, permissions } from "../config.js"
import { IDENTITY } from "../identity.js"
import { requestSchema } from "../schema.js"
import { contextOf } from "./session.js"

const API_METHOD_QUERY = {
  entity: "api_method",
  backend: "native",
  fields: [termField("service", "enum", "service:calendar", { values: ["calendar"] })],
} as const satisfies QueryRegistry

/** Over MCP an `ask` goes ahead (NEED-773); at a terminal `--yes` or the owner's answer does. */
const askOwner =
  (command: Command): Asker =>
  async (key) => {
    const environment = environmentOf(command)
    if (environment.agent) return
    const given = command.optsWithGlobals<{ yes?: boolean; json?: boolean; jsonl?: boolean }>()
    if (given.yes) return
    const answer = given.json || given.jsonl ? null : ((await environment.answer?.(`Allow ${key}?`)) ?? null)
    if (answer === null)
      throw new CliError(
        "confirmation_required",
        `${key} asks before it acts (its permission level is ask), and nobody is at a terminal to answer — ` +
          "add --yes to go ahead",
        { permission: key },
      )
    if (!/^\s*y(es)?\s*$/i.test(answer)) throw new CliError("cancelled", `${key}: not done — the answer was no`)
  }

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
  const unknown = unknownPermissionIssues(command, settings, IDENTITY.command, permissions)
  if (unknown.length > 0)
    throw new CliError("configuration_error", issueMessage(unknown), { permission: unknown[0]?.key })
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

const writeGuard = (command: Command, settings: ReturnType<typeof configuration.resolveSettings>) => {
  const env = environmentOf(command).env ?? process.env
  return sendGuard({
    profile: settings.profile,
    command: IDENTITY.command,
    permissions: settings.permissions,
    permissionSources: settings.permissionSources,
    permissionDefaults: permissions.defaults,
    permissionFix: (_request, key) => `${IDENTITY.command} ${settings.profile} config set permissions.${key} allow`,
    ask: askOwner(command),
    // Google enforces its own quotas; the guard is here for the levels and the journal, not a send limit.
    sendsPerHour: Number.MAX_SAFE_INTEGER,
    journal: new SendJournal(sendsPathFor(IDENTITY, settings.profile, env), {
      service: IDENTITY.command,
      version: IDENTITY.version,
    }),
    recipients: new RecipientList(recipientsPathFor(IDENTITY, settings.profile, env), IDENTITY.command),
    warn: outputFor(command).renderer.warn,
  })
}

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
  const [{ savedSession }, { googleApi }] = await Promise.all([import("../session.js"), import("../google-api.js")])
  const session = savedSession(common)
  const options = {
    fetch: common.fetch ?? globalThis.fetch,
    signal: common.signal,
    scopes: () => session?.saved.tokens.scopes,
    accessToken: async () => {
      if (!session)
        throw new CliError(
          "authentication_error",
          `not signed in to Google; run ${IDENTITY.command} ${common.profile} session start`,
        )
      const { accessToken } = await session.keeper.tokens()
      if (!accessToken) throw new CliError("authentication_error", "Google returned no access token")
      return accessToken
    },
  }
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
  const shown = result === null || typeof result !== "object" || Array.isArray(result) ? { data: result } : result
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
        itemOf({ operation: operationOf(method), request_schema: requestSchema(method) }),
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
