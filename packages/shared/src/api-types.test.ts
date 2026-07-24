import { describe, expect, it } from "vitest";
import { createWorkspaceInput } from "./api-types.js";

describe("createWorkspaceInput", () => {
  it("accepts valid names", () => {
    expect(createWorkspaceInput.parse({ name: "solo lab" }).name).toBe("solo lab");
  });
});
