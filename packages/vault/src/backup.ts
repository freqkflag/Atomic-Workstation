import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

export interface BackupPayload {
  version: string;
  exportedAt: string;
  settings: Record<string, unknown>;
  workflows: unknown[];
  gatewayConfig: Record<string, unknown>;
  memorySnapshotMeta: Record<string, unknown>;
}

const ALGO = "aes-256-gcm";

export function exportBackup(
  payload: BackupPayload,
  passphrase: string,
): { blob: string; iv: string } {
  const key = scryptSync(passphrase, "atomic-backup", 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([data, tag]).toString("base64");
  return { blob, iv: iv.toString("base64") };
}

export function importBackup(
  blob: string,
  ivB64: string,
  passphrase: string,
): BackupPayload {
  const key = scryptSync(passphrase, "atomic-backup", 32);
  const iv = Buffer.from(ivB64, "base64");
  const data = Buffer.from(blob, "base64");
  const tag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const json = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  return JSON.parse(json) as BackupPayload;
}
