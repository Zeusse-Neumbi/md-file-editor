import { useEditorStore } from "../stores/useEditorStore";

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
  const isModified = useEditorStore((s) => s.isModified);
  const saveStatus = useEditorStore((s) => s.saveStatus);

  const displayPath = (() => {
    if (!currentFilePath) return "No file open";
    if (workspacePath && currentFilePath.startsWith(workspacePath)) {
      return ". " + currentFilePath.slice(workspacePath.length);
    }
    return currentFilePath;
  })();

  return (
    <div className="h-9 bg-titlebar-bg border-b border-border flex items-center px-4 gap-3 select-none shrink-0">
      {/* File path */}
      <div className="text-sm text-gray-300 truncate flex-1">
        {currentFilePath && isModified ? (
          <>
            <span className="text-status-unsaved mr-1">*</span>
            {displayPath}
          </>
        ) : (
          displayPath
        )}
      </div>

      {/* Save status indicator */}
      <div className="flex items-center gap-1.5" title={statusLabelMap[saveStatus]}>
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
