import type { ModelRegistryEntry, ModelDeployment } from "./types.js";

export class ModelRegistry {
  private entries = new Map<string, ModelRegistryEntry>();

  register(entry: ModelRegistryEntry): void {
    this.entries.set(entry.alias, entry);
  }

  list(): ModelRegistryEntry[] {
    return [...this.entries.values()];
  }

  resolve(alias: string): ModelDeployment {
    const entry = this.entries.get(alias);
    if (!entry?.deployments[0]) {
      throw new Error(`Unknown model alias: ${alias}`);
    }
    return entry.deployments[0];
  }

  resolveWithFallbacks(alias: string): ModelDeployment[] {
    const entry = this.entries.get(alias);
    if (!entry) throw new Error(`Unknown model alias: ${alias}`);
    return entry.deployments;
  }

  listOpenAiModels(): Array<{ id: string; object: string; owned_by: string }> {
    return [...this.entries.keys()].map((id) => ({
      id,
      object: "model",
      owned_by: "atomic",
    }));
  }
}

export function createDefaultRegistry(): ModelRegistry {
  const registry = new ModelRegistry();
  const defaults: Array<[string, string, string]> = [
    ["gpt-4o", "openai", "gpt-4o"],
    ["gpt-4o-mini", "openai", "gpt-4o-mini"],
    ["claude-3-5-sonnet", "anthropic", "claude-3-5-sonnet-20241022"],
    ["llama-local", "ollama", "llama3.2"],
  ];
  for (const [alias, providerId, modelId] of defaults) {
    registry.register({
      alias,
      deployments: [{ providerId, modelId, tags: ["chat", "tools"] }],
      capabilities: ["chat", "tools"],
    });
  }
  return registry;
}
