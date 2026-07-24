import type { FastifyInstance } from "fastify";
import type { VirtualKeyStore } from "@atomic/gateway-core";
import { listSpendLogs } from "../spend/logger.js";

export function registerAdminRoutes(app: FastifyInstance, keyStore: VirtualKeyStore) {
  app.get("/admin/keys", async () => keyStore.list());

  app.post("/admin/keys", async (request, reply) => {
    const body = request.body as {
      name: string;
      budgetUsd?: number;
      allowedModels?: string[];
    };
    const key = keyStore.createKey({
      name: body.name,
      budgetUsd: body.budgetUsd,
      allowedModels: body.allowedModels,
    });
    return reply.code(201).send(key);
  });

  app.get("/admin/spend", async () => listSpendLogs());

  app.get("/admin/providers", async () => ({
    providers: [
      { id: "openai", status: "ok" },
      { id: "anthropic", status: "ok" },
      { id: "ollama", status: process.env.OLLAMA_BASE_URL ? "ok" : "unconfigured" },
    ],
  }));
}
