import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema.js";

export type AtomicDb = PgliteDatabase<typeof schema>;

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  root_path TEXT,
  panel_state JSONB NOT NULL DEFAULT '{}',
  git_branch TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_scripts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  command TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_entries (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

export type DataBackend = "pglite" | "postgres";

export interface DbConfig {
  dataDir: string;
  backend?: DataBackend;
}

export async function createDb(config: DbConfig): Promise<AtomicDb> {
  const backend = config.backend ?? "pglite";
  if (backend !== "pglite") {
    throw new Error(
      `Postgres backend not yet implemented in P0; use DATA_BACKEND=pglite`,
    );
  }

  const client = new PGlite(`${config.dataDir}/atomic.pglite`);
  await client.exec(MIGRATION_SQL);
  return drizzle(client, { schema });
}

export { schema };
export * from "./schema.js";
