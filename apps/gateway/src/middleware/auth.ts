import type { FastifyReply, FastifyRequest } from "fastify";
import type { VirtualKeyStore } from "@atomic/gateway-core";

export function createAuthHook(keyStore: VirtualKeyStore) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const path = request.url.split("?")[0];
    if (
      path === "/health" ||
      path === "/ready" ||
      path.startsWith("/admin") ||
      path === "/metrics"
    ) {
      return;
    }

    const auth = request.headers.authorization;
    const key = keyStore.authenticate(auth);
    if (!key) {
      return reply.code(401).send({
        error: {
          message: "Invalid API key",
          type: "invalid_request_error",
          code: "invalid_api_key",
        },
      });
    }

  if (!keyStore.isWithinBudget(key)) {
      return reply.code(429).send({
        error: {
          message: "Budget exceeded for virtual key",
          type: "budget_exceeded",
        },
      });
    }

    (request as FastifyRequest & { virtualKey: typeof key }).virtualKey = key;
  };
}

export function getVirtualKey(request: FastifyRequest) {
  return (request as FastifyRequest & { virtualKey?: { id: string } }).virtualKey;
}
