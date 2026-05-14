import { describe, expect, test } from "bun:test"
import { detectModels, validateCustomProvider } from "./dialog-custom-provider-form"

const t = (key: string) => key

describe("validateCustomProvider", () => {
  test("builds payload from detected+selected models, trimming whitespace", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "custom-provider",
        name: " Custom Provider ",
        baseURL: "https://api.example.com ",
        apiKey: " {env: CUSTOM_PROVIDER_KEY} ",
        detected: [
          { id: "model-a", selected: true, chatSupported: true },
          { id: "model-b", selected: false, chatSupported: true },
          { id: "model-c-anthropic", selected: true, chatSupported: false, reason: "Anthropic-only" },
        ],
        detectStatus: "ok",
        detectError: undefined,
        headers: [
          { row: "h0", key: " X-Test ", value: " enabled ", err: {} },
          { row: "h1", key: "", value: "", err: {} },
        ],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })

    // chat-unsupported models are dropped even if selected
    expect(result.result).toEqual({
      providerID: "custom-provider",
      name: "Custom Provider",
      key: undefined,
      config: {
        npm: "@ai-sdk/openai-compatible",
        name: "Custom Provider",
        env: ["CUSTOM_PROVIDER_KEY"],
        options: {
          baseURL: "https://api.example.com",
          headers: {
            "X-Test": "enabled",
          },
        },
        models: {
          "model-a": { name: "model-a" },
        },
      },
    })
  })

  test("rejects when no models detected yet", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "p",
        name: "P",
        baseURL: "https://api.example.com",
        apiKey: "k",
        detected: [],
        detectStatus: "idle",
        detectError: undefined,
        headers: [{ row: "h0", key: "", value: "", err: {} }],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })
    expect(result.result).toBeUndefined()
    expect(result.err.detected).toBe("provider.custom.error.detect.required")
  })

  test("rejects when detection succeeded but nothing selected", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "p",
        name: "P",
        baseURL: "https://api.example.com",
        apiKey: "k",
        detected: [{ id: "model-a", selected: false, chatSupported: true }],
        detectStatus: "ok",
        detectError: undefined,
        headers: [{ row: "h0", key: "", value: "", err: {} }],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })
    expect(result.result).toBeUndefined()
    expect(result.err.detected).toBe("provider.custom.error.detect.noneSelected")
  })
})

describe("detectModels", () => {
  test("parses OpenAI-style response and marks all chatSupported by default", async () => {
    const fetchMock = (..._: any[]) =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              { id: "gpt-4o", object: "model" },
              { id: "gpt-4o-mini", object: "model" },
            ],
          }),
          { status: 200 },
        ),
      )
    const original = globalThis.fetch
    globalThis.fetch = fetchMock as any
    try {
      const result = await detectModels({
        baseURL: "https://api.example.com/v1",
        apiKey: "sk-test",
        headers: {},
      })
      if (!result.ok) throw new Error(result.error)
      expect(result.models.length).toBe(2)
      expect(result.models.every((m) => m.chatSupported)).toBe(true)
      expect(result.models.every((m) => m.selected)).toBe(true)
    } finally {
      globalThis.fetch = original
    }
  })

  test("flags Anthropic-only models as not chat-supported", async () => {
    const fetchMock = (..._: any[]) =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              { id: "gpt-5.5-qianli", support_apis: [{ id: "chat" }] },
              { id: "claude-opus-4-7-qianli", support_apis: [{ id: "claude_native" }] },
            ],
          }),
          { status: 200 },
        ),
      )
    const original = globalThis.fetch
    globalThis.fetch = fetchMock as any
    try {
      const result = await detectModels({
        baseURL: "https://stepcode.basemind.com/v1",
        apiKey: "sk-test",
        headers: {},
      })
      if (!result.ok) throw new Error(result.error)
      const byId = Object.fromEntries(result.models.map((m) => [m.id, m]))
      expect(byId["gpt-5.5-qianli"].chatSupported).toBe(true)
      expect(byId["gpt-5.5-qianli"].selected).toBe(true)
      expect(byId["claude-opus-4-7-qianli"].chatSupported).toBe(false)
      expect(byId["claude-opus-4-7-qianli"].selected).toBe(false)
      expect(byId["claude-opus-4-7-qianli"].reason).toContain("Anthropic")
    } finally {
      globalThis.fetch = original
    }
  })

  test("returns error on non-2xx", async () => {
    const fetchMock = () => Promise.resolve(new Response("nope", { status: 401, statusText: "Unauthorized" }))
    const original = globalThis.fetch
    globalThis.fetch = fetchMock as any
    try {
      const result = await detectModels({
        baseURL: "https://api.example.com/v1",
        apiKey: "bad",
        headers: {},
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain("401")
    } finally {
      globalThis.fetch = original
    }
  })
})
