import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.union([z.string(), z.array(z.record(z.unknown()))]),
  name: z.string().optional(),
});

export const chatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(chatMessageSchema),
  stream: z.boolean().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
});

export type ChatCompletionRequest = z.infer<typeof chatCompletionRequestSchema>;

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: "assistant"; content: string };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface ProviderAdapter {
  readonly id: string;
  readonly family: string;
  chatCompletion(
    request: ChatCompletionRequest,
    deployment: ModelDeployment,
  ): Promise<ChatCompletionResponse>;
  streamChat?(
    request: ChatCompletionRequest,
    deployment: ModelDeployment,
  ): AsyncIterable<string>;
  estimateCost?(usage: { prompt_tokens: number; completion_tokens: number }, model: string): number;
}

export interface ModelDeployment {
  providerId: string;
  modelId: string;
  baseUrl?: string;
  apiKeyEnv?: string;
  tags?: string[];
}

export interface ModelRegistryEntry {
  alias: string;
  deployments: ModelDeployment[];
  capabilities: string[];
}

export interface VirtualKey {
  id: string;
  name: string;
  token: string;
  budgetUsd?: number;
  spentUsd: number;
  allowedModels?: string[];
  rpm?: number;
  metadata?: Record<string, string>;
}

export interface RouteDecision {
  deployment: ModelDeployment;
  provider: ProviderAdapter;
  alias: string;
}

export interface FallbackChain {
  alias: string;
  targets: string[];
}
