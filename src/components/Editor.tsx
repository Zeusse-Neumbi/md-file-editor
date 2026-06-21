import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { useEditorStore } from "../stores/useEditorStore";

export function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const currentContent = useEditorStore((s) => s.currentContent);
  const updateContent = useEditorStore((s) => s.updateContent);
  const saveFile = useEditorStore((s) => s.saveFile);

  const handleSave = useCallback(() => {
    saveFile();
  }, [saveFile]);

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        updateContent(content);
      }
    });

    const saveKeymap = keymap.of([
      {
        key: "Mod-s",
        run: () => {
          handleSave();
          return true;
        },
      },
      ...defaultKeymap,
      ...historyKeymap,
    ]);

    const state = EditorState.create({
      doc: currentContent,
      extensions: [
        markdown({ base: markdownLanguage }),
        oneDark,
        history(),
        saveKeymap,
        updateListener,
        placeholder("Start writing Markdown..."),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only initialize once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external content changes to CodeMirror (e.g., file open)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentContent !== currentDoc) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: currentContent,
        },
      });
    }
  }, [currentContent]);

  return (
    <div className="flex-1 h-full overflow-hidden">
      <div ref={editorRef} className="h-full" />
    </div>
  );
}
