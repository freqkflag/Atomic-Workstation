import { createHmac, timingSafeEqual } from "node:crypto";

export interface WebhookEvent {
  id: string;
  source: string;
  payload: unknown;
  receivedAt: string;
}

export class WebhookConnector {
  private events: WebhookEvent[] = [];
  private secret: string;

  constructor(secret = process.env.ATOMIC_WEBHOOK_SECRET ?? "dev-webhook-secret") {
    this.secret = secret;
  }

  verifySignature(rawBody: string, signature?: string): boolean {
    if (!signature) return false;
    const expected = createHmac("sha256", this.secret).update(rawBody).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  ingest(source: string, payload: unknown): WebhookEvent {
    const event: WebhookEvent = {
      id: crypto.randomUUID(),
      source,
      payload,
      receivedAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  list(): WebhookEvent[] {
    return [...this.events].reverse();
  }
}
