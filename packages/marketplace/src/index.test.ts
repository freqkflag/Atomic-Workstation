import { describe, expect, it } from "vitest";
import { MarketplaceRegistry } from "./index.js";

describe("MarketplaceRegistry", () => {
  it("installs signed workflow template package", () => {
    const registry = new MarketplaceRegistry();
    const pkg = registry.sign({
      id: "wf-deploy-fix",
      name: "Deploy Fix",
      version: "1.0.0",
      type: "workflow",
      payload: { templateId: "ae6-deploy-fix" },
    });
    registry.install(pkg);
    expect(registry.get("wf-deploy-fix")).toBeDefined();
  });

  it("rejects tampered signature", () => {
    const registry = new MarketplaceRegistry();
    const pkg = registry.sign({
      id: "bad",
      name: "Bad",
      version: "1.0.0",
      type: "workflow",
      payload: { x: 1 },
    });
    pkg.payload = { x: 2 };
    expect(() => registry.install(pkg)).toThrow(/signature/i);
  });
});
