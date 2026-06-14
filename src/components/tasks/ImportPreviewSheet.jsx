import { X, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImportPreviewSheet({ app }) {
  const preview = app.importPreview;

  if (!preview) return null;

  const sample = preview.importedTasks.slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[36px] border-t border-slate-800 bg-slate-950 p-4 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
              <FileSpreadsheet className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Pré-visualização da importação
              </h2>

              <p className="text-xs text-slate-500">
                {preview.fileName}
              </p>
            </div>
          </div>

          <button
            onClick={() => app.setImportPreview(null)}
            className="rounded-2xl bg-slate-900 p-2 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-900 p-3 text-center">
            <p className="text-xs text-slate-500">Novas</p>
            <p className="text-xl font-bold text-emerald-300">
              {preview.createdTasks}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-3 text-center">
            <p className="text-xs text-slate-500">Atualizadas</p>
            <p className="text-xl font-bold text-blue-300">
              {preview.updatedTasks}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-3 text-center">
            <p className="text-xs text-slate-500">Projetos</p>
            <p className="text-xl font-bold text-orange-300">
              {preview.createdProjects}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-900 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Amostra das atividades
          </p>

          <div className="space-y-2">
            {sample.map((task) => (
              <div
                key={`${task.project}-${task.title}-${task.id}`}
                className="rounded-xl border border-slate-800 bg-slate-950 p-3"
              >
                <p className="text-sm font-semibold text-white">
                  {task.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {task.project} • {task.responsible || "Sem responsável"}
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  {task.startDate || "-"} → {task.endDate || "-"}
                </p>
              </div>
            ))}
          </div>

          {preview.importedTasks.length > sample.length && (
            <p className="mt-3 text-xs text-slate-500">
              + {preview.importedTasks.length - sample.length} atividade(s)
              além da amostra.
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-slate-700 bg-slate-900 text-slate-100"
            onClick={() => app.setImportPreview(null)}
          >
            Cancelar
          </Button>

          <Button
            disabled={app.importingExcel}
            className="h-11 rounded-2xl bg-emerald-500 text-white disabled:opacity-60"
            onClick={app.confirmImportActivities}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {app.importingExcel ? "Importando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}