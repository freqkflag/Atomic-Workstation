import { z } from "zod";

export const projectAclSchema = z.object({
  projectId: z.string(),
  allowedTools: z.array(z.string()).default([]),
  allowedConnectors: z.array(z.string()).default([]),
  allowedMcpServers: z.array(z.string()).default([]),
});

export type ProjectAcl = z.infer<typeof projectAclSchema>;

export class ProjectAclStore {
  private acls = new Map<string, ProjectAcl>();

  set(acl: Partial<ProjectAcl> & { projectId: string }): void {
    const current = this.get(acl.projectId);
    this.acls.set(acl.projectId, projectAclSchema.parse({ ...current, ...acl }));
  }

  get(projectId: string): ProjectAcl {
    return (
      this.acls.get(projectId) ?? {
        projectId,
        allowedTools: ["filesystem", "git", "shell"],
        allowedConnectors: [],
        allowedMcpServers: ["local"],
      }
    );
  }

  isToolAllowed(projectId: string, tool: string): boolean {
    const acl = this.get(projectId);
    return acl.allowedTools.includes(tool) || acl.allowedTools.includes("*");
  }

  isConnectorAllowed(projectId: string, connector: string): boolean {
    const acl = this.get(projectId);
    return acl.allowedConnectors.includes(connector) || acl.allowedConnectors.includes("*");
  }
}
