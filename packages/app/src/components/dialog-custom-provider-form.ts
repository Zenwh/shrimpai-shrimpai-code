const PROVIDER_ID = /^[a-z0-9][a-z0-9-_]*$/
const OPENAI_COMPATIBLE = "@ai-sdk/openai-compatible"
const ANTHROPIC = "@ai-sdk/anthropic"

type Translator = (key: string, vars?: Record<string, string | number | boolean>) => string

export type HeaderErr = {
  key?: string
  value?: string
}

export type HeaderRow = {
  row: string
  key: string
  value: string
  err: HeaderErr
}

/**
 * One model returned by the upstream `/v1/models` endpoint.
 *
 * `npm` is the AI SDK package OpenCode will use at request time:
 *   - "@ai-sdk/openai-compatible" routes to `<base>/chat/completions`
 *   - "@ai-sdk/anthropic" routes to `<base>/messages`
 *
 * Inferred from the response shape (typically a `support_apis` array on
 * distributor APIs like stepcode.basemind.com). When the upstream doesn't
 * advertise capabilities we default to openai-compatible — the broadest
 * common denominator for a `/v1/models` endpoint.
 */
export type DetectedModel = {
  id: string
  selected: boolean
  npm: string
  note?: string
}

export type FormState = {
  providerID: string
  name: string
  baseURL: string
  apiKey: string
  detected: DetectedModel[]
  filter: string
  detectStatus: "idle" | "loading" | "ok" | "error"
  detectError?: string
  headers: HeaderRow[]
  err: {
    providerID?: string
    name?: string
    baseURL?: string
    detected?: string
  }
}

type ValidateArgs = {
  form: FormState
  t: Translator
  disabledProviders: string[]
  existingProviderIDs: Set<string>
}

export function validateCustomProvider(input: ValidateArgs) {
  const providerID = input.form.providerID.trim()
  const name = input.form.name.trim()
  const baseURL = input.form.baseURL.trim()
  const apiKey = input.form.apiKey.trim()

  const env = apiKey.match(/^\{env:([^}]+)\}$/)?.[1]?.trim()
  const key = apiKey && !env ? apiKey : undefined

  const idError = !providerID
    ? input.t("provider.custom.error.providerID.required")
    : !PROVIDER_ID.test(providerID)
      ? input.t("provider.custom.error.providerID.format")
      : undefined

  const nameError = !name ? input.t("provider.custom.error.name.required") : undefined
  const urlError = !baseURL
    ? input.t("provider.custom.error.baseURL.required")
    : !/^https?:\/\//.test(baseURL)
      ? input.t("provider.custom.error.baseURL.format")
      : undefined

  const disabled = input.disabledProviders.includes(providerID)
  const existsError = idError
    ? undefined
    : input.existingProviderIDs.has(providerID) && !disabled
      ? input.t("provider.custom.error.providerID.exists")
      : undefined

  const selectedModels = input.form.detected.filter((m) => m.selected)
  const detectedError =
    input.form.detectStatus !== "ok"
      ? input.t("provider.custom.error.detect.required")
      : selectedModels.length === 0
        ? input.t("provider.custom.error.detect.noneSelected")
        : undefined

  // Per-model `provider.npm` override lets the SDK selection happen at request
  // time without us touching protocol bodies. Only emit it when the model
  // deviates from the provider-level default (openai-compatible).
  const modelConfig = Object.fromEntries(
    selectedModels.map((m) => [
      m.id,
      m.npm === OPENAI_COMPATIBLE ? { name: m.id } : { name: m.id, provider: { npm: m.npm } },
    ]),
  )

  const seenHeaders = new Set<string>()
  const headers = input.form.headers.map((h) => {
    const key = h.key.trim()
    const value = h.value.trim()

    if (!key && !value) return {}
    const keyError = !key
      ? input.t("provider.custom.error.required")
      : seenHeaders.has(key.toLowerCase())
        ? input.t("provider.custom.error.duplicate")
        : (() => {
            seenHeaders.add(key.toLowerCase())
            return undefined
          })()
    const valueError = !value ? input.t("provider.custom.error.required") : undefined
    return { key: keyError, value: valueError }
  })
  const headersValid = headers.every((h) => !h.key && !h.value)
  const headerConfig = Object.fromEntries(
    input.form.headers
      .map((h) => ({ key: h.key.trim(), value: h.value.trim() }))
      .filter((h) => !!h.key && !!h.value)
      .map((h) => [h.key, h.value]),
  )

  const err = {
    providerID: idError ?? existsError,
    name: nameError,
    baseURL: urlError,
    detected: detectedError,
  }

  const ok = !idError && !existsError && !nameError && !urlError && !detectedError && headersValid
  if (!ok) return { err, headers }

  return {
    err,
    headers,
    result: {
      providerID,
      name,
      key,
      config: {
        npm: OPENAI_COMPATIBLE,
        name,
        ...(env ? { env: [env] } : {}),
        options: {
          baseURL,
          ...(Object.keys(headerConfig).length ? { headers: headerConfig } : {}),
        },
        models: modelConfig,
      },
    },
  }
}

