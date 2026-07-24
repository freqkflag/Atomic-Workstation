import type { VirtualKeyStore } from "@atomic/gateway-core";

export interface SpendLogEntry {
  keyId: string;
  usd: number;
  model: string;
  tokens: number;
  at: string;
}

const logs: SpendLogEntry[] = [];

export function recordSpend(
  keyStore: VirtualKeyStore,
  keyId: string,
  usd: number,
  meta: { model: string; tokens: number },
): void {
  keyStore.recordSpend(keyId, usd);
  logs.push({
    keyId,
    usd,
    model: meta.model,
    tokens: meta.tokens,
    at: new Date().toISOString(),
  });
}

export function listSpendLogs(): SpendLogEntry[] {
  return [...logs];
}

export function totalSpend(): number {
  return logs.reduce((sum, l) => sum + l.usd, 0);
}
