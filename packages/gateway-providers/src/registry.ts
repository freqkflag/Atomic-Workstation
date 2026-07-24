import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createCohere } from "@ai-sdk/cohere";
import { createXai } from "@ai-sdk/xai";
import { createPerplexity } from "@ai-sdk/perplexity";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { createFireworks } from "@ai-sdk/fireworks";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ProviderAdapter } from "@atomic/gateway-core";
import { createAiSdkProvider } from "./create-adapter.js";

export const WAVE1_PROVIDER_IDS = [
  "openai",
  "anthropic",
  "xai",
  "perplexity",
  "cohere",
  "groq",
  "mistral",
  "together",
  "fireworks",
  "deepseek",
  "openrouter",
  "ollama",
] as const;

export const WAVE2_PROVIDER_IDS = [
  "google",
  "vertex",
  "azure",
  "bedrock",
  "huggingface",
  "replicate",
  "cloudflare",
  "github-models",
  "snowflake",
  "databricks",
  "watsonx",
  "nvidia-nim",
  "aleph-alpha",
  "modal",
  "baseten",
] as const;

export function createWave1Providers(): ProviderAdapter[] {
  return [
    createAiSdkProvider("openai", "openai", (d) => ({
      model: createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(d.modelId),
    })),
    createAiSdkProvider("anthropic", "anthropic", (d) => ({
      model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(d.modelId),
    })),
    createAiSdkProvider("xai", "xai", (d) => ({
      model: createXai({ apiKey: process.env.XAI_API_KEY })(d.modelId),
    })),
    createAiSdkProvider("perplexity", "perplexity", (d) => ({
      model: createPerplexity({ apiKey: process.env.PERPLEXITY_API_KEY })(d.modelId),
    })),
    createAiSdkProvider("cohere", "cohere", (d) => ({
      model: createCohere({ apiKey: process.env.COHERE_API_KEY })(d.modelId),
    })),
    createAiSdkProvider("groq", "groq", (d) => ({
      model: createGroq({ apiKey: process.env.GROQ_API_KEY })(d.modelId),
    })),
    createAiSdkProvider("mistral", "mistral", (d) => ({
      model: createMistral({ apiKey: process.env.MISTRAL_API_KEY })(d.modelId),
    })),
    createAiSdkProvider("together", "together", (d) => ({
      model: createTogetherAI({ apiKey: process.env.TOGETHER_API_KEY })(d.modelId),
    })),
    createAiSdkProvider("fireworks", "fireworks", (d) => ({
      model: createFireworks({ apiKey: process.env.FIREWORKS_API_KEY })(d.modelId),
    })),
    createAiSdkProvider("deepseek", "deepseek", (d) => ({
      model: createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY })(d.modelId),
    })),
    createAiSdkProvider("openrouter", "openrouter", (d) => ({
      model: createOpenAICompatible({
        name: "openrouter",
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: d.baseUrl ?? "https://openrouter.ai/api/v1",
      })(d.modelId),
    })),
    createAiSdkProvider("ollama", "local", (d) => ({
      model: createOpenAICompatible({
        name: "ollama",
        baseURL: d.baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1",
      })(d.modelId),
    })),
  ];
}

export function createWave2Providers(): ProviderAdapter[] {
  const compatible = (
    id: string,
    family: string,
    baseURL: string,
    apiKeyEnv?: string,
  ) =>
    createAiSdkProvider(id, family, (d) => ({
      model: createOpenAICompatible({
        name: id,
        apiKey: apiKeyEnv ? process.env[apiKeyEnv] : undefined,
        baseURL: d.baseUrl ?? baseURL,
      })(d.modelId),
    }));

  return [
    createAiSdkProvider("google", "google", (d) => ({
      model: createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY })(d.modelId),
    })),
    compatible("vertex", "google", "https://vertex.googleapis.com/v1"),
    compatible("azure", "microsoft", "https://api.openai.azure.com/openai/v1", "AZURE_OPENAI_API_KEY"),
    compatible("bedrock", "amazon", "https://bedrock.amazonaws.com/openai/v1", "AWS_ACCESS_KEY_ID"),
    compatible("huggingface", "cloud-ml", "https://api-inference.huggingface.co/v1", "HUGGINGFACE_API_KEY"),
    compatible("replicate", "cloud-ml", "https://api.replicate.com/v1", "REPLICATE_API_TOKEN"),
    compatible("cloudflare", "other", "https://api.cloudflare.com/client/v4/ai/v1", "CLOUDFLARE_API_KEY"),
    compatible("github-models", "other", "https://models.inference.ai.azure.com", "GITHUB_TOKEN"),
    compatible("snowflake", "enterprise", "https://snowflake.example/v1"),
    compatible("databricks", "enterprise", "https://databricks.example/v1"),
    compatible("watsonx", "enterprise", "https://watsonx.example/v1"),
    compatible("nvidia-nim", "enterprise", "https://nim.example/v1"),
    compatible("aleph-alpha", "enterprise", "https://api.aleph-alpha.com/v1"),
    compatible("modal", "cloud-ml", "https://modal.example/v1"),
    compatible("baseten", "cloud-ml", "https://baseten.example/v1"),
  ];
}

export function createAllProviders(): Map<string, ProviderAdapter> {
  const map = new Map<string, ProviderAdapter>();
  for (const p of [...createWave1Providers(), ...createWave2Providers()]) {
    map.set(p.id, p);
  }
  return map;
}
