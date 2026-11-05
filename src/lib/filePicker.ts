import { open } from "@tauri-apps/plugin-dialog";
import { useEditorStore } from "../stores/useEditorStore";

function describeError(error: unknown): string {
  return typeof error === "string" ? error : "Could not open the file picker";
}

export async function pickFile(): Promise<void> {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
    });

    if (typeof selected === "string") {
      await useEditorStore.getState().openFile(selected);
    }
  } catch (error) {
    useEditorStore.getState().showToast(describeError(error), "error");
  }
}

export async function pickFolder(): Promise<void> {
  try {
    const selected = await open({ directory: true, multiple: false });

    if (typeof selected === "string") {
      await useEditorStore.getState().openDirectory(selected);
    }
  } catch (error) {
    useEditorStore.getState().showToast(describeError(error), "error");
  }
}
