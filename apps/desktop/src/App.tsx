import { useCallback, useEffect, useState } from "react";
import { Button } from "@atomic/ui";
import type { ActivityEvent, Project, Workspace } from "@atomic/shared";
import { ProjectsPanel } from "./features/projects/ProjectsPanel";
import { ActivityFeed } from "./features/activity/ActivityFeed";
import { CommandPalette, useWorkbenchLayout } from "./workbench/WorkbenchShell";
import { EditorPanel } from "./panels/editor/EditorPanel";
import { TerminalPanel } from "./panels/terminal/TerminalPanel";
import { BrowserPanel } from "./panels/browser/BrowserPanel";
import { DatabasePanel } from "./panels/database/DatabasePanel";
import { EmailPanel } from "./panels/email/EmailPanel";
import { AgentChatPanel } from "./panels/chat/AgentChatPanel";

const API_BASE = import.meta.env.VITE_ORCHESTRATOR_URL ?? "http://127.0.0.1:4310";
const GATEWAY_BASE = import.meta.env.VITE_GATEWAY_URL ?? "http://127.0.0.1:4000";

export function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState("checking…");
  const [agentStatus] = useState("ready");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { layout } = useWorkbenchLayout();

  const refresh = useCallback(async () => {
    const [wsRes, projRes, actRes] = await Promise.all([
      fetch(`${API_BASE}/api/workspaces`),
      fetch(`${API_BASE}/api/projects`),
      fetch(`${API_BASE}/api/activity`),
    ]);
    if (wsRes.ok) setWorkspaces(await wsRes.json());
    if (projRes.ok) setProjects(await projRes.json());
    if (actRes.ok) setActivity(await actRes.json());

    try {
      const gw = await fetch(`${GATEWAY_BASE}/health`);
      setGatewayStatus(gw.ok ? "online" : "offline");
    } catch {
      setGatewayStatus("offline");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [refresh]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  return (
    <div className="workbench">
      <header className="workbench__header">
        <div className="workbench__title">Atomic Workstation</div>
        <Button onClick={() => setPaletteOpen(true)}>⌘K</Button>
        <Button onClick={() => void refresh()}>Refresh</Button>
      </header>

      <main className="workbench__main workbench__dock">
        <aside className="workbench__rail">
          <ProjectsPanel
            workspaces={workspaces}
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={setActiveProjectId}
            onCreated={refresh}
            apiBase={API_BASE}
          />
          <ActivityFeed events={activity} />
        </aside>

        <section className="workbench__center">
          {layout.left.includes("editor") && <EditorPanel />}
          {layout.center === "terminal" && <TerminalPanel />}
          {layout.right.includes("browser") && <BrowserPanel />}
          {layout.right.includes("chat") && (
            <AgentChatPanel projectId={activeProjectId} />
          )}
        </section>

        <aside className="workbench__side">
          <section className="panel">
            <h2>Project dashboard</h2>
            {activeProject ? (
              <>
                <p>
                  <strong>{activeProject.name}</strong>
                </p>
                <p>Git branch: {activeProject.gitBranch ?? "—"}</p>
              </>
            ) : (
              <p>Select a project to begin.</p>
            )}
          </section>
          <DatabasePanel />
          <EmailPanel />
        </aside>
      </main>

      <footer className="status-bar">
        <span>Gateway: {gatewayStatus}</span>
        <span>Agent: {agentStatus}</span>
        <span>Projects: {projects.length}</span>
      </footer>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={() => setPaletteOpen(false)}
      />
    </div>
  );
}
