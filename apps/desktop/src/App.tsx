import { useCallback, useEffect, useState } from "react";
import { Button } from "@atomic/ui";
import type { ActivityEvent, Project, Workspace } from "@atomic/shared";
import { ProjectsPanel } from "./features/projects/ProjectsPanel";
import { ActivityFeed } from "./features/activity/ActivityFeed";

const API_BASE = import.meta.env.VITE_ORCHESTRATOR_URL ?? "http://127.0.0.1:4310";

export function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [gatewayStatus] = useState("pending P1");
  const [agentStatus] = useState("pending P5");

  const refresh = useCallback(async () => {
    const [wsRes, projRes, actRes] = await Promise.all([
      fetch(`${API_BASE}/api/workspaces`),
      fetch(`${API_BASE}/api/projects`),
      fetch(`${API_BASE}/api/activity`),
    ]);
    if (wsRes.ok) setWorkspaces(await wsRes.json());
    if (projRes.ok) setProjects(await projRes.json());
    if (actRes.ok) setActivity(await actRes.json());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  return (
    <div className="workbench">
      <header className="workbench__header">
        <div className="workbench__title">Atomic Workstation</div>
        <Button onClick={() => void refresh()}>Refresh</Button>
      </header>

      <main className="workbench__main">
        <ProjectsPanel
          workspaces={workspaces}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onCreated={refresh}
          apiBase={API_BASE}
        />

        <section className="panel">
          <h2>Project dashboard</h2>
          {activeProject ? (
            <>
              <p>
                <strong>{activeProject.name}</strong>
              </p>
              <p>Git branch: {activeProject.gitBranch ?? "—"}</p>
              <p>Sidecar slots reserved for orchestrator + gateway (P0).</p>
            </>
          ) : (
            <p>Select a project to begin.</p>
          )}
        </section>

        <ActivityFeed events={activity} />
      </main>

      <footer className="status-bar">
        <span>Gateway: {gatewayStatus}</span>
        <span>Agent: {agentStatus}</span>
        <span>Projects: {projects.length}</span>
      </footer>
    </div>
  );
}
