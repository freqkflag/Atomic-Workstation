import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { buildGatewayServer } from "./server.js";

describe("gateway contract", () => {
  let app: Awaited<ReturnType<typeof buildGatewayServer>>["app"];
  const masterKey = "test-master-key";

  beforeAll(async () => {
    process.env.ATOMIC_GATEWAY_MASTER_KEY = masterKey;
    const built = await buildGatewayServer({ port: 0 });
    app = built.app;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ok" });
  });

  it("GET /v1/models lists registry", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/models",
      headers: { authorization: `Bearer ${masterKey}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBeGreaterThan(0);
  });

  it("POST /v1/chat/completions without key returns 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4o",
        messages: [{ role: "user", content: "hi" }],
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /v1/chat/completions with key returns completion", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { authorization: `Bearer ${masterKey}` },
      payload: {
        model: "gpt-4o",
        messages: [{ role: "user", content: "hello contract test" }],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.choices[0].message.role).toBe("assistant");
    expect(body.choices[0].message.content).toBeTruthy();
  });

  it("POST /v1/embeddings returns embedding vector", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/embeddings",
      headers: { authorization: `Bearer ${masterKey}` },
      payload: { model: "text-embedding-3-small", input: "test" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data[0].embedding).toBeDefined();
  });
});
