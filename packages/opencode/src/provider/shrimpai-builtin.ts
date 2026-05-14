/**
 * Built-in Shrimpai provider definition.
 * Merged into Config.provider before user config loads, so users can override
 * baseURL / models / etc. without us pre-seeding their opencode.json on disk.
 *
 * The shape matches ConfigProvider.Info from packages/opencode/src/config/provider.ts.
 *
 * Wire-up: see packages/opencode/src/config/config.ts → loadInstanceState (initial merge).
 */
export const SHRIMPAI_PROVIDER_ID = "shrimpai"

export const SHRIMPAI_BASE_URL = "https://shrimpai.cc/v1"

type ModelDef = {
  name: string
  // Anthropic / OpenAI both bill ~per million-token. Use $/Mtok throughout.
  cost?: { input: number; output: number; cache_read?: number; cache_write?: number }
  limit?: { context: number; output: number }
  reasoning?: boolean
  attachment?: boolean
  modalities?: { input?: string[]; output?: string[] }
}

/**
 * Curated list of models we promise to expose on shrimpai.cc/v1.
 * - Identifiers MUST match what New API exposes (channel models field).
 * - Marketing names live in the desktop UI; these are the wire IDs.
 * - Costs are user-facing display only; real billing is on the gateway side.
 */
export const SHRIMPAI_MODELS: Record<string, ModelDef> = {
  // OpenAI flagship — verified present in New API (channel id=6)
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

  // Anthropic — pending gateway channel (Phase 2-1). Listed so the UI shows them.
  // Wire IDs MUST match Anthropic naming; New API channel will resolve them.
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

  // Moonshot KIMI — wire IDs match official Moonshot API
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

  // ZhipuAI GLM — wire IDs match official Zhipu open.bigmodel.cn naming
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

/**
 * Returns a ConfigProvider.Info-shaped object suitable for merging into Config.provider.
 * Generated lazily (don't reference Effect/Schema here — this is a plain data layer).
 */
export function getShrimpaiProviderDefinition() {
  return {
    name: "Shrimpai",
    npm: "@ai-sdk/openai-compatible",
    api: SHRIMPAI_BASE_URL,
    options: {
      baseURL: SHRIMPAI_BASE_URL,
    },
    models: Object.fromEntries(
      Object.entries(SHRIMPAI_MODELS).map(([id, def]) => [
        id,
        {
          name: def.name,
          ...(def.cost ? { cost: def.cost } : {}),
          ...(def.limit ? { limit: def.limit } : {}),
          ...(def.reasoning ? { reasoning: def.reasoning } : {}),
          ...(def.attachment ? { attachment: def.attachment } : {}),
          ...(def.modalities ? { modalities: def.modalities } : {}),
        },
      ]),
    ),
  }
}
