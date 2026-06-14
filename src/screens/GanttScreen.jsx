import { useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildDates(start, count) {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

function dayNum(iso) {
  return Number(iso.slice(8));
}

function monthLabel(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function barColor(task) {
  const today = todayISO();
  if (task.status === "Concluído")    return "bg-emerald-500/80";
  if (task.status === "Em andamento") return "bg-blue-500/80";
  if (task.status === "Aguardando")   return "bg-purple-500/80";
  if (task.endDate && task.endDate < today) return "bg-red-500/80";
  return "bg-amber-400/80";
}

const STATUS_DOT = {
  "Concluído":    "bg-emerald-400",
  "Em andamento": "bg-blue-400",
  "Aguardando":   "bg-purple-400",
};

// ── constants ─────────────────────────────────────────────────────────────────
const COL_W = 11; // px per day column
const LEFT_W = 132; // px for task name panel

// ── sub-components ────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-2 px-1 text-[10px]">
      {[
        { color: "bg-emerald-500/80", label: "Concluído"    },
        { color: "bg-blue-500/80",    label: "Em andamento" },
        { color: "bg-purple-500/80",  label: "Aguardando"   },
        { color: "bg-amber-400/80",   label: "Aberto"       },
        { color: "bg-red-500/80",     label: "Atrasado"     },
      ].map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1 text-slate-400">
          <span className={`h-2 w-3 rounded-sm ${color}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── main screen ───────────────────────────────────────────────────────────────
export default function GanttScreen({ app }) {
  const today = todayISO();

  const [windowDays, setWindowDays] = useState(30);
  const [windowStart, setWindowStart] = useState(() => addDays(today, -4));
  const [projectFilter, setProjectFilter] = useState("all");
  const [groupByProject, setGroupByProject] = useState(false);

  const dates = useMemo(() => buildDates(windowStart, windowDays), [windowStart, windowDays]);

  const todayIdx = dates.indexOf(today);

  // Month change markers for header
  const monthMarks = useMemo(() => {
    const marks = [];
    let current = "";
    dates.forEach((d, i) => {
      const m = d.slice(0, 7);
      if (m !== current) { marks.push({ idx: i, label: monthLabel(d) }); current = m; }
    });
    return marks;
  }, [dates]);

  // Filtered + sorted tasks
  const validTasks = useMemo(() => {
    let list = app.tasks.filter((t) => t.startDate && t.endDate && !t.parentId);
    if (projectFilter !== "all") list = list.filter((t) => t.project === projectFilter);
    return list.sort((a, b) => {
      if ((a.status === "Concluído") !== (b.status === "Concluído"))
        return a.status === "Concluído" ? 1 : -1;
      return String(a.endDate).localeCompare(String(b.endDate));
    });
  }, [app.tasks, projectFilter]);

  // Grouped by project
  const groupedTasks = useMemo(() => {
    if (!groupByProject) return [{ project: null, tasks: validTasks }];
    const map = {};
    validTasks.forEach((t) => {
      const key = t.project || "Sem projeto";
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map).map(([project, tasks]) => ({ project, tasks }));
  }, [validTasks, groupByProject]);

  function shiftWindow(delta) {
    setWindowStart((prev) => addDays(prev, delta));
  }

  function goToday() {
    setWindowStart(addDays(today, -4));
  }

  function openTask(taskId) {
    app.setSelectedTaskId(taskId);
  }

  const totalWidth = LEFT_W + COL_W * windowDays;

  return (
    <div className="space-y-3">
      {/* Back header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => app.setActiveTab("home")}
          className="rounded-2xl bg-slate-800 p-2 text-slate-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-white">Gantt</h1>
          <p className="text-[11px] text-slate-500">
            {validTasks.length} atividade(s) com datas
          </p>
        </div>
        <CalendarDays className="h-5 w-5 text-blue-400" />
      </div>

      {/* Project filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...app.projects.map((p) => p.name)].map((p) => (
          <button
            key={p}
            onClick={() => setProjectFilter(p)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              projectFilter === p
                ? "bg-blue-500 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {p === "all" ? "Todos" : p}
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Window size */}
        <div className="flex rounded-2xl bg-slate-800 p-0.5">
          {[14, 30, 60].map((n) => (
            <button
              key={n}
              onClick={() => setWindowDays(n)}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                windowDays === n ? "bg-blue-500 text-white" : "text-slate-400"
              }`}
            >
              {n}d
            </button>
          ))}
        </div>

        {/* Navigation */}
        <button
          onClick={() => shiftWindow(-Math.round(windowDays / 3))}
          className="rounded-2xl bg-slate-800 p-1.5 text-slate-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={goToday}
          className="rounded-2xl bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-blue-400"
        >
          Hoje
        </button>
        <button
          onClick={() => shiftWindow(Math.round(windowDays / 3))}
          className="rounded-2xl bg-slate-800 p-1.5 text-slate-300"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Group toggle */}
        <button
          onClick={() => setGroupByProject((v) => !v)}
          className={`ml-auto rounded-2xl px-3 py-1.5 text-[11px] font-medium transition-colors ${
            groupByProject ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-500"
          }`}
        >
          Por projeto
        </button>
      </div>

      <Legend />

      {validTasks.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="text-sm text-slate-500">
            {projectFilter === "all"
              ? "Nenhuma atividade com data de início e fim cadastrada."
              : "Nenhuma atividade neste projeto com datas definidas."}
          </p>
        </div>
      )}

      {/* Gantt table */}
      {validTasks.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${totalWidth}px` }} className="relative">

              {/* ── Date headers ────────────────────────────────── */}
              {/* Month row */}
              <div className="flex border-b border-slate-800 bg-slate-900">
                <div
                  className="sticky left-0 z-20 shrink-0 bg-slate-900"
                  style={{ width: LEFT_W }}
                />
                <div className="relative flex-1" style={{ height: 18 }}>
                  {monthMarks.map(({ idx, label }) => (
                    <span
                      key={idx}
                      className="absolute top-0 pl-1 text-[9px] font-bold uppercase tracking-wider text-blue-400/70"
                      style={{ left: idx * COL_W }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Day row */}
              <div className="flex border-b border-slate-800 bg-slate-900">
                <div
                  className="sticky left-0 z-20 flex shrink-0 items-center bg-slate-900 pl-3 text-[10px] font-semibold text-slate-500"
                  style={{ width: LEFT_W }}
                >
                  Atividade
                </div>
                <div className="flex">
                  {dates.map((d) => (
                    <div
                      key={d}
                      style={{ width: COL_W, height: 16 }}
                      className={`flex items-center justify-center text-[8px] font-medium
                        ${d === today ? "text-blue-300 font-bold" : "text-slate-600"}
                        ${dayNum(d) === 1 ? "border-l border-slate-700" : ""}
                      `}
                    >
                      {dayNum(d) % 5 === 0 || d === today ? dayNum(d) : ""}
                    </div>
                  ))}
                </div>
              </div>

              {/* Today marker */}
              {todayIdx >= 0 && (
                <div
                  className="pointer-events-none absolute bottom-0 z-10 w-px bg-blue-400/60"
                  style={{
                    left: LEFT_W + todayIdx * COL_W + COL_W / 2,
                    top: 34,
                  }}
                />
              )}

              {/* ── Task rows ────────────────────────────────────── */}
              {groupedTasks.map(({ project, tasks: gtasks }) => (
                <div key={project || "ungrouped"}>
                  {/* Project header row */}
                  {groupByProject && project && (
                    <div
                      className="flex items-center border-b border-slate-800 bg-slate-900/60"
                      style={{ minWidth: totalWidth }}
                    >
                      <div
                        className="sticky left-0 z-20 flex items-center gap-2 bg-slate-900/60 px-3 py-1.5"
                        style={{ width: LEFT_W }}
                      >
                        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-blue-400/80">
                          {project}
                        </span>
                      </div>
                      <div style={{ flex: 1, height: 24 }} />
                    </div>
                  )}

                  {/* Task rows */}
                  {gtasks.map((task) => {
                    const late = task.endDate && task.endDate < today && task.status !== "Concluído";

                    return (
                      <div
                        key={task.id}
                        className="flex items-center border-b border-slate-800/60 hover:bg-slate-900/40"
                        style={{ minHeight: 28 }}
                      >
                        {/* Sticky left cell */}
                        <button
                          onClick={() => openTask(task.id)}
                          className="sticky left-0 z-20 flex shrink-0 items-center gap-1.5 bg-slate-950 px-2 py-1 hover:bg-slate-900"
                          style={{ width: LEFT_W }}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              STATUS_DOT[task.status] ||
                              (late ? "bg-red-400" : "bg-amber-400")
                            }`}
                          />
                          <span
                            className={`truncate text-[10px] leading-tight ${
                              late ? "text-red-300" : "text-slate-300"
                            }`}
                            title={task.title}
                          >
                            {task.title}
                          </span>
                        </button>

                        {/* Bar cells */}
                        <div className="relative flex" style={{ minHeight: 28 }}>
                          {dates.map((d) => {
                            const inRange = task.startDate <= d && task.endDate >= d;
                            const isStart = d === task.startDate;
                            const isEnd   = d === task.endDate;

                            return (
                              <div
                                key={d}
                                style={{ width: COL_W, height: 28 }}
                                className={`flex items-center
                                  ${d === today ? "bg-blue-500/5" : ""}
                                  ${dayNum(d) === 1 ? "border-l border-slate-800" : ""}
                                `}
                              >
                                {inRange && (
                                  <div
                                    className={`mx-px h-4 w-full ${barColor(task)}
                                      ${isStart ? "rounded-l-full" : ""}
                                      ${isEnd   ? "rounded-r-full" : ""}
                                    `}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {validTasks.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Em andamento", count: validTasks.filter((t) => t.status === "Em andamento").length, color: "text-blue-300" },
            { label: "Atrasadas",    count: validTasks.filter((t) => t.endDate < today && t.status !== "Concluído").length, color: "text-red-300" },
            { label: "Concluídas",   count: validTasks.filter((t) => t.status === "Concluído").length, color: "text-emerald-300" },
          ].map(({ label, count, color }) => (
            <div key={label} className="rounded-2xl bg-slate-900 py-3">
              <p className={`text-xl font-bold ${color}`}>{count}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
