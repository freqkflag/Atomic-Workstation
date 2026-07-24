import { describe, expect, it } from "vitest";
import { KnowledgeGraph, mockEmbed } from "./index.js";

describe("KnowledgeGraph", () => {
  it("retrieves facts valid at a point in time", () => {
    const graph = new KnowledgeGraph();
    graph.ingest({
      id: "1",
      projectId: "p1",
      text: "Deploy target was Vercel last Tuesday",
      validFrom: "2026-07-15T00:00:00.000Z",
      embedding: mockEmbed("deploy vercel"),
    });
    graph.ingest({
      id: "2",
      projectId: "p1",
      text: "Deploy target was Railway before migration",
      validFrom: "2026-06-01T00:00:00.000Z",
      validTo: "2026-07-14T23:59:59.000Z",
    });

    const results = graph.hybridRetrieve(
      "p1",
      "deploy target",
      "2026-07-16T12:00:00.000Z",
    );
    expect(results[0]?.text).toContain("Vercel");
  });
});
