import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEditorStore } from "../stores/useEditorStore";

// Mock the IPC module
vi.mock("../lib/ipc", () => ({
  openFile: vi.fn(),
  saveFile: vi.fn(),
  openDirectory: vi.fn(),
  checkFileStatus: vi.fn(),
}));

import * as ipc from "../lib/ipc";

describe("useEditorStore", () => {
  beforeEach(() => {
    useEditorStore.setState({
      currentFilePath: null,
      currentContent: "",
      savedContent: "",
      isModified: false,
      workspacePath: null,
      fileTree: [],
      isLoadingFileTree: false,
      isSidebarOpen: true,
      isAutosaveEnabled: true,
      saveStatus: "saved",
      toastMessage: null,
      toastType: "info",
    });
    vi.clearAllMocks();
  });

  it("should have initial state", () => {
    const state = useEditorStore.getState();
    expect(state.currentFilePath).toBeNull();
    expect(state.currentContent).toBe("");
    expect(state.isModified).toBe(false);
    expect(state.saveStatus).toBe("saved");
    expect(state.isAutosaveEnabled).toBe(true);
  });

  it("should update content and mark as modified", () => {
    useEditorStore.getState().updateContent("new content");
    const state = useEditorStore.getState();
    expect(state.currentContent).toBe("new content");
    expect(state.isModified).toBe(true);
    expect(state.saveStatus).toBe("unsaved");
  });

  it("should mark as saved when content matches savedContent", () => {
    useEditorStore.setState({ savedContent: "same", currentContent: "same" });
    useEditorStore.getState().updateContent("same");
    const state = useEditorStore.getState();
    expect(state.isModified).toBe(false);
    expect(state.saveStatus).toBe("saved");
  });

  it("should open file and populate state", async () => {
    const mockFileState = {
      path: "/test/file.md",
      content: "# Hello",
      is_modified: false,
    };
    vi.mocked(ipc.openFile).mockResolvedValue(mockFileState);

    await useEditorStore.getState().openFile("/test/file.md");

    const state = useEditorStore.getState();
    expect(state.currentFilePath).toBe("/test/file.md");
    expect(state.currentContent).toBe("# Hello");
    expect(state.savedContent).toBe("# Hello");
    expect(state.isModified).toBe(false);
    expect(state.saveStatus).toBe("saved");
  });

  it("should show toast on openFile error", async () => {
    vi.mocked(ipc.openFile).mockRejectedValue("File not found");

    await useEditorStore.getState().openFile("/bad/file.md");

    const state = useEditorStore.getState();
    expect(state.toastMessage).toBe("File not found");
    expect(state.toastType).toBe("error");
  });

  it("should save file and update state", async () => {
    useEditorStore.setState({
      currentFilePath: "/test/file.md",
      currentContent: "# Saved",
    });
    vi.mocked(ipc.saveFile).mockResolvedValue(undefined);

    await useEditorStore.getState().saveFile();

    const state = useEditorStore.getState();
    expect(state.saveStatus).toBe("saved");
    expect(state.savedContent).toBe("# Saved");
    expect(state.isModified).toBe(false);
  });

  it("should show toast on saveFile error", async () => {
    useEditorStore.setState({
      currentFilePath: "/test/file.md",
      currentContent: "# Content",
    });
    vi.mocked(ipc.saveFile).mockRejectedValue("Permission denied");

    await useEditorStore.getState().saveFile();

    const state = useEditorStore.getState();
    expect(state.saveStatus).toBe("error");
    expect(state.toastMessage).toBe("Permission denied");
  });

  it("should open directory and populate file tree", async () => {
    const mockEntries = [
      { name: "subdir", path: "/ws/subdir", is_dir: true, is_markdown: false },
      { name: "doc.md", path: "/ws/doc.md", is_dir: false, is_markdown: true },
    ];
    vi.mocked(ipc.openDirectory).mockResolvedValue(mockEntries);

    await useEditorStore.getState().openDirectory("/ws");

    const state = useEditorStore.getState();
    expect(state.workspacePath).toBe("/ws");
    expect(state.fileTree).toEqual(mockEntries);
    expect(state.isSidebarOpen).toBe(true);
  });

  it("should toggle sidebar", () => {
    useEditorStore.getState().setSidebarOpen(false);
    expect(useEditorStore.getState().isSidebarOpen).toBe(false);

    useEditorStore.getState().setSidebarOpen(true);
    expect(useEditorStore.getState().isSidebarOpen).toBe(true);
  });

  it("should toggle autosave", () => {
    useEditorStore.getState().setAutosaveEnabled(false);
    expect(useEditorStore.getState().isAutosaveEnabled).toBe(false);

    useEditorStore.getState().setAutosaveEnabled(true);
    expect(useEditorStore.getState().isAutosaveEnabled).toBe(true);
  });

  it("should show and auto-dismiss toast", async () => {
    vi.useFakeTimers();
    useEditorStore.getState().showToast("Test message", "success");
    expect(useEditorStore.getState().toastMessage).toBe("Test message");
    expect(useEditorStore.getState().toastType).toBe("success");

    vi.advanceTimersByTime(4000);
    expect(useEditorStore.getState().toastMessage).toBeNull();
    vi.useRealTimers();
  });

  it("should dismiss toast manually", () => {
    useEditorStore.getState().showToast("Message");
    useEditorStore.getState().dismissToast();
    expect(useEditorStore.getState().toastMessage).toBeNull();
  });
});
