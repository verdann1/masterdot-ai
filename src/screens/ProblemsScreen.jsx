import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DarkCard from "../components/common/DarkCard";
import Empty from "../components/common/Empty";

export default function ProblemsScreen({ app }) {
  if (!app.problems.length) return <Empty text="Nenhum problema registrado." />;

  return (
    <div className="space-y-3">
      {app.problems.map((problem) => {
        const linkedTask = app.tasks.find((task) => String(task.id) === String(problem.taskId));

        return (
          <DarkCard key={problem.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{problem.problem}</h3>
                <p className="text-xs text-slate-400">{problem.product || "Sem assunto"}</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400"
                onClick={() => app.deleteProblem(problem.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {linkedTask && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                <p className="text-xs text-cyan-300">Vinculado à atividade</p>
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
  );
}