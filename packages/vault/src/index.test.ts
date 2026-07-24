import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDb } from "@atomic/db";
import { Vault, VaultLockedError } from "./index.js";

describe("Vault", () => {
  let dataDir: string;

  beforeAll(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "atomic-vault-"));
  });

  afterAll(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("refuses access when locked", async () => {
    const db = await createDb({ dataDir });
    const vault = new Vault({ db, masterSecret: "test-secret", unlocked: false });
    await expect(vault.setSecret("openai", "sk-test")).rejects.toBeInstanceOf(
      VaultLockedError,
    );
  });

  it("stores and retrieves secrets when unlocked", async () => {
    const dir = `${dataDir}-unlocked`;
    await mkdir(dir, { recursive: true });
    const db = await createDb({ dataDir: dir });
    const vault = new Vault({ db, masterSecret: "test-secret", unlocked: true });
    await vault.setSecret("openai", "sk-test");
    await expect(vault.getSecret("openai")).resolves.toBe("sk-test");
  });

  it("redacts secrets from logs", () => {
    expect(Vault.redact("token sk-test here", ["sk-test"])).toBe(
      "token [REDACTED] here",
    );
  });
});
