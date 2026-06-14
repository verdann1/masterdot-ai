import { useMemo, useState } from "react";
import { ArrowLeft, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { todayISO } from "../utils/dateUtils";

function getResponsibleName(task) {
  if (Array.isArray(task.responsibles) && task.responsibles.length > 0) return task.responsibles;
  if (task.responsible) return [task.responsible];
  return [];
}

function buildPersonStats(tasks) {
  const today = todayISO();
  const map = new Map();

  for (const task of tasks) {
    const names = getResponsibleName(task);
    if (!names.length) names.push("Sem responsável");
    for (const rawName of names) {
      const name = rawName.trim();
      if (!name) continue;
      if (!map.has(name)) {
        map.set(name, { name, tasks: [] });
      }
      map.get(name).tasks.push(task);
    }
  }

  return [...map.values()]
    .map(({ name, tasks: t }) => {
      const total = t.length;
      const done = t.filter((x) => x.status === "Concluído").length;
      const inProgress = t.filter((x) => x.status === "Em andamento").length;
      const open = t.filter((x) => x.status === "Aberto").length;
      const waiting = t.filter((x) => x.status === "Aguardando").length;
      const late = t.filter(
        (x) => x.status !== "Concluído" && x.endDate && x.endDate < today
      ).length;
      const critical = t.filter(
        (x) => x.priority === "Alta" && x.status !== "Concluído"
      ).length;
      const avgProgress =
        total > 0
          ? Math.round(t.reduce((s, x) => s + (x.progress ?? 0), 0) / total)
          : 0;
      const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
      return { name, total, done, inProgress, open, waiting, late, critical, avgProgress, completionRate };
    })
    .sort((a, b) => b.total - a.total);
}

function PersonCard({ person, onClick }) {
  const workloadColor =
    person.late > 0
      ? "border-red-500/30 bg-red-500/5"
      : person.inProgress > 0
      ? "border-blue-500/20 bg-blue-500/5"
      : "border-slate-800 bg-slate-900";

  return (
    <button
      onClick={() => onClick(person)}
      className={`w-full rounded-3xl border p-4 text-left active:opacity-70 transition-colors ${workloadColor}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-lg font-bold text-white">
            {person.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{person.name}</p>
            <p className="text-[11px] text-slate-500">{person.total} atividade(s)</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xl font-black text-white">{person.completionRate}%</p>
          <p className="text-[10px] text-slate-500">concluído</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
          style={{ width: `${person.completionRate}%` }}
        />
      </div>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {person.inProgress > 0 && (
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
            {person.inProgress} andamento
          </span>
        )}
        {person.late > 0 && (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
            {person.late} atrasada{person.late > 1 ? "s" : ""}
          </span>
        )}
        {person.critical > 0 && (
          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-300">
            {person.critical} crítica{person.critical > 1 ? "s" : ""}
          </span>
        )}
        {person.done > 0 && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            {person.done} concluída{person.done > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}

function PersonDetailSheet({ person, tasks, onClose, onTaskSelect }) {
  const today = todayISO();
  const personTasks = tasks.filter((t) => getResponsibleName(t).includes(person.name) || (person.name === "Sem responsável" && !getResponsibleName(t).length));

  const STATUS_COLOR = {
    "Concluído":    "bg-emerald-500/15 text-emerald-300",
    "Em andamento": "bg-blue-500/15 text-blue-300",
    "Aguardando":   "bg-purple-500/15 text-purple-300",
    "Aberto":       "bg-amber-500/15 text-amber-300",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-h-[85vh] overflow-y-auto rounded-t-[32px] border-t border-slate-800 bg-slate-900 p-5 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700" />
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-xl font-bold text-white">
            {person.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{person.name}</p>
            <p className="text-[11px] text-slate-500">
              {person.total} atividades · {person.completionRate}% concluído · progresso médio {person.avgProgress}%
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {personTasks.map((task) => {
            const isLate = task.status !== "Concluído" && task.endDate && task.endDate < today;
            return (
              <button
                key={task.id}
                onClick={() => { onTaskSelect(task.id); onClose(); }}
                className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left active:opacity-70 ${
                  isLate ? "border-red-500/20 bg-red-500/5" : "border-slate-800 bg-slate-950"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">{task.title}</p>
                  <p className="text-[11px] text-slate-500">{task.project} · {task.endDate || "sem prazo"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[task.status] || ""}`}>
                  {task.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ResponsibleDashboardScreen({ app }) {
  const [selected, setSelected] = useState(null);
  const stats = useMemo(() => buildPersonStats(app.tasks), [app.tasks]);

  const totalTasks = app.tasks.length;
  const totalLate = stats.reduce((s, p) => s + p.late, 0);
  const totalDone = app.tasks.filter((t) => t.status === "Concluído").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mp-card-highlight rounded-[32px] p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => app.setActiveTab("home")}
            className="rounded-2xl bg-slate-800/80 p-2.5 text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400/80">Responsáveis</p>
            <h2 className="text-xl font-black tracking-tight text-white">Dashboard por pessoa</h2>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Total",      value: totalTasks, color: "text-white",         icon: Users        },
            { label: "Atrasadas",  value: totalLate,  color: "text-red-300",        icon: AlertTriangle },
            { label: "Concluídas", value: totalDone,  color: "text-emerald-300",    icon: CheckCircle2  },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-slate-800/50 px-2 py-3 text-center">
              <Icon className={`mx-auto mb-1 h-4 w-4 ${color}`} />
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-[9px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {stats.length === 0 && (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="text-sm text-slate-500">Nenhuma atividade encontrada.</p>
        </div>
      )}

      {stats.map((person) => (
        <PersonCard key={person.name} person={person} onClick={setSelected} />
      ))}

      {selected && (
        <PersonDetailSheet
          person={selected}
          tasks={app.tasks}
          onClose={() => setSelected(null)}
          onTaskSelect={(id) => { app.setSelectedTaskId(id); app.setActiveTab("tasks"); }}
        />
      )}
    </div>
  );
}
