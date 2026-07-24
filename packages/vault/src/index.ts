import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { eq } from "drizzle-orm";
import type { AtomicDb } from "@atomic/db";
import { vaultEntries } from "@atomic/db";

const ALGO = "aes-256-gcm";
const KEY_LENGTH = 32;

export interface VaultOptions {
  db: AtomicDb;
  /** Master key material; in production derived from keytar + user unlock */
  masterSecret: string;
  unlocked?: boolean;
}

export class Vault {
  private readonly key: Buffer;
  private unlocked: boolean;

  constructor(private readonly options: VaultOptions) {
    this.key = scryptSync(options.masterSecret, "atomic-workstation", KEY_LENGTH);
    this.unlocked = options.unlocked ?? false;
  }

  unlock(): void {
    this.unlocked = true;
  }

  lock(): void {
    this.unlocked = false;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  assertUnlocked(): void {
    if (!this.unlocked) {
      throw new VaultLockedError();
    }
  }

  async setSecret(key: string, value: string): Promise<void> {
    this.assertUnlocked();
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const payload = Buffer.concat([encrypted, tag]).toString("base64");
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const existing = await this.options.db
      .select()
      .from(vaultEntries)
      .where(eq(vaultEntries.key, key))
      .limit(1);

    if (existing[0]) {
      await this.options.db
        .update(vaultEntries)
        .set({
          ciphertext: payload,
          iv: iv.toString("base64"),
          updatedAt: now,
        })
        .where(eq(vaultEntries.key, key));
      return;
    }

    await this.options.db.insert(vaultEntries).values({
      id,
      key,
      ciphertext: payload,
      iv: iv.toString("base64"),
      createdAt: now,
      updatedAt: now,
    });
  }

  async getSecret(key: string): Promise<string | null> {
    this.assertUnlocked();
    const [row] = await this.options.db
      .select()
      .from(vaultEntries)
      .where(eq(vaultEntries.key, key))
      .limit(1);
    if (!row) return null;

    const iv = Buffer.from(row.iv, "base64");
    const data = Buffer.from(row.ciphertext, "base64");
    const tag = data.subarray(data.length - 16);
    const encrypted = data.subarray(0, data.length - 16);
    const decipher = createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  }

  /** Redact secrets from log strings */
  static redact(input: string, secrets: string[]): string {
    let out = input;
    for (const secret of secrets) {
      if (secret.length > 0) {
        out = out.split(secret).join("[REDACTED]");
      }
    }
    return out;
  }
}

export class VaultLockedError extends Error {
  constructor() {
    super("Vault is locked");
    this.name = "VaultLockedError";
  }
}

export async function tryLoadKeytarMasterKey(
  service: string,
): Promise<string | null> {
  try {
    const keytar = await import("keytar");
    return await keytar.getPassword(service, "master");
  } catch {
    return null;
  }
}

export async function storeKeytarMasterKey(
  service: string,
  secret: string,
): Promise<void> {
  const keytar = await import("keytar");
  await keytar.setPassword(service, "master", secret);
}
