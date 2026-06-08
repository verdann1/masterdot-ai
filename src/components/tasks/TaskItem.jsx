import { AlertTriangle, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateBR } from "../../utils/dateUtils";
import {
  priorityBorder,
  priorityColor,
  getDueState,
  isLate,
  progressColor,
} from "./taskStyles";

function checklistInfo(task) {
  const list = task.checklist || [];
  if (!list.length) return null;
  const done = list.filter((item) => item.done).length;
  return { done, total: list.length, pct: Math.round((done / list.length) * 100) };
}

const STATUS_DOT = {
  "Concluído":     "bg-emerald-400",
  "Em andamento":  "bg-blue-400",
  "Aguardando":    "bg-purple-400",
  "Aberto":        "bg-amber-400",
};

export default function TaskItem({ app, task, compact, child = false }) {
  const late = isLate(task);
  const critical = task.priority === "Alta" && task.status !== "Concluído";
  const checklist = checklistInfo(task);
  const dueState = getDueState(task);
  const done = task.status === "Concluído";

  // Show bar only when there's meaningful progress (> 0) or checklist data
  const progressPct =
    typeof task.progress === "number" && task.progress > 0
      ? task.progress
      : checklist
      ? checklist.pct
      : null;

  return (
    <button
      type="button"
      onClick={() => app.setSelectedTaskId(task.id)}
      className={`w-full rounded-2xl border bg-slate-900 p-3 text-left shadow-sm transition-opacity ${
        priorityBorder(task.priority, task.status)
      } ${done ? "opacity-60" : ""} ${critical ? "master-critical" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[task.status] ?? "bg-slate-600"} ${
            late && !done ? "animate-pulse" : ""
          }`}
        />

        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`${child ? "text-sm" : "text-sm"} font-semibold leading-snug ${
                done ? "text-slate-500 line-through" : "text-white"
              }`}
            >
              {task.title}
            </h3>
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
          </div>

          {/* Project + responsibles */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {task.project && (
              <span className="text-[11px] text-slate-500">{task.project}</span>
            )}
            {(() => {
              const list = Array.isArray(task.responsibles) && task.responsibles.length
                ? task.responsibles
                : task.responsible
                ? [task.responsible]
                : [];
              if (!list.length) return null;
              return (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <User className="h-2.5 w-2.5" />
                  {list.slice(0, 2).join(", ")}
                  {list.length > 2 && ` +${list.length - 2}`}
                </span>
              );
            })()}
          </div>

          {/* Progress bar — show if has explicit progress or checklist */}
          {progressPct !== null && !done && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-slate-600">
                  {checklist && typeof task.progress !== "number"
                    ? `Checklist ${checklist.done}/${checklist.total}`
                    : "Progresso"}
                </span>
                <span className="text-[10px] font-medium text-slate-400">{progressPct}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${progressColor(progressPct)}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Badges row */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge className={`rounded-full border text-[10px] px-2 py-0 h-5 ${dueState.className}`}>
              {dueState.label}
            </Badge>

            {task.endDate && (
              <span className="text-[10px] text-slate-600">
                {formatDateBR(task.endDate)}
              </span>
            )}

            {critical && (
              <Badge className="h-5 rounded-full border border-red-500/40 bg-red-500/20 px-2 py-0 text-[10px] text-red-300">
                <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                Alta
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
