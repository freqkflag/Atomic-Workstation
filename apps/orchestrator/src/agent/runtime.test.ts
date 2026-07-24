import { describe, expect, it } from "vitest";
import { AgentRuntime } from "./runtime.js";

describe("AgentRuntime", () => {
  it("blocks destructive actions without approval", async () => {
    const agent = new AgentRuntime("http://127.0.0.1:9"); // unused when blocked
    const result = await agent.run({
      projectId: "p1",
      messages: [{ role: "user", content: "deploy to production now" }],
    });
    expect(result.pendingApproval).toBeDefined();
  });
});
