import { z } from "zod";

export const workflowTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["agent", "script", "approval", "webhook"]),
      config: z.record(z.unknown()).default({}),
    }),
  ),
  tags: z.array(z.string()).default([]),
});

export type WorkflowTemplate = z.infer<typeof workflowTemplateSchema>;

export const REFERENCE_WORKFLOW_IDS = [
  "ae1-email-deploy-reply",
  "ae2-nl-chart-compare",
  "ae3-competitive-audit",
  "ae4-standup-synthesis",
  "ae5-weekly-metrics",
  "ae6-deploy-fix",
  "ae7-hero-update",
  "ae8-changelog-draft",
] as const;

export class WorkflowLibrary {
  private templates = new Map<string, WorkflowTemplate>();

  register(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);
  }

  get(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  list(): WorkflowTemplate[] {
    return [...this.templates.values()];
  }

  exportBundle(): string {
    return JSON.stringify({
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      templates: this.list(),
    });
  }

  importBundle(raw: string): number {
    const parsed = JSON.parse(raw) as { templates: WorkflowTemplate[] };
    let count = 0;
    for (const t of parsed.templates) {
      this.register(workflowTemplateSchema.parse(t));
      count++;
    }
    return count;
  }
}

export function createDefaultWorkflowLibrary(): WorkflowLibrary {
  const lib = new WorkflowLibrary();
  for (const id of REFERENCE_WORKFLOW_IDS) {
    lib.register({
      id,
      name: id.replace(/^ae\d+-/, "").replace(/-/g, " "),
      version: "1.0.0",
      steps: [{ id: "start", type: "agent", config: { prompt: `Run ${id}` } }],
      tags: ["reference", id.split("-")[0] ?? "ae"],
    });
  }
  return lib;
}
