import { useMemo } from "react";
import { Download, FileText, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import SelectField from "../components/common/SelectField";
import TaskTree from "../components/tasks/TaskTree";
import { todayISO } from "../utils/dateUtils";

function StatusSummary({ tasks }) {
  const today = todayISO();

  const counts = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "Concluído");
    return {
      total: tasks.length,
      late: open.filter((t) => t.endDate && t.endDate < today).length,
      today: open.filter((t) => t.endDate === today).length,
      inProgress: open.filter((t) => t.status === "Em andamento").length,
      done: tasks.filter((t) => t.status === "Concluído").length,
    };
  }, [tasks, today]);

  const items = [
    { label: "Total",        value: counts.total,      color: "text-white",        bg: "bg-slate-800"         },
    { label: "Em andamento", value: counts.inProgress,  color: "text-blue-300",     bg: "bg-blue-500/10"      },
    { label: "Hoje",         value: counts.today,       color: "text-sky-300",      bg: "bg-sky-500/10"       },
    { label: "Atrasadas",    value: counts.late,        color: "text-red-300",      bg: "bg-red-500/10"       },
    { label: "Concluídas",   value: counts.done,        color: "text-emerald-300",  bg: "bg-emerald-500/10"   },
  ];

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {items.map(({ label, value, color, bg }) => (
        <div
          key={label}
          className={`rounded-2xl ${bg} px-2 py-2.5 text-center`}
        >
          <p className={`text-base font-bold leading-none ${color}`}>{value}</p>
          <p className="mt-1 text-[9px] leading-tight text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function TasksScreen({ app }) {
  return (
    <div className="space-y-4">
      {/* Filters card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl shadow-black/20 backdrop-blur">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="h-11 rounded-2xl border-slate-700 bg-slate-950 pl-9 pr-9 text-slate-100 placeholder:text-slate-500"
              placeholder="Buscar atividade, comentário, checklist..."
              value={app.search}
              onChange={(e) => app.setSearch(e.target.value)}
            />
            {app.search && (
              <button
                onClick={() => app.setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick filters */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {["Todas", "Abertas", "Atrasadas", "Hoje", "7 dias", "Concluídas"].map((filter) => (
              <button
                key={filter}
                onClick={() => app.setQuickFilter(filter)}
                className={`h-9 whitespace-nowrap rounded-2xl px-3.5 text-xs font-medium transition-colors ${
                  app.quickFilter === filter
                    ? "bg-blue-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Status + priority filters */}
          <div className="grid grid-cols-2 gap-2">
            <SelectField
              value={app.statusFilter}
              onChange={app.setStatusFilter}
              options={["Todos", "Aberto", "Em andamento", "Aguardando", "Concluído"]}
            />
            <SelectField
              value={app.priorityFilter}
              onChange={app.setPriorityFilter}
              options={["Todas", "Alta", "Média", "Baixa"]}
            />
          </div>

          {/* Project filter */}
          <SelectField
            value={app.projectFilter}
            onChange={app.setProjectFilter}
            options={["Todos", ...app.projects.map((p) => p.name)]}
          />

          {/* Summary */}
          <StatusSummary tasks={app.filteredMainTasks} />

          {/* Export */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={app.exportFilteredTasks}
              className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-emerald-500/15 text-xs font-medium text-emerald-300"
            >
              <Download className="h-3.5 w-3.5" />
              Excel
            </button>
            <button
              onClick={app.exportExecutiveExcel}
              className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-blue-500/15 text-xs font-medium text-blue-300"
            >
              <Download className="h-3.5 w-3.5" />
              Relatório
            </button>
            <button
              onClick={app.exportExecutivePdf}
              className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-red-500/15 text-xs font-medium text-red-300"
            >
              <FileText className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </div>
      </div>

      <TaskTree app={app} tasks={app.filteredMainTasks} />

      {app.hasMoreTasks && (
        <button
          onClick={app.loadMoreTasks}
          disabled={app.loadingMoreTasks}
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-sm font-medium text-slate-300 disabled:opacity-50"
        >
          {app.loadingMoreTasks ? "Carregando..." : "Carregar mais atividades"}
        </button>
      )}
    </div>
  );
}
