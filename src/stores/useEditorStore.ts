import { create } from "zustand";
import * as ipc from "../lib/ipc";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface EditorStore {
  // File
  currentFilePath: string | null;
  currentContent: string;
  savedContent: string;
  isModified: boolean;

  // Workspace
  workspacePath: string | null;
  fileTree: ipc.FileEntry[];
  isLoadingFileTree: boolean;

  // UI
  isSidebarOpen: boolean;
  isAutosaveEnabled: boolean;
  saveStatus: SaveStatus;
  toastMessage: string | null;
  toastType: "info" | "error" | "success";

  // Actions
  openFile: (path: string) => Promise<void>;
  saveFile: () => Promise<void>;
  openDirectory: (path: string) => Promise<void>;
  updateContent: (content: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setAutosaveEnabled: (enabled: boolean) => void;
  showToast: (message: string, type?: "info" | "error" | "success") => void;
  dismissToast: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // File
  currentFilePath: null,
  currentContent: "",
  savedContent: "",
  isModified: false,

  // Workspace
  workspacePath: null,
  fileTree: [],
  isLoadingFileTree: false,

  // UI
  isSidebarOpen: true,
  isAutosaveEnabled: true,
  saveStatus: "saved",
  toastMessage: null,
  toastType: "info",

  // Actions
  openFile: async (path: string) => {
    try {
      const state = await ipc.openFile(path);
      set({
        currentFilePath: state.path,
        currentContent: state.content,
        savedContent: state.content,
        isModified: false,
        saveStatus: "saved",
      });
    } catch (err) {
      const message = typeof err === "string" ? err : "Failed to open file";
      get().showToast(message, "error");
    }
  },

  saveFile: async () => {
    const { currentFilePath, currentContent } = get();
    if (!currentFilePath) return;

    set({ saveStatus: "saving" });
    try {
      await ipc.saveFile(currentFilePath, currentContent);
      set({
        savedContent: currentContent,
        isModified: false,
        saveStatus: "saved",
      });
    } catch (err) {
      const message = typeof err === "string" ? err : "Failed to save file";
      set({ saveStatus: "error" });
      get().showToast(message, "error");
    }
  },

  openDirectory: async (path: string) => {
    set({ isLoadingFileTree: true });
    try {
      const entries = await ipc.openDirectory(path);
      set({
        workspacePath: path,
        fileTree: entries,
        isSidebarOpen: true,
        isLoadingFileTree: false,
      });
    } catch (err) {
      const message = typeof err === "string" ? err : "Failed to open directory";
      set({ isLoadingFileTree: false });
      get().showToast(message, "error");
    }
  },

  updateContent: (content: string) => {
    const { savedContent } = get();
    set({
      currentContent: content,
      isModified: content !== savedContent,
      saveStatus: content !== savedContent ? "unsaved" : "saved",
    });
  },

  setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),

  setAutosaveEnabled: (enabled: boolean) => set({ isAutosaveEnabled: enabled }),

  showToast: (message: string, type: "info" | "error" | "success" = "info") => {
    set({ toastMessage: message, toastType: type });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 4000);
  },

  dismissToast: () => set({ toastMessage: null }),
}));
