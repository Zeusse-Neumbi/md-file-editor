import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Preview } from "../components/Preview";

const mockState = { currentContent: "# Hello Preview" };

vi.mock("../stores/useEditorStore", () => ({
  useEditorStore: vi.fn(
    (selector?: (s: Record<string, unknown>) => unknown) => {
      return selector
        ? selector(mockState as unknown as Record<string, unknown>)
        : mockState;
    }
  ),
}));

describe("Preview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders markdown after debounce", () => {
    render(<Preview />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText("Hello Preview")).toBeTruthy();
  });

  it("renders empty content", () => {
    mockState.currentContent = "";
    const { container } = render(<Preview />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const previewDiv = container.querySelector(".md-preview");
    expect(previewDiv?.innerHTML).toBe("");
  });
});
