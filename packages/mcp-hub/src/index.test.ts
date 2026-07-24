import { describe, expect, it } from "vitest";
import { McpHub, DEFAULT_LOCAL_SERVERS } from "./index.js";

describe("McpHub", () => {
  it("lists configured servers", () => {
    const hub = new McpHub({ servers: DEFAULT_LOCAL_SERVERS });
    expect(hub.listServers()[0]?.id).toBe("filesystem");
  });
});
