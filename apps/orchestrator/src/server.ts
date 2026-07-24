import { mkdir } from "node:fs/promises";
import { eq, desc } from "drizzle-orm";
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import {
  createWorkspaceInput,
} from "@atomic/shared";
import {
  createDb,
  type AtomicDb,
  activityEvents,
  workspaces,
} from "@atomic/db";
import { Vault } from "@atomic/vault";
import { McpHub, DEFAULT_LOCAL_SERVERS } from "@atomic/mcp-hub";
import { registerProjectRoutes } from "./projects/routes.js";
import { AuditLog } from "./audit/index.js";
import { ProjectAclStore } from "./auth/acl.js";
import { AgentRuntime } from "./agent/runtime.js";
import { createDefaultConnectors } from "./connectors/index.js";
import { WebhookConnector } from "./connectors/webhook/index.js";
import { createDefaultScheduler } from "./scheduler/index.js";
import { createDefaultWorkflowLibrary } from "@atomic/workflows";
import { exportBackup } from "@atomic/vault/backup";

export interface OrchestratorConfig {
  port: number;
  host: string;
  dataDir: string;
}

export interface OrchestratorContext {
  db: AtomicDb;
  vault: Vault;
  mcpHub: McpHub;
  audit: AuditLog;
  acl: ProjectAclStore;
  agent: AgentRuntime;
  connectors: ReturnType<typeof createDefaultConnectors>;
  webhooks: WebhookConnector;
  scheduler: ReturnType<typeof createDefaultScheduler>;
  workflows: ReturnType<typeof createDefaultWorkflowLibrary>;
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
  const ctx: OrchestratorContext = {
    db,
    vault,
    mcpHub,
    audit: new AuditLog(),
    acl: new ProjectAclStore(),
    agent: new AgentRuntime(),
    connectors: createDefaultConnectors(),
    webhooks: new WebhookConnector(),
    scheduler: createDefaultScheduler(),
    workflows: createDefaultWorkflowLibrary(),
  };

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

  app.get("/api/audit", async () => app.ctx.audit.list());

  app.get("/api/projects/:id/acl", async (request) => {
    const { id } = request.params as { id: string };
    return app.ctx.acl.get(id);
  });

  app.put("/api/projects/:id/acl", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      allowedTools?: string[];
      allowedConnectors?: string[];
      allowedMcpServers?: string[];
    };
    app.ctx.acl.set({ projectId: id, ...body });
    app.ctx.audit.append({
      type: "acl.updated",
      summary: `ACL updated for project ${id}`,
      metadata: body,
    });
    return reply.send(app.ctx.acl.get(id));
  });

  app.post("/api/agent/run", async (request, reply) => {
    const body = request.body as {
      projectId: string;
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      mode?: "local-mcp" | "gateway-mcp";
    };
    const acl = app.ctx.acl.get(body.projectId);
    if (!acl.allowedMcpServers.includes("local") && body.mode !== "gateway-mcp") {
      return reply.code(403).send({ error: "Local MCP not allowed for project" });
    }
    const result = await app.ctx.agent.run(body);
    app.ctx.audit.append({
      type: "agent.run",
      summary: `Agent run ${result.runId}`,
      metadata: { projectId: body.projectId, mode: body.mode ?? "local-mcp" },
    });
    return result;
  });

  app.get("/api/connectors", async () => {
    const health = await Promise.all(
      [...app.ctx.connectors.values()].map((c) => c.health()),
    );
    return health;
  });

  app.post("/api/connectors/:id/connect", async (request, reply) => {
    const { id } = request.params as { id: string };
    const connector = app.ctx.connectors.get(id);
    if (!connector) return reply.code(404).send({ error: "Connector not found" });
    await connector.connect();
    return connector.health();
  });

  app.post("/api/webhooks/inbound/:source", async (request, reply) => {
    const { source } = request.params as { source: string };
    const raw = JSON.stringify(request.body);
    const sig = request.headers["x-atomic-signature"] as string | undefined;
    if (!app.ctx.webhooks.verifySignature(raw, sig)) {
      return reply.code(401).send({ error: "Invalid webhook signature" });
    }
    const event = app.ctx.webhooks.ingest(source, request.body);
    app.ctx.audit.append({
      type: "webhook.received",
      summary: `Webhook from ${source}`,
      metadata: { eventId: event.id },
    });
    return reply.code(202).send(event);
  });

  app.get("/api/workflows", async () => app.ctx.workflows.list());

  app.get("/api/workflows/export", async () => ({
    bundle: app.ctx.workflows.exportBundle(),
  }));

  app.get("/api/scheduler/jobs", async () => app.ctx.scheduler.list());

  app.post("/api/backup/export", async (request, reply) => {
    const body = request.body as { passphrase: string };
    const payload = {
      version: "1",
      exportedAt: new Date().toISOString(),
      settings: { dataDir: config.dataDir },
      workflows: app.ctx.workflows.list(),
      gatewayConfig: { url: process.env.ATOMIC_GATEWAY_URL ?? "http://127.0.0.1:4000" },
      memorySnapshotMeta: { note: "metadata-only in P4 scaffold" },
    };
    const { blob, iv } = exportBackup(payload, body.passphrase);
    return reply.send({ blob, iv, filename: "workspace.atomic-backup" });
  });


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
