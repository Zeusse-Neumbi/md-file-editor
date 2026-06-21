import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Sidebar } from "../components/Sidebar";
import { useEditorStore } from "../stores/useEditorStore";

const mockOpenFile = vi.fn();

vi.mock("../stores/useEditorStore", () => ({
  useEditorStore: vi.fn(),
}));

describe("Sidebar", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when no workspace is open", () => {
    (vi.mocked(useEditorStore) as any).mockImplementation(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = { workspacePath: null };
        return selector ? selector(state as unknown as Record<string, unknown>) : state;
      }
    );
    const { container } = render(<Sidebar />);
    expect(container.innerHTML).toBe("");
  });

  it("renders file tree entries", () => {
    (vi.mocked(useEditorStore) as any).mockImplementation(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
          fileTree: [
            { name: "subdir", path: "/ws/subdir", is_dir: true, is_markdown: false },
            { name: "doc.md", path: "/ws/doc.md", is_dir: false, is_markdown: true },
            { name: "notes.txt", path: "/ws/notes.txt", is_dir: false, is_markdown: false },
          ],
          workspacePath: "/ws",
          isLoadingFileTree: false,
          currentFilePath: "/ws/doc.md",
          openFile: mockOpenFile,
        };
        return selector ? selector(state as unknown as Record<string, unknown>) : state;
      }
    );
    render(<Sidebar />);
    expect(screen.getByText("subdir")).toBeTruthy();
    expect(screen.getByText("doc.md")).toBeTruthy();
    expect(screen.getByText("notes.txt")).toBeTruthy();
  });

  it("highlights the currently open file", () => {
    (vi.mocked(useEditorStore) as any).mockImplementation(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
          fileTree: [
            { name: "subdir", path: "/ws/subdir", is_dir: true, is_markdown: false },
            { name: "doc.md", path: "/ws/doc.md", is_dir: false, is_markdown: true },
            { name: "notes.txt", path: "/ws/notes.txt", is_dir: false, is_markdown: false },
          ],
          workspacePath: "/ws",
          isLoadingFileTree: false,
          currentFilePath: "/ws/doc.md",
          openFile: mockOpenFile,
        };
        return selector ? selector(state as unknown as Record<string, unknown>) : state;
      }
    );
    render(<Sidebar />);
    const docButton = screen.getByText("doc.md").closest("button");
    expect(docButton?.className).toContain("bg-sidebar-hover");
  });

  it("calls openFile when clicking a markdown file", () => {
    (vi.mocked(useEditorStore) as any).mockImplementation(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
          fileTree: [
            { name: "subdir", path: "/ws/subdir", is_dir: true, is_markdown: false },
            { name: "doc.md", path: "/ws/doc.md", is_dir: false, is_markdown: true },
            { name: "notes.txt", path: "/ws/notes.txt", is_dir: false, is_markdown: false },
          ],
          workspacePath: "/ws",
          isLoadingFileTree: false,
          currentFilePath: null,
          openFile: mockOpenFile,
        };
        return selector ? selector(state as unknown as Record<string, unknown>) : state;
      }
    );
    render(<Sidebar />);
    fireEvent.click(screen.getByText("doc.md"));
    expect(mockOpenFile).toHaveBeenCalledWith("/ws/doc.md");
  });

  it("does not call openFile when clicking a directory", () => {
    (vi.mocked(useEditorStore) as any).mockImplementation(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
          fileTree: [
            { name: "subdir", path: "/ws/subdir", is_dir: true, is_markdown: false },
            { name: "doc.md", path: "/ws/doc.md", is_dir: false, is_markdown: true },
            { name: "notes.txt", path: "/ws/notes.txt", is_dir: false, is_markdown: false },
          ],
          workspacePath: "/ws",
          isLoadingFileTree: false,
          currentFilePath: null,
          openFile: mockOpenFile,
        };
        return selector ? selector(state as unknown as Record<string, unknown>) : state;
      }
    );
    render(<Sidebar />);
    fireEvent.click(screen.getByText("subdir"));
    expect(mockOpenFile).not.toHaveBeenCalled();
  });

  it("shows loading state", () => {
    (vi.mocked(useEditorStore) as any).mockImplementation(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
          fileTree: [],
          workspacePath: "/ws",
          isLoadingFileTree: true,
          currentFilePath: null,
          openFile: mockOpenFile,
        };
        return selector ? selector(state as unknown as Record<string, unknown>) : state;
      }
    );
    render(<Sidebar />);
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("shows empty state when no files", () => {
    (vi.mocked(useEditorStore) as any).mockImplementation(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
          fileTree: [],
          workspacePath: "/ws",
          isLoadingFileTree: false,
          currentFilePath: null,
          openFile: mockOpenFile,
        };
        return selector ? selector(state as unknown as Record<string, unknown>) : state;
      }
    );
    render(<Sidebar />);
    expect(screen.getByText("No markdown files found")).toBeTruthy();
  });
});
