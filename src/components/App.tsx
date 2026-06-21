import { useEffect, useCallback, useRef } from "react";
import { SplitPane } from "./SplitPane";
import { Editor } from "./Editor";
import { Preview } from "./Preview";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { Toast } from "./Toast";
import { useEditorStore } from "../stores/useEditorStore";

export function App() {
  const workspacePath = useEditorStore((s) => s.workspacePath);
  const currentFilePath = useEditorStore((s) => s.currentFilePath);
  const openFile = useEditorStore((s) => s.openFile);
  const openDirectory = useEditorStore((s) => s.openDirectory);
  const saveFile = useEditorStore((s) => s.saveFile);
  const isAutosaveEnabled = useEditorStore((s) => s.isAutosaveEnabled);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave: when content changes and is modified, set a 1500ms debounce
  const isModified = useEditorStore((s) => s.isModified);
  const currentContent = useEditorStore((s) => s.currentContent);

  useEffect(() => {
    if (!isAutosaveEnabled || !isModified || !currentFilePath) return;

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = setTimeout(() => {
      saveFile();
    }, 1500);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [currentContent, isModified, isAutosaveEnabled, currentFilePath, saveFile]);

  // Drag and drop handler
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const first = files[0];
      if (first.name.endsWith(".md")) {
        const path = (first as any).path;
        if (path) {
          await openFile(path);
        }
      }
    },
    [openFile]
  );

  // Listen for Tauri drag-drop events
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function setup() {
      const { listen } = await import("@tauri-apps/api/event");
      unlisten = await listen<{ paths: string[] }>("tauri://drag-drop", (event) => {
        const paths = event.payload.paths;
        if (paths.length === 0) return;

        const first = paths[0];
        const isDir = !first.includes(".");
        if (isDir) {
          openDirectory(first);
        } else if (first.endsWith(".md")) {
          openFile(first);
        }
      });
    }

    setup();

    return () => {
      if (unlisten) unlisten();
    };
  }, [openFile, openDirectory]);

  // Listen for unsaved changes on window close
  useEffect(() => {
    async function setup() {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();

      await win.onCloseRequested(async (event) => {
        const state = useEditorStore.getState();
        if (state.isModified) {
          event.preventDefault();
          const { ask } = await import("@tauri-apps/plugin-dialog");
          const answer = await ask(
            "You have unsaved changes. Do you want to save before closing?",
            {
              title: "Unsaved Changes",
              kind: "warning",
            }
          );
          if (answer) {
            await state.saveFile();
          }
          win.close();
        }
      });
    }

    setup();
  }, []);

  return (
    <div
      className="h-screen flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        {workspacePath && <Sidebar />}

        <SplitPane
          left={<Editor />}
          right={<Preview />}
          defaultLeftSize={55}
        />
      </div>

      <Toast />
    </div>
  );
}
