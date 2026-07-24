import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { buildGatewayServer } from "./server.js";
import { runGuardrails } from "./guardrails/index.js";
import { enqueueShadowRequest, shadowQueueSize } from "./shadow/index.js";

describe("gateway integration", () => {
  let app: Awaited<ReturnType<typeof buildGatewayServer>>["app"];

  beforeAll(async () => {
    process.env.ATOMIC_GATEWAY_MASTER_KEY = "integration-key";
    const built = await buildGatewayServer();
    app = built.app;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("router resolves ollama fallback model", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { authorization: "Bearer integration-key" },
      payload: {
        model: "llama-local",
        messages: [{ role: "user", content: "ping" }],
      },
    });
    expect(res.statusCode).toBe(200);
  });

  it("guardrails block sensitive patterns", () => {
    const result = runGuardrails([
      { content: "password: supersecret123" },
    ]);
    expect(result.allowed).toBe(false);
  });

  it("shadow queue accepts async requests", () => {
    const before = shadowQueueSize();
    enqueueShadowRequest({ model: "shadow-model", messages: [] });
    expect(shadowQueueSize()).toBe(before + 1);
  });

  it("admin keys endpoint lists virtual keys", async () => {
    const res = await app.inject({ method: "GET", url: "/admin/keys" });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });
});
