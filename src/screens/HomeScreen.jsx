import { Download, Gauge } from "lucide-react";
import TodayOperationsPanel from "../components/dashboard/TodayOperationsPanel";
import GanttPreview from "../components/dashboard/GanttPreview";

function progress(tasks) {
  if (!tasks.length) return 0;

  const done = tasks.filter((task) => task.status === "Concluído").length;

  return Math.round((done / tasks.length) * 100);
}

export default function HomeScreen({ app }) {
  const percent = progress(app.tasks);

  return (
    <div className="space-y-4">
      <div className="rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950 p-5 shadow-xl shadow-black/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
              Master DOT
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Painel operacional
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Controle dos vencimentos, atrasos e prioridades do dia.
            </p>
          </div>

          <div className="rounded-3xl bg-cyan-500/15 p-3 text-cyan-300">
            <Gauge className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-slate-400">Progresso geral</p>
            <p className="text-sm font-bold text-white">{percent}%</p>
          </div>

          <div className="h-4 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <button
          onClick={app.exportExecutiveExcel}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-slate-950"
        >
          <Download className="h-4 w-4" />
          Exportar relatório executivo
        </button>
      </div>

      <TodayOperationsPanel app={app} />

      <GanttPreview tasks={app.tasks} />

    </div>
  );
}