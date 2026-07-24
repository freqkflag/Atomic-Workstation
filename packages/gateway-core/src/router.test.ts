import { describe, expect, it } from "vitest";
import { createDefaultRegistry } from "./model-registry.js";
import { GatewayRouter } from "./router.js";
import type { ProviderAdapter, ChatCompletionRequest, ChatCompletionResponse, ModelDeployment } from "./types.js";

class MockProvider implements ProviderAdapter {
  constructor(
    readonly id: string,
    readonly family: string,
  ) {}

  async chatCompletion(
    request: ChatCompletionRequest,
    _deployment: ModelDeployment,
  ): Promise<ChatCompletionResponse> {
    return {
      id: "x",
      object: "chat.completion",
      created: 0,
      model: request.model,
      choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
    };
  }
}

describe("GatewayRouter", () => {
  it("resolves primary provider", () => {
    const registry = createDefaultRegistry();
    const providers = new Map<string, ProviderAdapter>([
      ["openai", new MockProvider("openai", "openai")],
    ]);
    const router = new GatewayRouter({ registry, providers });
    const decision = router.resolve("gpt-4o");
    expect(decision.provider.id).toBe("openai");
  });

  it("falls back when primary on cooldown", () => {
    const registry = createDefaultRegistry();
    registry.register({
      alias: "smart",
      deployments: [
        { providerId: "openai", modelId: "gpt-4o" },
        { providerId: "openai", modelId: "gpt-4o-mini" },
      ],
      capabilities: ["chat"],
    });
    const providers = new Map([["openai", new MockProvider("openai", "openai")]]);
    const router = new GatewayRouter({
      registry,
      providers,
      fallbackChains: [{ alias: "smart", targets: ["smart", "gpt-4o-mini"] }],
    });
    router.markCooldown("smart", 60_000);
    const decision = router.resolve("smart");
    expect(decision.alias).toBe("gpt-4o-mini");
  });

  it("rejects context window overflow", () => {
    const registry = createDefaultRegistry();
    const providers = new Map([["openai", new MockProvider("openai", "openai")]]);
    const router = new GatewayRouter({ registry, providers });
    const huge = "x".repeat(600_000);
    expect(() =>
      router.resolve("gpt-4o", [{ content: huge }]),
    ).toThrow(/context window/i);
  });
});
