import { describe, expect, it } from "vitest";
import { createDefaultWorkflowLibrary, REFERENCE_WORKFLOW_IDS } from "./index.js";

describe("WorkflowLibrary", () => {
  it("ships all eight reference workflows", () => {
    const lib = createDefaultWorkflowLibrary();
    expect(lib.list()).toHaveLength(REFERENCE_WORKFLOW_IDS.length);
    for (const id of REFERENCE_WORKFLOW_IDS) {
      expect(lib.get(id)).toBeDefined();
    }
  });

  it("exports and imports signed bundle", () => {
    const lib = createDefaultWorkflowLibrary();
    const bundle = lib.exportBundle();
    const fresh = createDefaultWorkflowLibrary();
    fresh.list().forEach((t) => fresh.register({ ...t, name: "cleared" }));
    const count = fresh.importBundle(bundle);
    expect(count).toBe(REFERENCE_WORKFLOW_IDS.length);
    expect(fresh.get("ae1-email-deploy-reply")?.name).not.toBe("cleared");
  });
});
