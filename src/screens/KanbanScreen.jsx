import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateBR } from "../utils/dateUtils";
import { getDueState, priorityColor } from "../components/tasks/taskStyles";

const columns = [
  { id: "Aberto",       title: "Aberto",       dot: "bg-amber-400",   border: "border-amber-500/25",   bg: "bg-amber-500/5"   },
  { id: "Em andamento", title: "Em andamento", dot: "bg-blue-400",    border: "border-blue-500/25",    bg: "bg-blue-500/5"    },
  { id: "Aguardando",   title: "Aguardando",   dot: "bg-purple-400",  border: "border-purple-500/25",  bg: "bg-purple-500/5"  },
  { id: "Concluído",    title: "Concluído",    dot: "bg-emerald-400", border: "border-emerald-500/25", bg: "bg-emerald-500/5" },
];

export default function KanbanScreen({ app }) {
  const [expandedColumns, setExpandedColumns] = useState(["Aberto"]);

  const columnItems = useMemo(() => {
    const mainTasks = app.tasks.filter((t) => t.parentId === null);
    return Object.fromEntries(
      columns.map((col) => [
        col.id,
        mainTasks
          .filter((t) => t.status === col.id)
          .sort((a, b) => String(a.endDate || "").localeCompare(String(b.endDate || ""))),
      ])
    );
  }, [app.tasks]);

  function toggleColumn(columnId) {
    setExpandedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  }

  return (
    <div className="space-y-4">
      {columns.map((column) => {
        const items = columnItems[column.id];

        const expanded = expandedColumns.includes(column.id);

        return (
          <div
            key={column.id}
            className={`rounded-[30px] border ${column.border} bg-slate-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur`}
          >
            <button
              onClick={() => toggleColumn(column.id)}
              className="mb-3 flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
                <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                <h3 className="font-bold text-white">{column.title}</h3>
              </div>

              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${column.bg} ${column.dot.replace("bg-", "text-")}`}>
                {items.length}
              </span>
            </button>

            {!expanded && items.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {items.slice(0, 4).map((task) => {
                  const dueState = getDueState(task);

                  return (
                    <span
                      key={task.id}
                      className={`rounded-full border px-3 py-1 text-xs ${dueState.className}`}
                    >
                      {task.title}
                    </span>
                  );
                })}

                {items.length > 4 && (
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
                    +{items.length - 4}
                  </span>
                )}
              </div>
            )}

            {expanded && (
              <>
                {items.length === 0 && (
                  <p className="rounded-2xl bg-slate-950 p-3 text-sm text-slate-500">
                    Nenhuma atividade.
                  </p>
                )}

                <div className="space-y-3">
                  {items.map((task) => {
                    const dueState = getDueState(task);
                    const critical =
                      task.priority === "Alta" && task.status !== "Concluído";

                    return (
                      <button
                        key={task.id}
                        onClick={() => app.setSelectedTaskId(task.id)}
                        className={`w-full rounded-3xl border bg-slate-950 p-4 text-left transition active:scale-[0.98] ${
                          dueState.tone === "red"
                            ? "border-red-500/50"
                            : dueState.tone === "cyan"
                            ? "border-cyan-500/50"
                            : "border-slate-800"
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-semibold leading-tight ${
                              task.status === "Concluído"
                                ? "text-slate-500 line-through"
                                : "text-white"
                            }`}
                          >
                            {task.title}
                          </p>

                          {critical && (
                            <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse text-red-400" />
                          )}
                        </div>

                        <p className="text-xs text-slate-500">
                          {task.project || "Sem projeto"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge className={`rounded-full border ${dueState.className}`}>
                            {dueState.label}
                          </Badge>

                          {task.priority === "Alta" && (
                            <Badge
                              className={`rounded-full border ${priorityColor(
                                task.priority
                              )}`}
                            >
                              Alta
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                          <CalendarDays className="h-4 w-4" />
                          Vence: {formatDateBR(task.endDate)}
                        </div>

                        {task.responsible && (
                          <div className="mt-3 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                            {task.responsible}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}