import { useState } from "react";
import { Button } from "@atomic/ui";
import type { Project, Workspace } from "@atomic/shared";

interface ProjectsPanelProps {
  workspaces: Workspace[];
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreated: () => void;
  apiBase: string;
}

export function ProjectsPanel({
  workspaces,
  projects,
  activeProjectId,
  onSelectProject,
  onCreated,
  apiBase,
}: ProjectsPanelProps) {
  const [name, setName] = useState("");

  async function createProject() {
    let workspaceId = workspaces[0]?.id;
    if (!workspaceId) {
      const wsRes = await fetch(`${apiBase}/api/workspaces`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "My Lab" }),
      });
      const ws = await wsRes.json();
      workspaceId = ws.id;
    }

    await fetch(`${apiBase}/api/projects`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, name: name || "New Project" }),
    });
    setName("");
    onCreated();
  }

  return (
    <section className="panel">
      <h2>Projects</h2>
      <ul className="project-list">
        {projects.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              data-active={project.id === activeProjectId}
              onClick={() => onSelectProject(project.id)}
            >
              {project.name}
            </button>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          style={{
            flex: 1,
            background: "#05070d",
            border: "1px solid rgba(0,229,255,0.25)",
            borderRadius: 8,
            color: "var(--atomic-text)",
            padding: "0.5rem",
          }}
        />
        <Button onClick={() => void createProject()}>Add</Button>
      </div>
    </section>
  );
}
