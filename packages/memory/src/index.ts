import MiniSearch from "minisearch";
import { z } from "zod";

export const factSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  text: z.string(),
  validFrom: z.string(),
  validTo: z.string().optional(),
  embedding: z.array(z.number()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Fact = z.infer<typeof factSchema>;

export class KnowledgeGraph {
  private facts = new Map<string, Fact>();
  private search: MiniSearch<Fact>;

  constructor() {
    this.search = new MiniSearch({
      fields: ["text"],
      storeFields: ["id", "projectId", "validFrom", "validTo"],
    });
  }

  ingest(fact: Fact): void {
    this.facts.set(fact.id, fact);
    this.search.add(fact);
  }

  query(projectId: string, query: string, asOf?: string): Fact[] {
    const when = asOf ?? new Date().toISOString();
    const hits = this.search.search(query);
    return hits
      .map((h) => this.facts.get(String(h.id)))
      .filter((f): f is Fact => {
        if (!f || f.projectId !== projectId) return false;
        if (f.validFrom > when) return false;
        if (f.validTo && f.validTo < when) return false;
        return true;
      });
  }

  hybridRetrieve(projectId: string, query: string, asOf?: string): Array<Fact & { score?: number }> {
    const bm25 = this.query(projectId, query, asOf);
    const keywordBoost = bm25.map((f) => ({
      ...f,
      score: (f.text.match(new RegExp(query, "i")) ? 2 : 1) + (f.embedding?.length ? 0.5 : 0),
    }));
    return keywordBoost.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  list(projectId: string): Fact[] {
    return [...this.facts.values()].filter((f) => f.projectId === projectId);
  }
}

export function mockEmbed(text: string): number[] {
  const vec = new Array(8).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % 8] += text.charCodeAt(i) / 1000;
  }
  return vec;
}
