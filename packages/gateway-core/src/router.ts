import type {
  FallbackChain,
  ModelDeployment,
  ProviderAdapter,
  RouteDecision,
} from "./types.js";
import type { ModelRegistry } from "./model-registry.js";

export interface RouterOptions {
  registry: ModelRegistry;
  providers: Map<string, ProviderAdapter>;
  fallbackChains?: FallbackChain[];
  cooldowns?: Map<string, number>;
}

export class GatewayRouter {
  private fallbackChains: FallbackChain[];
  private cooldowns: Map<string, number>;

  constructor(private readonly options: RouterOptions) {
    this.fallbackChains = options.fallbackChains ?? [];
    this.cooldowns = options.cooldowns ?? new Map();
  }

  /** Rough token estimate for context-window pre-check (R18) */
  estimateTokens(messages: Array<{ content: unknown }>): number {
    const text = messages
      .map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)))
      .join(" ");
    return Math.ceil(text.length / 4);
  }

  resolve(modelAlias: string, messages?: Array<{ content: unknown }>): RouteDecision {
    if (messages && this.estimateTokens(messages) > 128_000) {
      throw new Error("Context window exceeded for model");
    }

    const chain = this.fallbackChains.find((c) => c.alias === modelAlias);
    const aliases = chain?.targets ?? [modelAlias];

    for (const alias of aliases) {
      const cooledUntil = this.cooldowns.get(alias);
      if (cooledUntil && cooledUntil > Date.now()) continue;

      let deployments: ModelDeployment[];
      try {
        deployments = this.options.registry.resolveWithFallbacks(alias);
      } catch {
        continue;
      }

      for (const deployment of deployments) {
        const provider = this.options.providers.get(deployment.providerId);
        if (provider) {
          return { deployment, provider, alias };
        }
      }
    }

    throw new Error(`No available provider for model: ${modelAlias}`);
  }

  markCooldown(alias: string, ms: number): void {
    this.cooldowns.set(alias, Date.now() + ms);
  }
}
