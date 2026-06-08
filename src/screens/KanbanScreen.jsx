import { useState } from "react";
import { AlertTriangle, CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateBR } from "../utils/dateUtils";
import { getDueState, priorityColor } from "../components/tasks/taskStyles";

const columns = [
  { id: "Aberto", title: "Aberto" },
  { id: "Em andamento", title: "Em andamento" },
  { id: "Aguardando", title: "Aguardando" },
  { id: "Concluído", title: "Concluído" },
];

export default function KanbanScreen({ app }) {
  const [expandedColumns, setExpandedColumns] = useState(["Aberto"]);

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
        const items = app.tasks
          .filter((task) => task.parentId === null && task.status === column.id)
          .sort((a, b) =>
            String(a.endDate || "").localeCompare(String(b.endDate || ""))
          );

        const expanded = expandedColumns.includes(column.id);

        return (
          <div
            key={column.id}
            className="rounded-[30px] border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-black/20 backdrop-blur"
          >
            <button
              onClick={() => toggleColumn(column.id)}
              className="mb-3 flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {expanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}

                <h3 className="font-bold text-white">{column.title}</h3>
              </div>

              <Badge className="rounded-full border border-slate-700 bg-slate-950 text-slate-300">
                {items.length}
              </Badge>
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