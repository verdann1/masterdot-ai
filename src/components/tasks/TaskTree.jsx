import { ChevronDown, ChevronRight } from "lucide-react";
import Empty from "../common/Empty";
import TaskItem from "./TaskItem";
import { priorityBorder, isLate } from "./taskStyles";

export default function TaskTree({ app, tasks, compact = false }) {
  if (!tasks.length) return <Empty text="Nenhuma atividade encontrada." />;

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const children = app.getChildren(task.id);
        const progress = app.getProgress(task.id);
        const late = isLate(task);
        const critical = task.priority === "Alta" && task.status !== "Concluído";

        const hasChildren = children.length > 0;
        const expanded =
          app.expandedTaskIds?.includes(task.id) ||
          children.some((child) => isLate(child));

        return (
          <div
            key={task.id}
            className={`rounded-3xl border bg-slate-900 p-4 shadow-sm ${
              priorityBorder(task.priority, task.status)
            } ${late ? "ring-1 ring-red-500/40" : ""} ${
              critical ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-start gap-2">
              {hasChildren && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    app.toggleTaskExpanded(task.id);
                  }}
                  className="mt-1 rounded-xl bg-slate-950 p-2 text-slate-400"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}

              <div className="min-w-0 flex-1">
                <TaskItem
                  app={app}
                  task={task}
                  progress={progress}
                  compact={compact}
                />

                {hasChildren && (
                  <div className="mt-2 text-xs text-slate-500">
                    {children.length} subatividade(s) • {progress.percent}% concluído
                  </div>
                )}
              </div>
            </div>

            {hasChildren && expanded && (
              <div className="mt-3 space-y-2 border-l-2 border-slate-800 pl-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className={`rounded-2xl border bg-slate-950 p-3 ${priorityBorder(
                      child.priority,
                      child.status
                    )}`}
                  >
                    <TaskItem app={app} task={child} compact={compact} child />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}