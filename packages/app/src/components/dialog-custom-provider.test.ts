import { describe, expect, test } from "bun:test"
import { detectModels, validateCustomProvider } from "./dialog-custom-provider-form"

const t = (key: string) => key

const baseForm = (overrides: Partial<Parameters<typeof validateCustomProvider>[0]["form"]>) => ({
  providerID: "p",
  name: "P",
  baseURL: "https://api.example.com",
  apiKey: "k",
  detected: [],
  filter: "",
  detectStatus: "idle" as const,
  detectError: undefined,
  headers: [{ row: "h0", key: "", value: "", err: {} }],
  err: {},
  ...overrides,
})

describe("validateCustomProvider", () => {
  test("openai-compatible model has no per-model provider override", () => {
    const result = validateCustomProvider({
      form: baseForm({
        providerID: "stepcode",
        name: "Stepcode",
        baseURL: "https://stepcode.basemind.com/v1",
        apiKey: "sk-xxx",
        detected: [
          { id: "gpt-5.5-qianli", selected: true, npm: "@ai-sdk/openai-compatible" },
          { id: "claude-opus-4-7-qianli", selected: true, npm: "@ai-sdk/anthropic", note: "Anthropic protocol" },
        ],
        detectStatus: "ok",
      }),
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })
    expect(result.result?.config.models).toEqual({
      "gpt-5.5-qianli": { name: "gpt-5.5-qianli" },
      "claude-opus-4-7-qianli": {
        name: "claude-opus-4-7-qianli",
        provider: { npm: "@ai-sdk/anthropic" },
      },
    })
    // provider-level npm stays openai-compatible
    expect(result.result?.config.npm).toBe("@ai-sdk/openai-compatible")
  })

  test("trims whitespace and supports {env:VAR} key form", () => {
    const result = validateCustomProvider({
      form: baseForm({
        providerID: "custom-provider",
        name: " Custom ",
        baseURL: "https://api.example.com ",
        apiKey: " {env: CUSTOM_KEY} ",
        detected: [{ id: "model-a", selected: true, npm: "@ai-sdk/openai-compatible" }],
        detectStatus: "ok",
        headers: [
          { row: "h0", key: " X-Test ", value: " enabled ", err: {} },
          { row: "h1", key: "", value: "", err: {} },
        ],
      }),
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })
    expect(result.result?.key).toBeUndefined()
    expect(result.result?.config.env).toEqual(["CUSTOM_KEY"])
    expect(result.result?.config.options).toEqual({
      baseURL: "https://api.example.com",
      headers: { "X-Test": "enabled" },
    })
  })

  test("rejects when detection not run", () => {
    const result = validateCustomProvider({
      form: baseForm({}),
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })
    expect(result.result).toBeUndefined()
    expect(result.err.detected).toBe("provider.custom.error.detect.required")
  })

  test("rejects when no model selected", () => {
    const result = validateCustomProvider({
      form: baseForm({
        detected: [{ id: "model-a", selected: false, npm: "@ai-sdk/openai-compatible" }],
        detectStatus: "ok",
      }),
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })
    expect(result.result).toBeUndefined()
    expect(result.err.detected).toBe("provider.custom.error.detect.noneSelected")
  })
})

describe("detectModels", () => {
  test("defaults to openai-compatible when no support_apis hint", async () => {
    const fetchMock = () =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [{ id: "gpt-4o" }, { id: "gpt-4o-mini" }] }), { status: 200 }),
      )
    const original = globalThis.fetch
    globalThis.fetch = fetchMock as any
    try {
      const result = await detectModels({ baseURL: "https://api.example.com/v1", apiKey: "k", headers: {} })
      if (!result.ok) throw new Error(result.error)
      expect(result.models).toEqual([
        { id: "gpt-4o", selected: false, npm: "@ai-sdk/openai-compatible", note: undefined },
        { id: "gpt-4o-mini", selected: false, npm: "@ai-sdk/openai-compatible", note: undefined },
      ])
    } finally {
      globalThis.fetch = original
    }
  })

  test("routes claude_native to @ai-sdk/anthropic and chat to openai-compatible", async () => {
    const fetchMock = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              { id: "gpt-5.5-qianli", support_apis: [{ id: "chat" }] },
              { id: "claude-opus-4-7-qianli", support_apis: [{ id: "claude_native" }] },
              { id: "kimi-k2.6-qianli", support_apis: [{ id: "chat" }, { id: "claude_native" }] },
            ],
          }),
          { status: 200 },
        ),
      )
    const original = globalThis.fetch
    globalThis.fetch = fetchMock as any
    try {
      const result = await detectModels({ baseURL: "https://stepcode.basemind.com/v1", apiKey: "k", headers: {} })
      if (!result.ok) throw new Error(result.error)
      const byId = Object.fromEntries(result.models.map((m) => [m.id, m]))
      expect(byId["gpt-5.5-qianli"].npm).toBe("@ai-sdk/openai-compatible")
      expect(byId["claude-opus-4-7-qianli"].npm).toBe("@ai-sdk/anthropic")
      expect(byId["claude-opus-4-7-qianli"].note).toBe("Anthropic protocol")
      // Both protocols supported → prefer openai-compatible for tooling uniformity
      expect(byId["kimi-k2.6-qianli"].npm).toBe("@ai-sdk/openai-compatible")
      // Nothing pre-selected
      expect(result.models.every((m) => m.selected === false)).toBe(true)
    } finally {
      globalThis.fetch = original
    }
  })

  test("returns error on non-2xx", async () => {
    const fetchMock = () => Promise.resolve(new Response("nope", { status: 401, statusText: "Unauthorized" }))
    const original = globalThis.fetch
    globalThis.fetch = fetchMock as any
    try {
      const result = await detectModels({ baseURL: "https://api.example.com/v1", apiKey: "bad", headers: {} })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain("401")
    } finally {
      globalThis.fetch = original
    }
  })
})
