import { describe, expect, it } from "vitest";
import { createAllProviders, WAVE1_PROVIDER_IDS, WAVE2_PROVIDER_IDS } from "./registry.js";

describe("gateway-providers matrix", () => {
  it("registers wave 1 and wave 2 families", () => {
    const providers = createAllProviders();
    for (const id of WAVE1_PROVIDER_IDS) {
      expect(providers.has(id), `missing ${id}`).toBe(true);
    }
    for (const id of WAVE2_PROVIDER_IDS) {
      expect(providers.has(id), `missing ${id}`).toBe(true);
    }
  });
});
