import { useEditorStore } from "../stores/useEditorStore";

const bgColorMap: Record<string, string> = {
  info: "bg-toast-bg",
  error: "bg-status-error",
  success: "bg-status-saved",
};

export function Toast() {
  const message = useEditorStore((s) => s.toastMessage);
  const type = useEditorStore((s) => s.toastType);
  const dismissToast = useEditorStore((s) => s.dismissToast);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-white text-sm cursor-pointer z-50 ${bgColorMap[type] || bgColorMap.info}`}
      onClick={dismissToast}
      role="alert"
    >
      {message}
    </div>
  );
}