let row = 0

const nextRow = () => `row-${row++}`

export const headerRow = (): HeaderRow => ({ row: nextRow(), key: "", value: "", err: {} })

/**
 * Inspect upstream-advertised api capabilities and pick the SDK that handles
 * them. We never convert protocols — at request time OpenCode dispatches via
 * the SDK named here, so the wire format matches the upstream's contract.
 *
 *   chat / completions / responses    → openai-compatible  (`/chat/completions`)
 *   claude_native                     → anthropic          (`/messages`)
 *
 * When the upstream lists both, prefer openai-compatible (it's what most of
 * our other models use, so cache behavior and tool schemas are more uniform).
 * When the upstream gives no capability hint at all, default to
 * openai-compatible — the broadest /v1/models convention.
 */
function inferNpm(apiIds: string[]): { npm: string; note?: string } {
  const hasChat = apiIds.some((id) => id === "chat" || id === "completions" || id === "responses")
  const hasAnthropic = apiIds.includes("claude_native")
  if (hasChat) return { npm: OPENAI_COMPATIBLE }
  if (hasAnthropic) return { npm: ANTHROPIC, note: "Anthropic protocol" }
  return { npm: OPENAI_COMPATIBLE, note: apiIds.length ? `Unknown api: ${apiIds.join(", ")}` : undefined }
}

/**
 * Probe `<baseURL>/models` and return what the server advertises.
 *
 * Standard OpenAI servers return `{data: [{id, ...}]}` with no protocol hint
 * — every model is assumed openai-compatible.
 *
 * Distributor APIs (stepcode.basemind.com et al.) include a `support_apis`
 * array per model; we use that to pick the SDK per model so Claude models
 * route through @ai-sdk/anthropic at request time without any conversion.
 *
 * Models are returned in detection order (no auto-selection — the caller
 * shows checkboxes and lets the user opt in).
 */
export async function detectModels(args: {
  baseURL: string
  apiKey: string
  headers: Record<string, string>
  signal?: AbortSignal
}): Promise<{ ok: true; models: DetectedModel[] } | { ok: false; error: string }> {
  const trimmed = args.baseURL.trim().replace(/\/+$/, "")
  if (!trimmed) return { ok: false, error: "Base URL is empty" }
  if (!/^https?:\/\//.test(trimmed)) return { ok: false, error: "Base URL must start with http:// or https://" }
  const url = `${trimmed}/models`
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...args.headers,
  }
  if (args.apiKey && !/^\{env:.+\}$/.test(args.apiKey)) {
    headers.Authorization = `Bearer ${args.apiKey}`
  }
  let res: Response
  try {
    res = await fetch(url, { method: "GET", headers, signal: args.signal })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  if (!res.ok) {
    let body = ""
    try {
      body = (await res.text()).slice(0, 200)
    } catch {}
    return { ok: false, error: `${res.status} ${res.statusText}${body ? ` — ${body}` : ""}` }
  }
  let json: unknown
  try {
    json = await res.json()
  } catch {
    return { ok: false, error: "Response was not valid JSON" }
  }
  if (!json || typeof json !== "object" || !("data" in json) || !Array.isArray((json as any).data)) {
    return { ok: false, error: "Unexpected response shape; expected {data: [...]}" }
  }
  const items = (json as { data: any[] }).data
  const models: DetectedModel[] = items
    .filter((it) => it && typeof it.id === "string")
    .map((it) => {
      const supportApis: unknown = it.support_apis
      const apiIds = Array.isArray(supportApis)
        ? supportApis
            .map((a: any) => (typeof a === "string" ? a : a?.id))
            .filter((s): s is string => typeof s === "string")
        : []
      const { npm, note } = inferNpm(apiIds)
      return { id: it.id, selected: false, npm, note }
    })
  return { ok: true, models }
}

