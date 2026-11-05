import { useEffect, useCallback, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { SplitPane } from "./SplitPane";
import { Editor } from "./Editor";
import { Preview } from "./Preview";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { Toast } from "./Toast";
import { useEditorStore } from "../stores/useEditorStore";
import { pickFile, pickFolder } from "../lib/filePicker";

export function App() {
  const workspacePath = useEditorStore((s) => s.workspacePath);
  const isSidebarOpen = useEditorStore((s) => s.isSidebarOpen);
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

  // Keyboard shortcuts for the same actions exposed in the title bar.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;

      const key = event.key.toLowerCase();
      if (key === "o") {
        event.preventDefault();
        if (event.shiftKey) {
          void pickFolder();
        } else {
          void pickFile();
        }
      }

      if (key === "b" && !event.shiftKey) {
        event.preventDefault();
        const state = useEditorStore.getState();
        state.setSidebarOpen(!state.isSidebarOpen);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for Tauri drag-drop events
  useEffect(() => {
    if (!isTauri()) return;

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
    if (!isTauri()) return;

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
        {workspacePath && isSidebarOpen && <Sidebar />}

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
