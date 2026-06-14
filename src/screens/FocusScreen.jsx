import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ArrowLeft, Zap, Trophy, AlertTriangle, CalendarClock } from "lucide-react";

const PRI_ORDER = { Alta: 0, Média: 1, Baixa: 2 };
const PRI_COLOR = {
  Alta:  "border-red-500/40 text-red-400",
  Média: "border-orange-500/40 text-orange-400",
  Baixa: "border-slate-700 text-slate-500",
};
const PRI_DOT = {
  Alta:  "bg-red-500",
  Média: "bg-orange-400",
  Baixa: "bg-slate-600",
};

function pad(n) { return String(n).padStart(2, "0"); }

export default function FocusScreen({ app }) {
  const [now, setNow] = useState(new Date());
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = now.toISOString().slice(0, 10);

  // Tasks relevant to focus mode: endDate <= today, not cancelled
  const relevant = app.tasks.filter(
    (t) => t.status !== "Cancelado" && t.endDate && t.endDate <= today
  );

  const overdue = relevant
    .filter((t) => t.endDate < today && t.status !== "Concluído")
    .sort((a, b) => a.endDate.localeCompare(b.endDate));

  const todayPending = relevant
    .filter((t) => t.endDate === today && t.status !== "Concluído")
    .sort((a, b) => (PRI_ORDER[a.priority] ?? 1) - (PRI_ORDER[b.priority] ?? 1));

  const done = relevant.filter((t) => t.status === "Concluído");
  const total = relevant.length;
  const pct   = total > 0 ? Math.round((done.length / total) * 100) : 0;
  const allDone = total > 0 && overdue.length === 0 && todayPending.length === 0;

  // Celebrate when all tasks are done
  useEffect(() => {
    if (allDone) setCelebrating(true);
  }, [allDone]);

  function toggle(task) {
    const next = task.status === "Concluído" ? "Em andamento" : "Concluído";
    app.updateTaskStatus(task.id, next);
  }

  function openDetail(task) {
    app.setSelectedTaskId(task.id);
  }

  const timeH  = pad(now.getHours());
  const timeM  = pad(now.getMinutes());
  const timeS  = pad(now.getSeconds());
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="min-h-screen pb-10">
      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => app.setActiveTab("home")}
          className="flex items-center gap-1.5 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Sair
        </button>

        <div className="flex items-center gap-2 rounded-2xl bg-cyan-500/10 px-3 py-1.5">
          <Zap className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-300">Modo Foco</span>
        </div>
      </div>

      {/* ── Clock ────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-3 text-center">
        <div className="flex items-end justify-center gap-1.5">
          <span className="text-[64px] font-black leading-none tracking-tighter text-white">
            {timeH}:{timeM}
          </span>
          <span className="mb-2 text-2xl font-bold text-slate-600">:{timeS}</span>
        </div>
        <p className="mt-1 text-sm capitalize text-slate-500">{dateStr}</p>
      </div>

      {/* ── Progress ─────────────────────────────────────────── */}
      {total > 0 && (
        <div className="mx-4 mb-5 rounded-[20px] border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-400">Progresso do dia</span>
            <span className="text-sm font-bold text-white">
              {done.length}/{total}{" "}
              <span className="font-normal text-slate-500">({pct}%)</span>
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── All done celebration ──────────────────────────────── */}
      {allDone && (
        <div className="mx-4 mb-5 rounded-[24px] border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-emerald-300" />
          <p className="text-lg font-bold text-emerald-200">Tudo concluído!</p>
          <p className="mt-1 text-sm text-emerald-400/70">
            Todas as atividades do dia foram concluídas. 🎉
          </p>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {total === 0 && (
        <div className="mx-4 rounded-[24px] border border-dashed border-slate-800 p-8 text-center">
          <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="font-medium text-slate-500">Nenhuma atividade para hoje.</p>
          <p className="mt-1 text-sm text-slate-600">
            Atividades com prazo até hoje aparecerão aqui.
          </p>
        </div>
      )}

      {/* ── Overdue ──────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <section className="px-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-sm font-bold text-red-400">
              Atrasadas ({overdue.length})
            </p>
          </div>
          <div className="space-y-2">
            {overdue.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggle} onOpen={openDetail} late />
            ))}
          </div>
        </section>
      )}

      {/* ── Today ────────────────────────────────────────────── */}
      {todayPending.length > 0 && (
        <section className={`px-4 ${overdue.length > 0 ? "mt-5" : ""}`}>
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <p className="text-sm font-bold text-cyan-300">
              Hoje ({todayPending.length})
            </p>
          </div>
          <div className="space-y-2">
            {todayPending.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggle} onOpen={openDetail} />
            ))}
          </div>
        </section>
      )}

      {/* ── Completed today ───────────────────────────────────── */}
      {done.length > 0 && (
        <section className="mt-5 px-4">
          <p className="mb-3 text-sm font-semibold text-slate-600">
            Concluídas ({done.length})
          </p>
          <div className="space-y-2">
            {done.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggle} onOpen={openDetail} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onOpen, late }) {
  const done  = task.status === "Concluído";
  const pri   = task.priority || "Baixa";

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
        done
          ? "border-slate-800/50 bg-slate-900/40 opacity-60"
          : late
          ? "border-red-500/20 bg-red-950/20"
          : "border-slate-800 bg-slate-900"
      }`}
    >
      {/* Check button */}
      <button
        onClick={() => onToggle(task)}
        className="mt-0.5 shrink-0 text-slate-400 transition-colors"
      >
        {done ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        ) : (
          <Circle className={`h-6 w-6 ${late ? "text-red-400" : "text-slate-600"}`} />
        )}
      </button>

      {/* Content — tap to open detail */}
      <button className="flex-1 text-left" onClick={() => onOpen(task)}>
        <p className={`font-semibold leading-snug ${done ? "text-slate-500 line-through" : "text-white"}`}>
          {task.title}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {task.project && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
              {task.project}
            </span>
          )}
          {task.responsible && (
            <span className="text-[10px] text-slate-500">{task.responsible}</span>
          )}
          {!done && (
            <span className={`flex items-center gap-1 text-[10px] font-medium ${PRI_COLOR[pri] || ""}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${PRI_DOT[pri] || "bg-slate-600"}`} />
              {pri}
            </span>
          )}
          {late && !done && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
              {(() => {
                const d = new Date();
                const e = new Date(task.endDate + "T12:00:00");
                const days = Math.round((d - e) / 86400000);
                return days === 1 ? "1 dia atrasado" : `${days} dias atrasado`;
              })()}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
