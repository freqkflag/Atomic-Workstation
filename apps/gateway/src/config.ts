import { readFile, watch } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import type { FallbackChain, ModelRegistryEntry } from "@atomic/gateway-core";

const gatewayConfigSchema = z.object({
  port: z.number().default(4000),
  host: z.string().default("127.0.0.1"),
  masterKey: z.string().optional(),
  fallbackChains: z
    .array(z.object({ alias: z.string(), targets: z.array(z.string()) }))
    .default([]),
  models: z
    .array(
      z.object({
        alias: z.string(),
        deployments: z.array(
          z.object({
            providerId: z.string(),
            modelId: z.string(),
            baseUrl: z.string().optional(),
            apiKeyEnv: z.string().optional(),
            tags: z.array(z.string()).optional(),
          }),
        ),
        capabilities: z.array(z.string()).default(["chat"]),
      }),
    )
    .optional(),
  shadowRoutes: z
    .array(
      z.object({
        primary: z.string(),
        shadow: z.string(),
        sampleRate: z.number().min(0).max(1).default(0.1),
      }),
    )
    .default([]),
});

export type GatewayConfig = z.infer<typeof gatewayConfigSchema>;

export interface GatewayConfigState {
  config: GatewayConfig;
  reload: () => Promise<void>;
}

export async function loadGatewayConfig(configPath?: string): Promise<GatewayConfigState> {
  const path = configPath ?? process.env.ATOMIC_GATEWAY_CONFIG ?? "gateway.yaml";
  const abs = resolve(path);

  const load = async (): Promise<GatewayConfig> => {
    if (!existsSync(abs)) {
      return gatewayConfigSchema.parse({});
    }
    const raw = await readFile(abs, "utf8");
    const parsed = parseSimpleYaml(raw);
    return gatewayConfigSchema.parse(parsed);
  };

  let config = await load();

  const reload = async () => {
    config = await load();
  };

  if (existsSync(abs)) {
    try {
      const watcher = watch(abs);
      void (async () => {
        for await (const _ of watcher) {
          await reload();
        }
      })();
    } catch {
      // hot reload optional in test environments
    }
  }

  return {
    get config() {
      return config;
    },
    reload,
  };
}

export function applyModelsToRegistry(
  entries: ModelRegistryEntry[] | undefined,
  register: (entry: ModelRegistryEntry) => void,
): void {
  if (!entries?.length) return;
  for (const entry of entries) {
    register(entry);
  }
}

export function getFallbackChains(config: GatewayConfig): FallbackChain[] {
  return config.fallbackChains;
}

/** Minimal YAML subset parser for gateway.yaml */
function parseSimpleYaml(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = raw.split("\n");
  let currentKey: string | null = null;
  const arrays: Record<string, unknown[]> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const kv = trimmed.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      const [, key, value] = kv;
      if (value === "") {
        currentKey = key;
        arrays[key] = arrays[key] ?? [];
        continue;
      }
      if (value === "[]") {
        result[key] = [];
        continue;
      }
      const num = Number(value);
      result[key] = Number.isFinite(num) && value !== "" ? num : stripQuotes(value);
      currentKey = null;
      continue;
    }

    if (trimmed.startsWith("- ") && currentKey) {
      const item = trimmed.slice(2).trim();
      if (item.startsWith("{")) {
        arrays[currentKey].push(JSON.parse(item.replace(/'/g, '"')));
      } else {
        arrays[currentKey].push(stripQuotes(item));
      }
    }
  }

  for (const [key, value] of Object.entries(arrays)) {
    if (value.length) result[key] = value;
  }
  return result;
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "");
}
