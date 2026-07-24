export interface ConnectorHealth {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  lastChecked: string;
}

export interface Connector {
  id: string;
  name: string;
  type: "github" | "vercel" | "gmail" | "supabase" | "slack" | "webhook";
  connect(): Promise<void>;
  health(): Promise<ConnectorHealth>;
  listResources(): Promise<unknown[]>;
}

class BaseConnector implements Connector {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly type: Connector["type"],
    private connected = false,
  ) {}

  async connect(): Promise<void> {
    this.connected = true;
  }

  async health(): Promise<ConnectorHealth> {
    return {
      id: this.id,
      name: this.name,
      status: this.connected ? "connected" : "disconnected",
      lastChecked: new Date().toISOString(),
    };
  }

  async listResources(): Promise<unknown[]> {
    return [{ id: `${this.id}-resource-1`, type: this.type }];
  }
}

export const CONNECTOR_IDS = ["github", "vercel", "gmail", "supabase", "slack"] as const;

export function createDefaultConnectors(): Map<string, Connector> {
  const map = new Map<string, Connector>();
  for (const id of CONNECTOR_IDS) {
    map.set(id, new BaseConnector(id, id, id as Connector["type"]));
  }
  return map;
}
