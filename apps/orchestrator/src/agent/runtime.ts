export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentRunInput {
  projectId: string;
  messages: AgentMessage[];
  gatewayUrl?: string;
  mode?: "local-mcp" | "gateway-mcp";
}

export interface AgentRunResult {
  runId: string;
  content: string;
  toolCalls: Array<{ name: string; result: unknown }>;
  pendingApproval?: { action: string; reason: string };
}

const GATEWAY_URL = process.env.ATOMIC_GATEWAY_URL ?? "http://127.0.0.1:4000/v1";

export class AgentRuntime {
  constructor(private readonly gatewayUrl = GATEWAY_URL) {}

  async run(input: AgentRunInput): Promise<AgentRunResult> {
    const runId = crypto.randomUUID();
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
    const prompt = lastUser?.content ?? "";

    const destructive = /\b(deploy|delete|drop|rm -rf)\b/i.test(prompt);
    if (destructive && !prompt.includes("APPROVED")) {
      return {
        runId,
        content: "",
        toolCalls: [],
        pendingApproval: {
          action: "destructive-command",
          reason: "Destructive action requires explicit approval",
        },
      };
    }

    const res = await fetch(`${this.gatewayUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ATOMIC_GATEWAY_MASTER_KEY ?? "dev-master"}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: input.messages,
      }),
    });

    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content =
      body.choices?.[0]?.message?.content ??
      `[agent:${input.mode ?? "local-mcp"}] processed: ${prompt.slice(0, 80)}`;

    const toolCalls =
      input.mode === "gateway-mcp"
        ? [{ name: "gateway-mcp-stub", result: { ok: true } }]
        : [{ name: "local-mcp-hub", result: { ok: true } }];

    return { runId, content, toolCalls };
  }
}
