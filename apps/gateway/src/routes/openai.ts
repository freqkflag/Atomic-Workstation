import type { FastifyInstance } from "fastify";
import type { GatewayRouter, ModelRegistry, VirtualKeyStore } from "@atomic/gateway-core";
import { chatCompletionRequestSchema } from "@atomic/gateway-core";
import { getVirtualKey } from "../middleware/auth.js";
import { recordSpend } from "../spend/logger.js";
import { runGuardrails } from "../guardrails/index.js";
import { getFromCache, setCache } from "../cache/index.js";
import { enqueueShadowRequest } from "../shadow/index.js";
import type { GatewayConfig } from "../config.js";

export interface ChatRouteDeps {
  router: GatewayRouter;
  registry: ModelRegistry;
  keyStore: VirtualKeyStore;
  config: GatewayConfig;
}

export function registerChatRoutes(app: FastifyInstance, deps: ChatRouteDeps) {
  app.post("/v1/chat/completions", async (request, reply) => {
    const body = chatCompletionRequestSchema.parse(request.body);
    const virtualKey = getVirtualKey(request);

    if (virtualKey && !deps.keyStore.isModelAllowed(virtualKey as never, body.model)) {
      return reply.code(403).send({ error: { message: "Model not allowed for this key" } });
    }

    const guardrail = runGuardrails(body.messages);
    if (!guardrail.allowed) {
      return reply.code(400).send({ error: { message: guardrail.reason } });
    }

    const cacheKey = JSON.stringify({ model: body.model, messages: body.messages });
    if (!body.stream) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return reply.send({ ...cached, cached: true });
      }
    }

    let decision;
    try {
      decision = deps.router.resolve(body.model);
    } catch (err) {
      return reply.code(404).send({ error: { message: (err as Error).message } });
    }

    const shadowRoute = deps.config.shadowRoutes.find((r) => r.primary === body.model);
    if (shadowRoute && Math.random() < shadowRoute.sampleRate) {
      enqueueShadowRequest({ model: shadowRoute.shadow, messages: body.messages });
    }

    if (body.stream) {
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      const content = `[stream:${decision.alias}] mock response`;
      reply.raw.write(`data: ${JSON.stringify({
        id: `chatcmpl-${crypto.randomUUID()}`,
        object: "chat.completion.chunk",
        choices: [{ index: 0, delta: { content }, finish_reason: null }],
      })}\n\n`);
      reply.raw.write("data: [DONE]\n\n");
      reply.raw.end();
      return;
    }

    try {
      const response = await decision.provider.chatCompletion(body, decision.deployment);
      setCache(cacheKey, response);
      if (virtualKey && response.usage) {
        const cost =
          decision.provider.estimateCost?.(response.usage, body.model) ?? 0.0001;
        recordSpend(deps.keyStore, virtualKey.id, cost, {
          model: body.model,
          tokens: response.usage.total_tokens,
        });
      }
      return reply.send(response);
    } catch (err) {
      deps.router.markCooldown(body.model, 30_000);
      return reply.code(502).send({ error: { message: (err as Error).message } });
    }
  });

  app.post("/v1/completions", async (request, reply) => {
    const body = request.body as { model: string; prompt: string };
    return app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: request.headers,
      payload: {
        model: body.model,
        messages: [{ role: "user", content: body.prompt }],
      },
    }).then((res) => reply.code(res.statusCode).send(res.json()));
  });

  app.post("/v1/embeddings", async (_request, reply) => {
    return reply.send({
      object: "list",
      data: [{ object: "embedding", index: 0, embedding: [0.1, 0.2, 0.3] }],
      model: "text-embedding-3-small",
      usage: { prompt_tokens: 5, total_tokens: 5 },
    });
  });

  app.post("/v1/images/generations", async (request, reply) => {
    const body = request.body as { prompt: string };
    return reply.send({
      created: Math.floor(Date.now() / 1000),
      data: [{ url: `https://placeholder.atomic.local/img?p=${encodeURIComponent(body.prompt.slice(0, 32))}` }],
    });
  });

  app.post("/v1/audio/transcriptions", async (_request, reply) => {
    return reply.send({ text: "[transcription stub]" });
  });

  app.post("/v1/audio/speech", async (_request, reply) => {
    return reply.send(Buffer.from("RIFF....WAVEfmt "));
  });
}

export function registerModelRoutes(app: FastifyInstance, registry: ModelRegistry) {
  app.get("/v1/models", async () => ({
    object: "list",
    data: registry.listOpenAiModels(),
  }));

  app.get("/v1/models/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const models = registry.listOpenAiModels();
    const model = models.find((m) => m.id === id);
    if (!model) return reply.code(404).send({ error: { message: "Model not found" } });
    return model;
  });
}
