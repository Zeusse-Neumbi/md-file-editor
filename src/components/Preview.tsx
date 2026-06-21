import { useRef, useState, useEffect, useCallback } from "react";
import { useEditorStore } from "../stores/useEditorStore";
import { renderMarkdown } from "../lib/markdown";
import "../styles/preview.css";

export function Preview() {
  const currentContent = useEditorStore((s) => s.currentContent);
  const [renderedHtml, setRenderedHtml] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePreview = useCallback((content: string) => {
    setRenderedHtml(renderMarkdown(content));
  }, []);

  // Debounce preview updates (200ms)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      updatePreview(currentContent);
    }, 200);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [currentContent, updatePreview]);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white">
      <div
        className="md-preview"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}
