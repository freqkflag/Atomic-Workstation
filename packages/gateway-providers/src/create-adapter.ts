import { generateText } from "ai";
import type { ProviderAdapter, ChatCompletionRequest, ChatCompletionResponse, ModelDeployment } from "@atomic/gateway-core";
import { chatViaOpenAiSdk } from "@atomic/gateway-core";

export type ProviderFactory = (
  deployment: ModelDeployment,
) => { model: Parameters<typeof generateText>[0]["model"]; estimateCost?: ProviderAdapter["estimateCost"] };

function createAiSdkProvider(
  id: string,
  family: string,
  factory: ProviderFactory,
): ProviderAdapter {
  return {
    id,
    family,
    async chatCompletion(
      request: ChatCompletionRequest,
      deployment: ModelDeployment,
    ): Promise<ChatCompletionResponse> {
      const apiKey = deployment.apiKeyEnv
        ? process.env[deployment.apiKeyEnv]
        : process.env[`${id.toUpperCase()}_API_KEY`];

      if (id === "openai" || id === "ollama") {
        return chatViaOpenAiSdk(request, deployment, apiKey);
      }

      if (!apiKey && !deployment.baseUrl) {
        return chatViaOpenAiSdk(request, deployment, undefined);
      }

      const { model } = factory(deployment);
      const messages = request.messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));

      const result = await generateText({
        model,
        messages,
        temperature: request.temperature,
        maxTokens: request.max_tokens,
      });

      return {
        id: `chatcmpl-${crypto.randomUUID()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: result.text },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: result.usage?.promptTokens ?? 0,
          completion_tokens: result.usage?.completionTokens ?? 0,
          total_tokens: result.usage?.totalTokens ?? 0,
        },
      };
    },
    estimateCost(usage) {
      return (usage.prompt_tokens + usage.completion_tokens) * 0.000001;
    },
  };
}

export { createAiSdkProvider };
