import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Editor } from "../components/Editor";

// Mock the store
vi.mock("../stores/useEditorStore", () => ({
  useEditorStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      currentContent: "# Test",
      updateContent: vi.fn(),
      saveFile: vi.fn(),
    };
    return selector ? selector(state as unknown as Record<string, unknown>) : state;
  }),
}));

describe("Editor", () => {
  it("renders without crashing", () => {
    const { container } = render(<Editor />);
    // CodeMirror creates a .cm-editor element
    expect(container.querySelector(".cm-editor")).toBeTruthy();
  });
});
