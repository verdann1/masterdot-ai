import { CheckCircle2, ListTree, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InfoBox from "../common/InfoBox";
import CommentBlock from "./CommentBlock";
import EvidenceBlock from "./EvidenceBlock";
import { formatDateBR } from "../../utils/dateUtils";
import { priorityColor, statusColor } from "./taskStyles";

export default function TaskItem({ app, task, progress, compact, child = false }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 gap-2">
          <ListTree className="mt-1 h-4 w-4 shrink-0 text-slate-400" />

          <div className="min-w-0">
            <h3 className={`${child ? "text-sm" : ""} font-semibold leading-tight text-white`}>{task.title}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {task.project} • {task.responsible || "Sem responsável"}
            </p>
            <p className="text-xs text-slate-500">
              {formatDateBR(task.startDate)} → {formatDateBR(task.endDate)}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-slate-400"
          onClick={() => app.deleteTask(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {task.notes && !compact && <InfoBox title="Descritivo" text={task.notes} />}
      {task.progressComment && <InfoBox title="Último andamento" text={task.progressComment} />}
      {task.aiReason && <InfoBox title="IA local" text={task.aiReason} small />}

      {!compact && <CommentBlock app={app} task={task} compact />}
      {!compact && <EvidenceBlock app={app} task={task} compact />}

      <div className="flex flex-wrap gap-2">
        <Badge className={`rounded-full border ${priorityColor(task.priority)}`}>{task.priority}</Badge>
        <Badge className={`rounded-full border ${statusColor(task.status)}`}>{task.status}</Badge>

        {progress && (
          <Badge variant="outline" className="rounded-full border-slate-700 text-slate-300">
            {progress.done}/{progress.total} • {progress.percent}%
          </Badge>
        )}
      </div>

      {progress?.total > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-slate-100" style={{ width: `${progress.percent}%` }} />
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 pt-1">
        <Button
          variant="outline"
          className="h-10 rounded-2xl border-slate-700 bg-slate-950 text-slate-100"
          onClick={() => app.setSelectedTaskId(task.id)}
        >
          Ver
        </Button>

        <Button
          variant="outline"
          className="h-10 rounded-2xl border-slate-700 bg-slate-950 text-slate-100"
          onClick={() => app.setEditingTask(task)}
        >
          <Pencil className="mr-1 h-4 w-4" />
          Editar
        </Button>

        {task.status !== "Concluído" ? (
          <Button
            variant="outline"
            className="h-10 rounded-2xl border-slate-700 bg-slate-950 text-slate-100"
            onClick={() => app.updateTaskStatus(task.id, "Concluído")}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            OK
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-10 rounded-2xl border-slate-700 bg-slate-950 text-slate-100"
            onClick={() => app.updateTaskStatus(task.id, "Aberto")}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Abrir
          </Button>
        )}

        <Button
          variant="outline"
          className="h-10 rounded-2xl border-slate-700 bg-slate-950 text-slate-100"
          onClick={() => app.updateTaskStatus(task.id, "Em andamento")}
        >
          And.
        </Button>
      </div>
    </div>
  );
}