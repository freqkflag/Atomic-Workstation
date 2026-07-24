import { createHmac, timingSafeEqual } from "node:crypto";
import { describe, expect, it } from "vitest";
import { WebhookConnector } from "./index.js";

describe("WebhookConnector", () => {
  it("verifies HMAC signature", () => {
    const connector = new WebhookConnector("test-secret");
    const body = JSON.stringify({ event: "deploy.failed" });
    const sig = createHmac("sha256", "test-secret").update(body).digest("hex");
    expect(connector.verifySignature(body, sig)).toBe(true);
  });
});
