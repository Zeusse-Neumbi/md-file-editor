import { useEditorStore } from "../stores/useEditorStore";

export function Sidebar() {
  const fileTree = useEditorStore((s) => s.fileTree);
  const workspacePath = useEditorStore((s) => s.workspacePath);
  const isLoadingFileTree = useEditorStore((s) => s.isLoadingFileTree);
  const openFile = useEditorStore((s) => s.openFile);
  const currentFilePath = useEditorStore((s) => s.currentFilePath);

  if (!workspacePath) return null;

  const handleFileClick = (path: string) => {
    openFile(path);
  };

  return (
    <div className="w-60 h-full bg-sidebar-bg border-r border-border flex flex-col overflow-hidden">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-border">
        Explorer
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoadingFileTree ? (
          <div className="px-3 py-2 text-sm text-gray-500 italic">Loading...</div>
        ) : fileTree.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500 italic">
            No markdown files found
          </div>
        ) : (
          <ul className="py-1">
            {fileTree.map((entry) => (
              <li key={entry.path}>
                <button
                  className={`w-full text-left px-3 py-1 text-sm flex items-center gap-2 hover:bg-sidebar-hover transition-colors ${
                    currentFilePath === entry.path
                      ? "bg-sidebar-hover text-white"
                      : "text-gray-300"
                  } ${entry.is_dir ? "cursor-default" : "cursor-pointer"}`}
                  onClick={() => {
                    if (!entry.is_dir) handleFileClick(entry.path);
                  }}
                  disabled={entry.is_dir}
                >
                  <span className="flex-shrink-0">
                    {entry.is_dir ? "📁" : entry.is_markdown ? "📝" : "📄"}
                  </span>
                  <span className="truncate">{entry.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
