import { Pencil, Trash2 } from "lucide-react";
import DarkCard from "../components/common/DarkCard";
import Empty from "../components/common/Empty";
import EditProblemSheet from "../components/problems/EditProblemSheet";

export default function ProblemsScreen({ app }) {
  if (!app.problems.length) return <Empty text="Nenhum problema registrado." />;

  return (
    <>
      <div className="space-y-3">
        {app.problems.map((problem) => {
        const linkedTask = app.tasks.find((task) => String(task.id) === String(problem.taskId));

        return (
          <DarkCard key={problem.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{problem.problem}</h3>
                <p className="text-xs text-slate-400">{problem.product || "Sem assunto"}</p>
                {problem.due && (
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Prazo: {problem.due.split("-").reverse().join("/")}
                  </p>
                )}
              </div>

              <div className="flex gap-1.5 shrink-0">
                <button
                  className="rounded-xl bg-slate-800 p-1.5 text-slate-400"
                  onClick={() => app.setEditingProblem(problem)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  className="rounded-xl bg-red-500/10 p-1.5 text-red-400"
                  onClick={() => app.deleteProblem(problem.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {linkedTask && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
                <p className="text-xs text-blue-300">Vinculado à atividade</p>
                <p className="text-sm text-white">{linkedTask.title}</p>
              </div>
            )}

            {problem.cause && (
              <p className="text-sm text-slate-300">
                <b>Causa:</b> {problem.cause}
              </p>
            )}

            {problem.action && (
              <p className="text-sm text-slate-300">
                <b>Ação:</b> {problem.action}
              </p>
            )}

            {problem.responsible && (
              <p className="text-sm text-slate-300">
                <b>Responsável:</b> {problem.responsible}
              </p>
            )}
          </DarkCard>
        );
      })}
      </div>

      {app.editingProblem && <EditProblemSheet app={app} />}
    </>
  );
}