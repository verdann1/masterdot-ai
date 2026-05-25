import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InfoBox from "../common/InfoBox";
import CommentBlock from "./CommentBlock";
import EvidenceBlock from "./EvidenceBlock";
import ChecklistBlock from "./ChecklistBlock";
import { formatDateBR } from "../../utils/dateUtils";
import { priorityColor, statusColor } from "./taskStyles";

export default function TaskDetailSheet({ app }) {
  const task = app.tasks.find((item) => item.id === app.selectedTaskId);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70">
      <div className="absolute bottom-0 left-1/2 max-h-[92vh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-[2rem] border border-slate-800 bg-slate-900 p-4 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Detalhes da atividade</p>
            <h2 className="text-lg font-bold text-white">{task.title}</h2>
            <p className="mt-1 text-xs text-slate-400">
              {task.project} • {task.responsible || "Sem responsável"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300"
            onClick={() => app.setSelectedTaskId(null)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge className={`rounded-full border ${priorityColor(task.priority)}`}>{task.priority}</Badge>
            <Badge className={`rounded-full border ${statusColor(task.status)}`}>{task.status}</Badge>
            <Badge variant="outline" className="rounded-full border-slate-700 text-slate-300">
              {formatDateBR(task.startDate)} → {formatDateBR(task.endDate)}
            </Badge>
          </div>

          {task.notes && <InfoBox title="Descritivo" text={task.notes} />}
          {task.progressComment && <InfoBox title="Último andamento" text={task.progressComment} />}
          {task.aiReason && <InfoBox title="IA local" text={task.aiReason} small />}

          <ChecklistBlock app={app} task={task} />
          <CommentBlock app={app} task={task} />
          <EvidenceBlock app={app} task={task} />

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="rounded-2xl border-slate-700 bg-slate-950 text-slate-100"
              onClick={() => app.setEditingTask(task)}
            >
              Editar
            </Button>

            {task.status !== "Concluído" ? (
              <Button
                variant="outline"
                className="rounded-2xl border-slate-700 bg-slate-950 text-slate-100"
                onClick={() => app.updateTaskStatus(task.id, "Concluído")}
              >
                Concluir
              </Button>
            ) : (
              <Button
                variant="outline"
                className="rounded-2xl border-slate-700 bg-slate-950 text-slate-100"
                onClick={() => app.updateTaskStatus(task.id, "Aberto")}
              >
                Reabrir
              </Button>
            )}

            <Button
              variant="outline"
              className="rounded-2xl border-slate-700 bg-slate-950 text-slate-100"
              onClick={() => app.deleteTask(task.id)}
            >
              Excluir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}