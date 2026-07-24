import { describe, expect, it } from "vitest";
import { exportBackup, importBackup } from "./backup.js";

describe("vault backup", () => {
  it("round-trips encrypted backup bundle", () => {
    const payload = {
      version: "1",
      exportedAt: new Date().toISOString(),
      settings: { theme: "neuro-rainbow" },
      workflows: [{ id: "ae1-email-deploy-reply" }],
      gatewayConfig: { port: 4000 },
      memorySnapshotMeta: { facts: 3 },
    };
    const { blob, iv } = exportBackup(payload, "test-passphrase");
    const restored = importBackup(blob, iv, "test-passphrase");
    expect(restored.settings.theme).toBe("neuro-rainbow");
    expect(restored.workflows).toHaveLength(1);
  });
});
