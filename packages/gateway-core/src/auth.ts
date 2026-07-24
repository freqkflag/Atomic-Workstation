import { randomBytes } from "node:crypto";
import type { VirtualKey } from "./types.js";

export class VirtualKeyStore {
  private keys = new Map<string, VirtualKey>();
  private masterKey: string;

  constructor(masterKey = process.env.ATOMIC_GATEWAY_MASTER_KEY ?? "dev-master") {
    this.masterKey = masterKey;
    this.keys.set("default", {
      id: "default",
      name: "default",
      token: this.masterKey,
      spentUsd: 0,
      budgetUsd: 100,
    });
  }

  createKey(input: Omit<VirtualKey, "id" | "token" | "spentUsd">): VirtualKey {
    const key: VirtualKey = {
      ...input,
      id: crypto.randomUUID(),
      token: `sk-atomic-${randomBytes(24).toString("hex")}`,
      spentUsd: 0,
    };
    this.keys.set(key.id, key);
    return key;
  }

  authenticate(bearer?: string): VirtualKey | null {
    if (!bearer) return null;
    const token = bearer.replace(/^Bearer\s+/i, "");
    if (token === this.masterKey) return this.keys.get("default") ?? null;
    return [...this.keys.values()].find((k) => k.token === token) ?? null;
  }

  recordSpend(keyId: string, usd: number): void {
    const key = this.keys.get(keyId);
    if (key) key.spentUsd += usd;
  }

  list(): VirtualKey[] {
    return [...this.keys.values()].map((k) => ({ ...k, token: "***" }));
  }

  isWithinBudget(key: VirtualKey): boolean {
    if (key.budgetUsd === undefined) return true;
    return key.spentUsd < key.budgetUsd;
  }

  isModelAllowed(key: VirtualKey, model: string): boolean {
    if (!key.allowedModels?.length) return true;
    return key.allowedModels.includes(model);
  }
}
