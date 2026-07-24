import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { createProjectInput, createScriptInput } from "@atomic/shared";
import { projectScripts, projects } from "@atomic/db";

export function registerProjectRoutes(app: FastifyInstance) {
  app.get("/api/projects", async (request) => {
    const workspaceId = (request.query as { workspaceId?: string }).workspaceId;
    if (workspaceId) {
      return app.ctx.db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, workspaceId));
    }
    return app.ctx.db.select().from(projects);
  });

  app.post("/api/projects", async (request, reply) => {
    const body = createProjectInput.parse(request.body);
    const now = new Date().toISOString();
    const [row] = await app.ctx.db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        workspaceId: body.workspaceId,
        name: body.name,
        rootPath: body.rootPath,
        panelState: {},
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await app.ctx.db.insert(projectScripts).values({
      id: crypto.randomUUID(),
      projectId: row!.id,
      name: "dev",
      command: "npm run dev",
      createdAt: now,
    });

    return reply.code(201).send(row);
  });

  app.patch("/api/projects/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      panelState?: Record<string, unknown>;
      gitBranch?: string;
      name?: string;
    };
    const now = new Date().toISOString();
    const [row] = await app.ctx.db
      .update(projects)
      .set({
        ...(body.panelState !== undefined ? { panelState: body.panelState } : {}),
        ...(body.gitBranch !== undefined ? { gitBranch: body.gitBranch } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        updatedAt: now,
      })
      .where(eq(projects.id, id))
      .returning();
    if (!row) return reply.code(404).send({ error: "not found" });
    return row;
  });

  app.get("/api/projects/:id/scripts", async (request) => {
    const { id } = request.params as { id: string };
    return app.ctx.db
      .select()
      .from(projectScripts)
      .where(eq(projectScripts.projectId, id));
  });

  app.post("/api/projects/:id/scripts", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createScriptInput.parse({ ...(request.body as object), projectId: id });
    const now = new Date().toISOString();
    const [row] = await app.ctx.db
      .insert(projectScripts)
      .values({
        id: crypto.randomUUID(),
        projectId: body.projectId,
        name: body.name,
        command: body.command,
        createdAt: now,
      })
      .returning();
    return reply.code(201).send(row);
  });
}
