import { Download, Gauge, Zap, GanttChartSquare, Users, BarChart3, UserX, CalendarOff, Flag, FolderKanban } from "lucide-react";
import TodayOperationsPanel from "../components/dashboard/TodayOperationsPanel";
import GanttPreview from "../components/dashboard/GanttPreview";

// ── helpers ──────────────────────────────────────────────────────────────────
function progress(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.status === "Concluído").length / tasks.length) * 100);
}

function hasResponsible(task) {
  if (Array.isArray(task.responsibles) && task.responsibles.length > 0) return true;
  return Boolean(task.responsible && String(task.responsible).trim());
}

const STATUS_CFG = [
  { key: "Aberto",        label: "Aberto",      color: "bg-amber-400"   },
  { key: "Em andamento",  label: "Andamento",   color: "bg-blue-400"    },
  { key: "Aguardando",    label: "Aguardando",  color: "bg-purple-400"  },
  { key: "Concluído",     label: "Concluído",   color: "bg-emerald-400" },
];

// ── sub-components ────────────────────────────────────────────────────────────

function StatusBars({ tasks }) {
  const total = tasks.length || 1;
  const counts = STATUS_CFG.map((s) => ({
    ...s,
    count: tasks.filter((t) => t.status === s.key).length,
  }));

  return (
    <div className="mp-card p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
        Distribuição por status
      </p>

      {/* Stacked bar */}
      <div className="flex h-3 overflow-hidden rounded-full">
        {counts.map((s) => (
          <div
            key={s.key}
            className={`${s.color} h-full transition-all duration-700`}
            style={{ width: `${(s.count / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-y-2">
        {counts.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${s.color}`} />
            <span className="text-[11px] text-slate-400">{s.label}</span>
            <span className="ml-auto text-[12px] font-bold text-white">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioHealth({ app }) {
  const open = app.tasks.filter((t) => t.status !== "Concluído");
  const noResponsible = open.filter((t) => !hasResponsible(t));
  const noDueDate = open.filter((t) => !t.endDate);
  const highOpen = open.filter((t) => t.priority === "Alta");
  const activeProjects = app.projects.filter((p) =>
    open.some((t) => t.project === p.name)
  );

  const items = [
    { label: "Sem responsável", value: noResponsible.length, icon: UserX,        tone: "text-amber-300",   bg: "bg-amber-500/10",   filter: () => app.setQuickFilter("Abertas") },
    { label: "Sem prazo",       value: noDueDate.length,     icon: CalendarOff,   tone: "text-orange-300",  bg: "bg-orange-500/10",  filter: () => app.setQuickFilter("Abertas") },
    { label: "Alta prioridade", value: highOpen.length,      icon: Flag,          tone: "text-red-300",     bg: "bg-red-500/10",     filter: () => app.setPriorityFilter("Alta") },
    { label: "Projetos ativos", value: activeProjects.length,icon: FolderKanban,  tone: "text-blue-300",    bg: "bg-blue-500/10",    filter: null },
  ];

  function goTasks(filter) {
    if (!filter) { app.setActiveTab("projects"); return; }
    app.setSearch("");
    app.setStatusFilter("Todos");
    app.setPriorityFilter("Todas");
    app.setQuickFilter("Todas");
    filter();
    app.setActiveTab("tasks");
  }

  return (
    <div className="mp-card p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
        Saúde da carteira
      </p>
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ label, value, icon: Icon, tone, bg, filter }) => (
          <button
            key={label}
            onClick={() => goTasks(filter)}
            className={`flex flex-col items-center gap-1 rounded-2xl ${bg} px-1.5 py-3 text-center transition active:scale-[0.97]`}
          >
            <Icon className={`h-4 w-4 ${tone}`} />
            <span className={`text-lg font-black leading-none ${tone}`}>{value}</span>
            <span className="text-[9px] leading-tight text-slate-500">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectBars({ tasks, projects }) {
  const stats = projects
    .map((p) => {
      const pt = tasks.filter((t) => t.project === p.name);
      const done = pt.filter((t) => t.status === "Concluído").length;
      return { name: p.name, done, total: pt.length, pct: pt.length ? Math.round((done / pt.length) * 100) : 0 };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  if (!stats.length) return null;

  return (
    <div className="mp-card p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
        Progresso por projeto
      </p>
      <div className="space-y-3">
        {stats.map((p) => (
          <div key={p.name}>
            <div className="mb-1 flex justify-between">
              <span className="max-w-[70%] truncate text-[12px] text-slate-300">{p.name}</span>
              <span className="text-[11px] text-slate-500">
                {p.done}/{p.total} · {p.pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                style={{ width: `${p.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ app }) {
  const percent    = progress(app.tasks);
  const total      = app.tasks.length;
  const done       = app.tasks.filter((t) => t.status === "Concluído").length;
  const late       = app.tasks.filter((t) => t.status !== "Concluído" && t.endDate && t.endDate < new Date().toISOString().slice(0, 10)).length;
  const inProgress = app.tasks.filter((t) => t.status === "Em andamento").length;

  return (
    <div className="space-y-4">
      {/* ── Main dashboard card ─────────────────────────────── */}
      <div className="mp-card-highlight rounded-[32px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400/80">MetaPulse</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Painel operacional</h2>
            <p className="mt-1 text-sm text-slate-500">Controle de vencimentos, atrasos e prioridades.</p>
          </div>
          <div className="rounded-2xl bg-blue-500/10 p-3 ring-1 ring-inset ring-blue-500/20">
            <Gauge className="h-6 w-6 text-blue-300" />
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { label: "Total",        value: total,      color: "text-white",        bg: "bg-slate-800/70"   },
            { label: "Em andamento", value: inProgress, color: "text-blue-300",     bg: "bg-blue-500/10"    },
            { label: "Atrasadas",    value: late,       color: "text-red-300",      bg: "bg-red-500/10"     },
            { label: "Concluídas",   value: done,       color: "text-emerald-300",  bg: "bg-emerald-500/10" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl ${bg} px-2 py-2.5 text-center`}>
              <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
              <p className="mt-1 text-[9px] leading-tight text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-slate-400">Progresso geral</p>
            <p className="text-xs font-bold text-white">
              {done}/{total} <span className="font-normal text-slate-500">({percent}%)</span>
            </p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => app.setActiveTab("focus")}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-900/40 active:opacity-80"
          >
            <Zap className="h-4 w-4" />
            Modo Foco
          </button>
          <button
            onClick={app.exportExecutiveExcel}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100/90 text-sm font-semibold text-slate-950 active:opacity-80"
          >
            <Download className="h-4 w-4" />
            Relatório
          </button>
        </div>
      </div>

      {/* ── Portfolio health (deterministic insights) ───────── */}
      <PortfolioHealth app={app} />

      {/* ── Charts ──────────────────────────────────────────── */}
      <StatusBars tasks={app.tasks} />
      <ProjectBars tasks={app.tasks} projects={app.projects} />

      {/* ── Operations ──────────────────────────────────────── */}
      <TodayOperationsPanel app={app} />

      {/* ── Gantt preview with expand button ────────────────── */}
      <div className="relative">
        <GanttPreview tasks={app.tasks} />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button
            onClick={() => app.setActiveTab("gantt")}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-blue-500/20 bg-blue-500/5 py-2.5 text-xs font-semibold text-blue-400 active:opacity-70"
          >
            <GanttChartSquare className="h-3.5 w-3.5" />
            Gantt
          </button>
          <button
            onClick={() => app.setActiveTab("responsible")}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-purple-500/20 bg-purple-500/5 py-2.5 text-xs font-semibold text-purple-400 active:opacity-70"
          >
            <Users className="h-3.5 w-3.5" />
            Equipe
          </button>
          <button
            onClick={() => app.setActiveTab("kpi")}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 py-2.5 text-xs font-semibold text-emerald-400 active:opacity-70"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            KPIs
          </button>
        </div>
      </div>
    </div>
  );
}
