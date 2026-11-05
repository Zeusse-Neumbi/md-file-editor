import { useEditorStore } from "../stores/useEditorStore";
import { pickFile, pickFolder } from "../lib/filePicker";

const statusColorMap: Record<string, string> = {
  saved: "bg-status-saved",
  saving: "bg-status-saving",
  unsaved: "bg-status-unsaved",
  error: "bg-status-error",
};

const statusLabelMap: Record<string, string> = {
  saved: "Saved",
  saving: "Saving...",
  unsaved: "Unsaved",
  error: "Save error",
};

export function TitleBar() {
  const currentFilePath = useEditorStore((s) => s.currentFilePath);
  const workspacePath = useEditorStore((s) => s.workspacePath);
  const saveStatus = useEditorStore((s) => s.saveStatus);

  const displayPath = (() => {
    if (!currentFilePath) return "No file open";
    if (workspacePath && currentFilePath.startsWith(workspacePath)) {
      return ". " + currentFilePath.slice(workspacePath.length);
    }
    return currentFilePath;
  })();

  return (
    <div className="h-10 bg-titlebar-bg border-b border-border flex items-center px-3 gap-3 select-none shrink-0">
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={pickFile}
          className="text-xs px-2 py-1 rounded border border-border text-gray-300 hover:bg-sidebar-hover hover:text-white transition-colors"
          title="Open a Markdown file (Ctrl+O)"
        >
          Open file
        </button>
        <button
          type="button"
          onClick={pickFolder}
          className="text-xs px-2 py-1 rounded border border-border text-gray-300 hover:bg-sidebar-hover hover:text-white transition-colors"
          title="Open a folder (Ctrl+Shift+O)"
        >
          Open folder
        </button>
      </div>

      {/* File path */}
      <div className="text-sm text-gray-300 truncate flex-1">{displayPath}</div>

      {/* Save status indicator */}
      <div className="flex items-center gap-1.5 shrink-0" title={statusLabelMap[saveStatus]}>
        <span
          className={`w-2 h-2 rounded-full ${statusColorMap[saveStatus]}`}
        />
        <span className="text-xs text-gray-500 hidden sm:inline">
          {statusLabelMap[saveStatus]}
        </span>
      </div>
    </div>
  );
}
