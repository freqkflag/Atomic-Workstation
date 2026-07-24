import { z } from "zod";

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const projectSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  name: z.string().min(1),
  rootPath: z.string().optional(),
  panelState: z.record(z.unknown()).default({}),
  gitBranch: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const projectScriptSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1),
  command: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const activityEventSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  type: z.enum(["agent_run", "deploy", "spend", "workflow", "system"]),
  summary: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
});

export type Workspace = z.infer<typeof workspaceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectScript = z.infer<typeof projectScriptSchema>;
export type ActivityEvent = z.infer<typeof activityEventSchema>;

export const createWorkspaceInput = z.object({ name: z.string().min(1) });
export const createProjectInput = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1),
  rootPath: z.string().optional(),
});
export const createScriptInput = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  command: z.string().min(1),
});
