import { useState } from "react";
import { Button } from "@atomic/ui";

const API_BASE = import.meta.env.VITE_ORCHESTRATOR_URL ?? "http://127.0.0.1:4310";

export function AgentChatPanel({ projectId }: { projectId: string | null }) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const send = async () => {
    if (!projectId || !input.trim()) return;
    const next = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    const res = await fetch(`${API_BASE}/api/agent/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, messages: next, mode: "local-mcp" }),
    });
    const data = await res.json();
    if (data.pendingApproval) {
      setPending(data.pendingApproval.reason);
      return;
    }
    setMessages([...next, { role: "assistant", content: data.content }]);
  };

  return (
    <section className="panel panel--chat" aria-label="Agent chat">
      <h3>Agent</h3>
      {pending && <p className="approval-banner">Approval required: {pending}</p>}
      <div className="chat-log">
        {messages.map((m, i) => (
          <p key={i}>
            <strong>{m.role}:</strong> {m.content}
          </p>
        ))}
      </div>
      <div className="chat-input">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the agent…" />
        <Button onClick={() => void send()}>Send</Button>
      </div>
    </section>
  );
}
