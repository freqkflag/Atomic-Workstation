import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import {
  createDefaultRegistry,
  GatewayRouter,
  VirtualKeyStore,
} from "@atomic/gateway-core";
import { createAllProviders } from "@atomic/gateway-providers";
import {
  applyModelsToRegistry,
  getFallbackChains,
  loadGatewayConfig,
} from "./config.js";
import { createAuthHook } from "./middleware/auth.js";
import { registerChatRoutes, registerModelRoutes } from "./routes/openai.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerMcpRoutes } from "./mcp/index.js";
import { metricsHandler } from "./observability/metrics.js";

export interface GatewayServerConfig {
  port?: number;
  host?: string;
  configPath?: string;
}

export async function buildGatewayServer(options: GatewayServerConfig = {}) {
  const configState = await loadGatewayConfig(options.configPath);
  const registry = createDefaultRegistry();
  applyModelsToRegistry(configState.config.models, (entry) => registry.register(entry));

  const providers = createAllProviders();
  const router = new GatewayRouter({
    registry,
    providers,
    fallbackChains: getFallbackChains(configState.config),
  });

  const keyStore = new VirtualKeyStore(
    configState.config.masterKey ?? process.env.ATOMIC_GATEWAY_MASTER_KEY,
  );

  const app = Fastify({ logger: true });

  app.addHook("preHandler", createAuthHook(keyStore));

  app.get("/health", async () => ({ status: "ok", service: "gateway" }));
  app.get("/ready", async () => ({
    status: "ready",
    models: registry.list().length,
    providers: providers.size,
  }));

  app.get("/metrics", async (_req, reply) => {
    reply.header("Content-Type", "text/plain");
    return metricsHandler();
  });

  registerModelRoutes(app, registry);
  registerChatRoutes(app, { router, registry, keyStore, config: configState.config });
  registerAdminRoutes(app, keyStore);
  registerMcpRoutes(app);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const adminUiPath = resolve(__dirname, "../admin-ui");
  await app.register(fastifyStatic, {
    root: adminUiPath,
    prefix: "/admin/",
    decorateReply: false,
  });

  app.get("/admin", async (_req, reply) => {
    const html = await readFile(resolve(adminUiPath, "index.html"), "utf8");
    reply.type("text/html").send(html);
  });

  app.decorate("gatewayCtx", { registry, router, keyStore, configState });

  return { app, registry, router, keyStore, configState };
}

declare module "fastify" {
  interface FastifyInstance {
    gatewayCtx: {
      registry: ReturnType<typeof createDefaultRegistry>;
      router: GatewayRouter;
      keyStore: VirtualKeyStore;
      configState: Awaited<ReturnType<typeof loadGatewayConfig>>;
    };
  }
}

export async function startGatewayServer(options: GatewayServerConfig = {}) {
  const built = await buildGatewayServer(options);
  const port = options.port ?? built.configState.config.port;
  const host = options.host ?? built.configState.config.host;
  await built.app.listen({ port, host });
  return built;
}
