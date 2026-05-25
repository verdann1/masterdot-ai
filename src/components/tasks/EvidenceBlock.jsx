import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EvidenceBlock({ app, task, compact = false }) {
  const evidences = task.evidences || [];

  if (compact && evidences.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Evidências
        </p>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-xl px-2 text-xs text-slate-300 hover:bg-slate-800"
          onClick={() => app.attachEvidence(task.id)}
        >
          <Camera className="mr-1 h-4 w-4" />
          Anexar
        </Button>
      </div>

      {evidences.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {evidences.map((evidence) => (
            <div key={evidence.id} className="relative overflow-hidden rounded-xl border border-slate-800">
              <img
                src={evidence.url || evidence.dataUrl}
                alt="Evidência"
                className="h-20 w-full object-cover"
              />

              <button
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                onClick={() => app.removeEvidence(task.id, evidence.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}