import { CliError } from "@wirecat/cli-base"
import { statusToCode } from "@wirecat/cli-base/http"

interface GoogleErrorBody {
  error?: {
    status?: string
    errors?: { reason?: string }[]
    details?: { "@type"?: string; reason?: string }[]
  }
}

const reasonsOf = (body: unknown): string[] => {
  const error = (body as GoogleErrorBody | undefined)?.error
  if (!error || typeof error !== "object") return []
  return [
    ...(Array.isArray(error.errors) ? error.errors.map((item) => item?.reason) : []),
    ...(Array.isArray(error.details)
      ? error.details
          .filter((detail) => detail?.["@type"] === "type.googleapis.com/google.rpc.ErrorInfo")
          .map((detail) => detail.reason)
      : []),
    error.status,
  ].filter((reason): reason is string => typeof reason === "string")
}

const RATE = new Set(["rateLimitExceeded", "userRateLimitExceeded", "quotaExceeded", "RESOURCE_EXHAUSTED"])

export interface GoogleFailure {
  status: number
  body: unknown
  mutates: boolean
  retryAfterMs?: number | undefined
}

/**
 * A Google Calendar refusal as a CliError. Google's own message is never repeated: it can quote the ids and text
 * that were asked for (WC-SECR-6).
 */
export const googleError = ({ status, body, mutates, retryAfterMs }: GoogleFailure): CliError => {
  const reasons = reasonsOf(body)
  const wait = retryAfterMs === undefined ? {} : { retry_after_ms: retryAfterMs }
  if (status === 401)
    return new CliError("authentication_error", "Google sign-in expired", {
      reason: "sign-in.expired",
      status,
    })
  if (reasons.some((reason) => reason === "accessNotConfigured" || reason === "SERVICE_DISABLED"))
    return new CliError(
      "configuration_error",
      "the Google Calendar API is turned off for this OAuth project; its owner turns it on in Google Cloud API Library",
      { reason: "api.disabled", status },
    )
  if (reasons.some((reason) => reason === "insufficientPermissions" || reason === "ACCESS_TOKEN_SCOPE_INSUFFICIENT"))
    return new CliError("permission_error", "the sign-in lacks the Google permission this method needs", {
      reason: "api.scope-missing",
      status,
    })
  if (status === 429 || reasons.some((reason) => RATE.has(reason)))
    // Google turned the request away before acting on it, so even a write is safe to send again.
    return new CliError("rate_limited", "Google rate limit reached; retry the command", {
      retryable: true,
      status,
      ...wait,
    })
  if (status >= 500)
    return mutates
      ? new CliError("outcome_unknown", "Google write has no certain outcome; check Google before repeating it", {
          retryable: false,
          status,
        })
      : new CliError(statusToCode(status), `Google Calendar failed (HTTP ${status}); retry the command`, {
          retryable: true,
          status,
          ...wait,
        })
  if (status === 403)
    return new CliError("permission_error", "Google denied this operation; check access to the calendar", {
      reason: "google.denied",
      status,
    })
  if (status === 404)
    return new CliError("not_found", "Google Calendar has no such item, or this account cannot see it", {
      reason: "google.not-found",
      status,
    })
  return new CliError(statusToCode(status), `Google Calendar refused the request (HTTP ${status})`, { status })
}
