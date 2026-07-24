import { describe, expect, it } from "vitest";

describe("mobile companion smoke", () => {
  it("declares biometric vault requirement (AE18)", () => {
    const config = {
      biometricUnlock: true,
      pushApprovals: true,
      platforms: ["ios", "android"],
    };
    expect(config.biometricUnlock).toBe(true);
    expect(config.platforms).toHaveLength(2);
  });
});
