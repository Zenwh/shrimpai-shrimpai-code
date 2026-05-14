import * as ModelsDev from "./models"

/**
 * Built-in Shrimpai provider definition.
 *
 * Injected into the ModelsDev database BEFORE provider mounting decisions
 * are made (see provider.ts state init). This means:
 *   - shrimpai shows up in the model/provider catalog with all models listed
 *   - it is NOT mounted (= not "connected") until the user adds an API key
 *     via auth flow (Settings → Providers → Connect)
 *
 * Do NOT seed this through Config.provider — that would mark the provider
 * as source:"config" and the UI would treat it as already connected.
 */
export const SHRIMPAI_PROVIDER_ID = "shrimpai"

export const SHRIMPAI_BASE_URL = "https://shrimpai.cc/v1"

type ModelDef = {
  name: string
  cost?: { input: number; output: number; cache_read?: number; cache_write?: number }
  limit: { context: number; output: number }
  reasoning?: boolean
  attachment?: boolean
  modalities?: { input?: ("text" | "audio" | "image" | "video" | "pdf")[]; output?: ("text" | "audio" | "image" | "video" | "pdf")[] }
}

const SHRIMPAI_MODELS: Record<string, ModelDef> = {
  // OpenAI
  "gpt-5.1": {
    name: "GPT-5.1",
    cost: { input: 1.25, output: 10 },
    limit: { context: 400000, output: 128000 },
    reasoning: true,
    attachment: true,
    modalities: { input: ["text", "image", "pdf"], output: ["text"] },
  },
  "gpt-4.1": {
    name: "GPT-4.1",
    cost: { input: 2, output: 8 },
    limit: { context: 1047576, output: 32768 },
    attachment: true,
    modalities: { input: ["text", "image"], output: ["text"] },
  },
  "gpt-4.1-mini": {
    name: "GPT-4.1 Mini",
    cost: { input: 0.4, output: 1.6 },
    limit: { context: 1047576, output: 32768 },
    attachment: true,
    modalities: { input: ["text", "image"], output: ["text"] },
  },
  "gpt-4.1-nano": {
    name: "GPT-4.1 Nano",
    cost: { input: 0.1, output: 0.4 },
    limit: { context: 1047576, output: 32768 },
    modalities: { input: ["text"], output: ["text"] },
  },
  "gpt-4o": {
    name: "GPT-4o",
    cost: { input: 2.5, output: 10 },
    limit: { context: 128000, output: 16384 },
    attachment: true,
    modalities: { input: ["text", "image"], output: ["text"] },
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    cost: { input: 0.15, output: 0.6 },
    limit: { context: 128000, output: 16384 },
    attachment: true,
    modalities: { input: ["text", "image"], output: ["text"] },
  },
  "o3": {
    name: "o3",
    cost: { input: 2, output: 8 },
    limit: { context: 200000, output: 100000 },
    reasoning: true,
    modalities: { input: ["text"], output: ["text"] },
  },
  "o3-mini": {
    name: "o3-mini",
    cost: { input: 1.1, output: 4.4 },
    limit: { context: 200000, output: 100000 },
    reasoning: true,
    modalities: { input: ["text"], output: ["text"] },
  },

  // Anthropic
  "claude-opus-4-7": {
    name: "Claude Opus 4.7",
    cost: { input: 15, output: 75, cache_read: 1.5, cache_write: 18.75 },
    limit: { context: 200000, output: 32000 },
    reasoning: true,
    attachment: true,
    modalities: { input: ["text", "image", "pdf"], output: ["text"] },
  },
  "claude-sonnet-4-6": {
    name: "Claude Sonnet 4.6",
    cost: { input: 3, output: 15, cache_read: 0.3, cache_write: 3.75 },
    limit: { context: 200000, output: 64000 },
    reasoning: true,
    attachment: true,
    modalities: { input: ["text", "image", "pdf"], output: ["text"] },
  },
  "claude-haiku-4-5": {
    name: "Claude Haiku 4.5",
    cost: { input: 1, output: 5, cache_read: 0.1, cache_write: 1.25 },
    limit: { context: 200000, output: 16000 },
    attachment: true,
    modalities: { input: ["text", "image"], output: ["text"] },
  },

  // Moonshot KIMI
  "kimi-k2-turbo-preview": {
    name: "KIMI K2 Turbo",
    cost: { input: 1.1, output: 4.4 },
    limit: { context: 256000, output: 16000 },
    attachment: true,
    modalities: { input: ["text", "image"], output: ["text"] },
  },
  "kimi-k2-0905-preview": {
    name: "KIMI K2",
    cost: { input: 0.6, output: 2.5 },
    limit: { context: 256000, output: 16000 },
    modalities: { input: ["text"], output: ["text"] },
  },
  "moonshot-v1-128k": {
    name: "Moonshot v1 128k",
    cost: { input: 1.7, output: 1.7 },
    limit: { context: 128000, output: 4096 },
    modalities: { input: ["text"], output: ["text"] },
  },

  // Zhipu GLM
  "glm-4.6": {
    name: "GLM-4.6",
    cost: { input: 0.6, output: 2.2 },
    limit: { context: 200000, output: 96000 },
    reasoning: true,
    attachment: true,
    modalities: { input: ["text", "image"], output: ["text"] },
  },
  "glm-4.5": {
    name: "GLM-4.5",
    cost: { input: 0.6, output: 2.2 },
    limit: { context: 128000, output: 96000 },
    reasoning: true,
    attachment: true,
    modalities: { input: ["text", "image"], output: ["text"] },
  },
  "glm-4.5-air": {
    name: "GLM-4.5 Air",
    cost: { input: 0.2, output: 1.1 },
    limit: { context: 128000, output: 96000 },
    modalities: { input: ["text"], output: ["text"] },
  },
  "glm-4.5v": {
    name: "GLM-4.5V (Vision)",
    cost: { input: 0.6, output: 1.8 },
    limit: { context: 64000, output: 16000 },
    attachment: true,
    modalities: { input: ["text", "image", "video"], output: ["text"] },
  },
}

function buildModel(id: string, def: ModelDef): ModelsDev.Model {
  return {
    id,
    name: def.name,
    release_date: "2026-01-01",
    attachment: def.attachment ?? false,
    reasoning: def.reasoning ?? false,
    temperature: !def.reasoning,
    tool_call: true,
    ...(def.cost ? { cost: { input: def.cost.input, output: def.cost.output, cache_read: def.cost.cache_read, cache_write: def.cost.cache_write } } : {}),
    limit: { context: def.limit.context, output: def.limit.output },
    ...(def.modalities
      ? {
          modalities: {
            input: def.modalities.input ?? ["text"],
            output: def.modalities.output ?? ["text"],
          },
        }
      : {}),
  } as ModelsDev.Model
}

/**
 * The shrimpai entry that gets merged into the ModelsDev database at
 * provider state init. env=["SHRIMPAI_API_KEY"] gives users an env-var
 * escape hatch; the primary flow is auth (api key entered through UI).
 */
export function getShrimpaiModelsDevProvider(): ModelsDev.Provider {
  return {
    id: SHRIMPAI_PROVIDER_ID,
    name: "Shrimpai",
    api: SHRIMPAI_BASE_URL,
    npm: "@ai-sdk/openai-compatible",
    env: ["SHRIMPAI_API_KEY"],
    models: Object.fromEntries(
      Object.entries(SHRIMPAI_MODELS).map(([id, def]) => [id, buildModel(id, def)]),
    ),
  }
}
