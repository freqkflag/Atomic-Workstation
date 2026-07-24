import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface McpServerConfig {
  id: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpHubOptions {
  servers: McpServerConfig[];
}

export class McpHub {
  private clients = new Map<string, Client>();

  constructor(private readonly options: McpHubOptions) {}

  listServers(): McpServerConfig[] {
    return this.options.servers;
  }

  async connect(serverId: string): Promise<Client> {
    const existing = this.clients.get(serverId);
    if (existing) return existing;

    const config = this.options.servers.find((s) => s.id === serverId);
    if (!config) {
      throw new Error(`Unknown MCP server: ${serverId}`);
    }

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args ?? [],
      env: config.env,
    });

    const client = new Client(
      { name: "atomic-workstation", version: "0.0.1" },
      { capabilities: {} },
    );
    await client.connect(transport);
    this.clients.set(serverId, client);
    return client;
  }

  async disconnect(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (!client) return;
    await client.close();
    this.clients.delete(serverId);
  }

  async disconnectAll(): Promise<void> {
    for (const id of [...this.clients.keys()]) {
      await this.disconnect(id);
    }
  }

  async listTools(serverId: string): Promise<string[]> {
    const client = await this.connect(serverId);
    const result = await client.listTools();
    return result.tools.map((t) => t.name);
  }
}

export const DEFAULT_LOCAL_SERVERS: McpServerConfig[] = [
  {
    id: "filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
  },
];
