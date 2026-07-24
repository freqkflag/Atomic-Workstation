import { useState } from "react";

export type PanelId = "editor" | "terminal" | "browser" | "database" | "email" | "chat";

export interface WorkbenchLayout {
  left: PanelId[];
  center: PanelId;
  right: PanelId[];
}

const DEFAULT_LAYOUT: WorkbenchLayout = {
  left: ["editor"],
  center: "terminal",
  right: ["browser", "chat"],
};

export function useWorkbenchLayout() {
  const [layout, setLayout] = useState<WorkbenchLayout>(() => {
    const saved = localStorage.getItem("atomic-workbench-layout");
    return saved ? (JSON.parse(saved) as WorkbenchLayout) : DEFAULT_LAYOUT;
  });

  const persist = (next: WorkbenchLayout) => {
    setLayout(next);
    localStorage.setItem("atomic-workbench-layout", JSON.stringify(next));
  };

  return { layout, setLayout: persist };
}

export function CommandPalette({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
}) {
  if (!open) return null;
  const commands = [
    "Switch project",
    "Open editor",
    "Open terminal",
    "Open browser",
    "Run agent",
    "Export backup",
  ];
  return (
    <div className="command-palette" role="dialog" aria-label="Command palette">
      <div className="command-palette__backdrop" onClick={onClose} />
      <ul className="command-palette__list">
        {commands.map((cmd) => (
          <li key={cmd}>
            <button type="button" onClick={() => onSelect(cmd)}>
              {cmd}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
