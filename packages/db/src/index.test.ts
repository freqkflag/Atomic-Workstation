import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDb } from "./index.js";
import { workspaces } from "./schema.js";

describe("createDb", () => {
  let dataDir: string;

  beforeAll(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "atomic-db-"));
  });

  afterAll(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("migrates and accepts inserts", async () => {
    const db = await createDb({ dataDir });
    const [row] = await db
      .insert(workspaces)
      .values({ id: crypto.randomUUID(), name: "solo" })
      .returning();
    expect(row?.name).toBe("solo");
  });
});
