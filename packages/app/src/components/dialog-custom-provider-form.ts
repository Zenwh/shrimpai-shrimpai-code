const PROVIDER_ID = /^[a-z0-9][a-z0-9-_]*$/
const OPENAI_COMPATIBLE = "@ai-sdk/openai-compatible"

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
 * `chatSupported` distinguishes models we can actually drive through
 * @ai-sdk/openai-compatible (chat completions) from things like
 * Anthropic-only or embedding-only models.
 */
export type DetectedModel = {
  id: string
  selected: boolean
  chatSupported: boolean
  reason?: string
}

export type FormState = {
  providerID: string
  name: string
  baseURL: string
  apiKey: string
  detected: DetectedModel[]
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

  const selectedModels = input.form.detected.filter((m) => m.selected && m.chatSupported)
  const detectedError =
    input.form.detectStatus !== "ok"
      ? input.t("provider.custom.error.detect.required")
      : selectedModels.length === 0
        ? input.t("provider.custom.error.detect.noneSelected")
        : undefined

  const modelConfig = Object.fromEntries(selectedModels.map((m) => [m.id, { name: m.id }]))

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
 * Probe `<baseURL>/models` and return what's available.
 *
 * - Standard OpenAI servers return `{data: [{id, ...}]}` — every model is
 *   chat-compatible by convention (we may downgrade some by id heuristics).
 * - Some distributors include a `support_apis` array; if present, we only
 *   mark a model as chat-compatible when it advertises `chat`. Examples seen
 *   in the wild: stepcode.basemind.com tags Anthropic-only models without
 *   `chat`, which would fail here without this filter.
 *
 * Returns DetectedModel[] sorted: chat-supported (+selected) first.
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
      let chatSupported = true
      let reason: string | undefined
      if (Array.isArray(supportApis)) {
        const ids = supportApis
          .map((a: any) => (typeof a === "string" ? a : a?.id))
          .filter((s): s is string => typeof s === "string")
        if (ids.length > 0) {
          chatSupported = ids.includes("chat") || ids.includes("completions")
          if (!chatSupported) {
            const human = ids.includes("claude_native")
              ? "Anthropic-only (use Anthropic protocol)"
              : `Only ${ids.join(", ")} supported`
            reason = human
          }
        }
      }
      return { id: it.id, selected: chatSupported, chatSupported, reason }
    })
  models.sort((a, b) => {
    if (a.chatSupported !== b.chatSupported) return a.chatSupported ? -1 : 1
    return a.id.localeCompare(b.id)
  })
  return { ok: true, models }
}
