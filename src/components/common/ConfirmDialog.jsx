import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ message, title = "Confirmar", onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") onConfirm();
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <div className="rounded-xl bg-red-500/15 p-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-slate-400">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-slate-800 py-3 text-sm font-medium text-slate-300 active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white active:scale-95"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
