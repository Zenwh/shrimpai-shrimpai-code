import { describe, expect, test } from "bun:test"
import { validateCustomProvider } from "./dialog-custom-provider-form"

const t = (key: string) => key

describe("validateCustomProvider", () => {
  test("openai protocol row -> bare model entry, no provider.npm override", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "custom-provider",
        name: " Custom Provider ",
        baseURL: "https://api.example.com ",
        apiKey: " {env: CUSTOM_PROVIDER_KEY} ",
        models: [{ row: "m0", id: " model-a ", name: " Model A ", protocol: "openai", err: {} }],
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
          headers: { "X-Test": "enabled" },
        },
        models: {
          "model-a": { name: "Model A" },
        },
      },
    })
  })

  test("anthropic protocol row stamps provider.npm so the SDK picks /messages", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "stepcode",
        name: "Stepcode",
        baseURL: "https://stepcode.basemind.com/v1",
        apiKey: "sk-xxx",
        models: [
          { row: "m0", id: "gpt-5.5-qianli", name: "GPT 5.5", protocol: "openai", err: {} },
          {
            row: "m1",
            id: "claude-opus-4-7-qianli",
            name: "Claude Opus 4.7",
            protocol: "anthropic",
            err: {},
          },
        ],
        headers: [{ row: "h0", key: "", value: "", err: {} }],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })

    expect(result.result?.config.models).toEqual({
      "gpt-5.5-qianli": { name: "GPT 5.5" },
      "claude-opus-4-7-qianli": {
        name: "Claude Opus 4.7",
        provider: { npm: "@ai-sdk/anthropic" },
      },
    } as any)
    expect(result.result?.config.npm).toBe("@ai-sdk/openai-compatible")
  })

  test("flags duplicate rows and allows reconnecting disabled providers", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "custom-provider",
        name: "Provider",
        baseURL: "https://api.example.com",
        apiKey: "secret",
        models: [
          { row: "m0", id: "model-a", name: "Model A", protocol: "openai", err: {} },
          { row: "m1", id: "model-a", name: "Model A 2", protocol: "openai", err: {} },
        ],
        headers: [
          { row: "h0", key: "Authorization", value: "one", err: {} },
          { row: "h1", key: "authorization", value: "two", err: {} },
        ],
        err: {},
      },
      t,
      disabledProviders: ["custom-provider"],
      existingProviderIDs: new Set(["custom-provider"]),
    })

    expect(result.result).toBeUndefined()
    expect(result.err.providerID).toBeUndefined()
    expect(result.models[1]).toEqual({
      id: "provider.custom.error.duplicate",
      name: undefined,
    })
    expect(result.headers[1]).toEqual({
      key: "provider.custom.error.duplicate",
      value: undefined,
    })
  })
})
