export interface GuardrailResult {
  allowed: boolean;
  reason?: string;
}

const BLOCKED_PATTERNS = [
  /\bSSN\s*[:=]\s*\d{3}-\d{2}-\d{4}\b/i,
  /\bpassword\s*[:=]\s*\S+/i,
];

export function runGuardrails(
  messages: Array<{ content: unknown }>,
): GuardrailResult {
  const text = messages
    .map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)))
    .join("\n");

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: "Content blocked by guardrail policy" };
    }
  }
  return { allowed: true };
}
