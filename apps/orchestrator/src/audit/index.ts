import { z } from "zod";

export const auditEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  actor: z.string().default("local-user"),
  summary: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string(),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;

export class AuditLog {
  private events: AuditEvent[] = [];

  append(input: Omit<AuditEvent, "id" | "createdAt" | "actor"> & { actor?: string }): AuditEvent {
    const event: AuditEvent = {
      actor: "local-user",
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  list(limit = 100): AuditEvent[] {
    return this.events.slice(-limit).reverse();
  }

  export(): string {
    return JSON.stringify({ version: "1", events: this.events }, null, 2);
  }
}
