import { memo, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { AlertTriangle, User, ChevronRight, CheckCircle2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateBR } from "../../utils/dateUtils";
import {
  priorityBorder,
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
  "Concluído":    "bg-emerald-400",
  "Em andamento": "bg-blue-400",
  "Aguardando":   "bg-purple-400",
  "Aberto":       "bg-amber-400",
};

const PRIORITY_STRIP = {
  "Alta":  "bg-red-500",
  "Média": "bg-orange-400",
  "Baixa": "bg-slate-700",
};

const SWIPE_THRESHOLD = 90;

function TaskItem({ app, task }) {
  const late      = isLate(task);
  const critical  = task.priority === "Alta" && task.status !== "Concluído";
  const checklist = checklistInfo(task);
  const dueState  = getDueState(task);
  const done      = task.status === "Concluído";

  const progressPct =
    typeof task.progress === "number" && task.progress > 0
      ? task.progress
      : checklist
      ? checklist.pct
      : null;

  // ── Swipe gesture ────────────────────────────────────────────────────────
  const x           = useMotionValue(0);
  const isDragging  = useRef(false);

  const completeOpacity = useTransform(x, [0, 40, SWIPE_THRESHOLD], [0, 0.6, 1]);
  const deleteOpacity   = useTransform(x, [-SWIPE_THRESHOLD, -40, 0], [1, 0.6, 0]);
  const cardScale       = useTransform(x, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [0.97, 1, 0.97]);

  function handleDragEnd(_, info) {
    isDragging.current = false;
    const ox = info.offset.x;

    if (ox > SWIPE_THRESHOLD) {
      // Right → toggle complete
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
      app.updateTaskStatus(task.id, done ? "Aberto" : "Concluído");
    } else if (ox < -SWIPE_THRESHOLD) {
      // Left → delete
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
      app.deleteTask(task.id);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Complete hint (green, revealed on right swipe) */}
      <motion.div
        className="absolute inset-0 flex items-center rounded-2xl bg-emerald-500 pl-5"
        style={{ opacity: completeOpacity }}
        aria-hidden
      >
        <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2.5} />
        <span className="ml-2 text-sm font-bold text-white">
          {done ? "Reabrir" : "Concluir"}
        </span>
      </motion.div>

      {/* Delete hint (red, revealed on left swipe) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end rounded-2xl bg-red-500 pr-5"
        style={{ opacity: deleteOpacity }}
        aria-hidden
      >
        <span className="mr-2 text-sm font-bold text-white">Excluir</span>
        <Trash2 className="h-6 w-6 text-white" strokeWidth={2.5} />
      </motion.div>

      {/* Card — draggable */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -SWIPE_THRESHOLD * 1.3, right: SWIPE_THRESHOLD * 1.3 }}
        dragElastic={0.08}
        style={{ x, scale: cardScale }}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={handleDragEnd}
        className="relative"
      >
        <button
          type="button"
          onClick={() => {
            if (!isDragging.current) app.setSelectedTaskId(task.id);
          }}
          className={`relative w-full overflow-hidden rounded-2xl border bg-slate-900/90 p-3 pl-4 text-left shadow-sm transition-all active:scale-[0.99] ${
            priorityBorder(task.priority, task.status)
          } ${done ? "opacity-55" : ""} ${critical ? "master-critical" : ""}`}
        >
          {/* Priority strip */}
          <div
            className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-colors ${
              done ? "bg-emerald-500/50" : PRIORITY_STRIP[task.priority] ?? "bg-slate-700"
            }`}
          />

          <div className="flex items-start gap-3">
            {/* Status dot */}
            <span
              className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[task.status] ?? "bg-slate-600"} ${
                late && !done ? "animate-pulse" : ""
              }`}
            />

            <div className="min-w-0 flex-1">
              {/* Title */}
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-sm font-semibold leading-snug ${done ? "text-slate-500 line-through" : "text-white"}`}>
                  {task.title}
                </h3>
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-700" />
              </div>

              {/* Project + responsible */}
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

              {/* Progress bar */}
              {progressPct !== null && !done && (
                <div className="mt-2">
                  <div className="mb-0.5 flex items-center justify-between">
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

              {/* Badges */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge className={`h-5 rounded-full border px-2 py-0 text-[10px] ${dueState.className}`}>
                  {dueState.label}
                </Badge>

                {task.endDate && (
                  <span className="text-[10px] text-slate-600">{formatDateBR(task.endDate)}</span>
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
      </motion.div>
    </div>
  );
}

// Re-renders only when the specific task object changes (immutable updates guarantee stable refs for unchanged tasks)
export default memo(TaskItem, (prev, next) =>
  prev.task === next.task &&
  prev.compact === next.compact &&
  prev.child === next.child
);
