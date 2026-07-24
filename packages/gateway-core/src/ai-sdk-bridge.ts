import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { ChatCompletionRequest, ChatCompletionResponse, ModelDeployment } from "./types.js";

export async function chatViaOpenAiSdk(
  request: ChatCompletionRequest,
  deployment: ModelDeployment,
  apiKey?: string,
): Promise<ChatCompletionResponse> {
  const key = apiKey ?? process.env.OPENAI_API_KEY ?? "mock-key";
  const openai = createOpenAI({
    apiKey: key,
    baseURL: deployment.baseUrl,
  });

  const messages = request.messages.map((m) => ({
    role: m.role as "system" | "user" | "assistant",
    content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
  }));

  if (!process.env.OPENAI_API_KEY && !deployment.baseUrl) {
    return mockResponse(request.model, messages.map((m) => m.content).join("\n"));
  }

  const result = await generateText({
    model: openai(deployment.modelId),
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
}

function mockResponse(model: string, prompt: string): ChatCompletionResponse {
  return {
    id: `chatcmpl-mock-${crypto.randomUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: `[mock:${model}] ${prompt.slice(0, 120)}`,
        },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  };
}
