#!/usr/bin/env tsx
/**
 * FOSS inventory drift check (U32, R96).
 * Ensures docs/foss-ai-stack.md and docs/foss-exceptions.md mention key workspace packages.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fossStack = readFileSync(join(root, "docs/foss-ai-stack.md"), "utf8");
const fossExceptions = readFileSync(join(root, "docs/foss-exceptions.md"), "utf8");

const REQUIRED_IN_DOCS = [
  "@modelcontextprotocol/sdk",
  "@electric-sql/pglite",
  "drizzle-orm",
  "fastify",
];

const workspacePackages = collectWorkspaceDeps(join(root));

const errors: string[] = [];

for (const pkg of REQUIRED_IN_DOCS) {
  if (!workspacePackages.has(pkg)) {
    errors.push(`Workspace missing expected FOSS dep: ${pkg}`);
  }
  if (!fossStack.includes(pkg) && !fossExceptions.includes(pkg)) {
    errors.push(`FOSS docs missing reference to: ${pkg}`);
  }
}

if (errors.length > 0) {
  console.error("FOSS inventory check failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log("FOSS inventory check passed.");
console.log(`Tracked workspace FOSS deps: ${workspacePackages.size}`);

function collectWorkspaceDeps(dir: string): Set<string> {
  const deps = new Set<string>();
  for (const entry of walk(dir)) {
    if (entry.endsWith("package.json") && !entry.includes("node_modules")) {
      try {
        const json = JSON.parse(readFileSync(entry, "utf8")) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
          optionalDependencies?: Record<string, string>;
        };
        for (const section of [
          json.dependencies,
          json.devDependencies,
          json.optionalDependencies,
        ]) {
          if (!section) continue;
          for (const name of Object.keys(section)) {
            if (!name.startsWith("@atomic/")) deps.add(name);
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return deps;
}

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "target" || name === "dist") continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) yield* walk(path);
    else yield path;
  }
}
