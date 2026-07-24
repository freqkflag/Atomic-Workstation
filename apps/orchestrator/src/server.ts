import { mkdir } from "node:fs/promises";
import { eq, desc } from "drizzle-orm";
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import {
  createWorkspaceInput,
  createProjectInput,
  createScriptInput,
} from "@atomic/shared";
import {
  createDb,
  type AtomicDb,
  activityEvents,
  projects,
  workspaces,
} from "@atomic/db";
import { Vault } from "@atomic/vault";
import { McpHub, DEFAULT_LOCAL_SERVERS } from "@atomic/mcp-hub";
import { registerProjectRoutes } from "./projects/routes.js";

export interface OrchestratorConfig {
  port: number;
  host: string;
  dataDir: string;
}

export interface OrchestratorContext {
  db: AtomicDb;
  vault: Vault;
  mcpHub: McpHub;
}

export async function buildServer(config: OrchestratorConfig) {
  await mkdir(config.dataDir, { recursive: true });
  const db = await createDb({ dataDir: config.dataDir });
  const vault = new Vault({
    db,
    masterSecret: process.env.ATOMIC_MASTER_SECRET ?? "dev-master-secret",
    unlocked: process.env.ATOMIC_VAULT_UNLOCKED === "true",
  });
  const mcpHub = new McpHub({ servers: DEFAULT_LOCAL_SERVERS });
  const ctx: OrchestratorContext = { db, vault, mcpHub };

  const app = Fastify({ logger: true });
  await app.register(websocket);

  app.decorate("ctx", ctx);

  app.get("/health", async () => ({ status: "ok", service: "orchestrator" }));

  app.get("/api/workspaces", async () => {
    return app.ctx.db.select().from(workspaces);
  });

  app.post("/api/workspaces", async (request, reply) => {
    const body = createWorkspaceInput.parse(request.body);
    const now = new Date().toISOString();
    const [row] = await app.ctx.db
      .insert(workspaces)
      .values({ id: crypto.randomUUID(), name: body.name, createdAt: now, updatedAt: now })
      .returning();
    return reply.code(201).send(row);
  });

  registerProjectRoutes(app);

  app.get("/api/activity", async (request) => {
    const projectId = (request.query as { projectId?: string }).projectId;
    let query = app.ctx.db.select().from(activityEvents);
    if (projectId) {
      query = query.where(eq(activityEvents.projectId, projectId)) as typeof query;
    }
    return query.orderBy(desc(activityEvents.createdAt)).limit(50);
  });

  app.post("/api/activity", async (request, reply) => {
    const body = request.body as {
      projectId?: string;
      type: string;
      summary: string;
      metadata?: Record<string, unknown>;
    };
    const now = new Date().toISOString();
    const [row] = await app.ctx.db
      .insert(activityEvents)
      .values({
        id: crypto.randomUUID(),
        projectId: body.projectId,
        type: body.type,
        summary: body.summary,
        metadata: body.metadata ?? {},
        createdAt: now,
      })
      .returning();
    return reply.code(201).send(row);
  });

  app.get("/api/mcp/servers", async () => app.ctx.mcpHub.listServers());

  app.post("/api/vault/unlock", async () => {
    app.ctx.vault.unlock();
    return { unlocked: true };
  });

  app.post("/api/vault/secrets", async (request, reply) => {
    const body = request.body as { key: string; value: string };
    try {
      await app.ctx.vault.setSecret(body.key, body.value);
      return { ok: true };
    } catch (err) {
      return reply.code(403).send({ error: (err as Error).message });
    }
  });

  app.get("/ws", { websocket: true }, (socket) => {
    socket.send(JSON.stringify({ type: "connected", ts: Date.now() }));
    socket.on("message", (raw: Buffer) => {
      socket.send(JSON.stringify({ type: "echo", data: raw.toString() }));
    });
  });

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    ctx: OrchestratorContext;
  }
}

export async function startServer(config: OrchestratorConfig) {
  const app = await buildServer(config);
  await app.listen({ port: config.port, host: config.host });
  return app;
}
