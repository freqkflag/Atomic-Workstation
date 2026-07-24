import { describe, expect, it } from "vitest";
import { createDefaultScheduler } from "./index.js";

describe("WorkflowScheduler", () => {
  it("fires weekly metrics on Sunday 6am UTC", () => {
    const scheduler = createDefaultScheduler();
    const sunday = new Date("2026-07-26T06:02:00.000Z");
    expect(scheduler.dueJobs(sunday).map((j) => j.workflowId)).toContain(
      "ae5-weekly-metrics",
    );
  });
});
