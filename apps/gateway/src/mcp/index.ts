import type { FastifyInstance } from "fastify";

export interface McpServerConfig {
  id: string;
  name: string;
  transport: "stdio" | "http";
  command?: string;
  url?: string;
}

const servers: McpServerConfig[] = [
  { id: "github", name: "GitHub MCP", transport: "stdio", command: "npx @modelcontextprotocol/server-github" },
];

export function registerMcpRoutes(app: FastifyInstance) {
  app.get("/mcp/servers", async () => servers);

  app.post("/mcp/servers", async (request, reply) => {
    const body = request.body as McpServerConfig;
    servers.push(body);
    return reply.code(201).send(body);
  });

  app.post("/mcp/tools/:serverId/:toolName", async (request, reply) => {
    const { serverId, toolName } = request.params as { serverId: string; toolName: string };
    const server = servers.find((s) => s.id === serverId);
    if (!server) return reply.code(404).send({ error: "Server not found" });
    return {
      serverId,
      toolName,
      result: { ok: true, stub: true },
    };
  });
}
