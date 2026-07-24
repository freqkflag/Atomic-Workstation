import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildServer } from "./server.js";

describe("orchestrator integration", () => {
  let dataDir: string;
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "atomic-orch-"));
    process.env.ATOMIC_VAULT_UNLOCKED = "true";
    app = await buildServer({ dataDir, port: 0, host: "127.0.0.1" });
    await app.listen({ port: 0, host: "127.0.0.1" });
  });

  afterAll(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("returns health", async () => {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ status: "ok" });
  });

  it("creates workspace and project", async () => {
    const address = app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const base = `http://127.0.0.1:${port}`;

    const wsRes = await fetch(`${base}/api/workspaces`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "solo lab" }),
    });
    const workspace = await wsRes.json();
    expect(workspace.name).toBe("solo lab");

    const projRes = await fetch(`${base}/api/projects`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId: workspace.id, name: "side-project" }),
    });
    const project = await projRes.json();
    expect(project.name).toBe("side-project");

    const scriptsRes = await fetch(`${base}/api/projects/${project.id}/scripts`);
    const scripts = await scriptsRes.json();
    expect(scripts.length).toBeGreaterThan(0);
  });
});
