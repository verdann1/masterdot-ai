import { useState } from "react";
import { Camera, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EvidenceBlock({ app, task, compact = false }) {
  const [viewerImage, setViewerImage] = useState(null);
  const evidences = task.evidences || [];

  if (compact && evidences.length === 0) return null;

  return (
    <>
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

        {evidences.length === 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Nenhuma evidência anexada.
          </p>
        )}

        {evidences.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {evidences.map((evidence) => {
              const imageSrc = evidence.url || evidence.dataUrl || "";

              return (
                <div
                  key={evidence.id}
                  className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
                >
                  {imageSrc ? (
                    <button
                      onClick={() => setViewerImage(imageSrc)}
                      className="block w-full"
                    >
                      <img
                        src={imageSrc}
                        alt="Evidência"
                        className="h-24 w-full object-cover"
                      />

                      <div className="absolute bottom-1 left-1 rounded-full bg-black/70 p-1 text-white">
                        <Eye className="h-3 w-3" />
                      </div>
                    </button>
                  ) : (
                    <div className="flex h-24 items-center justify-center text-xs text-slate-500">
                      Sem preview
                    </div>
                  )}

                  <button
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                    onClick={() => app.removeEvidence(task.id, evidence.id)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewerImage && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setViewerImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white"
          >
            <X className="h-6 w-6" />
          </button>

          <img
            src={viewerImage}
            alt="Evidência ampliada"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </>
  );
}