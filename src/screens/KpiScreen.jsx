import { useMemo, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { ArrowLeft, TrendingUp, Target, AlertTriangle, CheckCircle2 } from "lucide-react";

const D = {
  cyan:    "#38BDF8",
  blue:    "#93C5FD",
  purple:  "#C4B5FD",
  emerald: "#6EE7B7",
  amber:   "#FCD34D",
  red:     "#FCA5A5",
  grid:    "rgba(30,41,59,0.8)",
  text:    "#94A3B8",
};

function ChartCard({ title, children }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function useChart(canvasRef, getConfig, deps) {
  const chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, getConfig());
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

function StatusDonut({ tasks }) {
  const ref = useRef(null);
  const counts = [
    tasks.filter((t) => t.status === "Aberto").length,
    tasks.filter((t) => t.status === "Em andamento").length,
    tasks.filter((t) => t.status === "Aguardando").length,
    tasks.filter((t) => t.status === "Concluído").length,
  ];

  useChart(ref, () => ({
    type: "doughnut",
    data: {
      labels: ["Aberto", "Andamento", "Aguardando", "Concluído"],
      datasets: [{
        data: counts,
        backgroundColor: ["rgba(251,191,36,.8)", "rgba(96,165,250,.8)", "rgba(167,139,250,.8)", "rgba(52,211,153,.8)"],
        borderColor: ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"],
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "68%",
      plugins: {
        legend: { position: "bottom", labels: { color: D.text, padding: 12, boxWidth: 10, font: { size: 10 } } },
        tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed}` } },
      },
    },
  }), [counts.join()]);

  return <div style={{ height: 210, position: "relative" }}><canvas ref={ref} /></div>;
}

function ProjectBars({ tasks, projects }) {
  const ref = useRef(null);
  const data = useMemo(() => (
    projects
      .map((p) => {
        const pt = tasks.filter((t) => t.project === p.name);
        const done = pt.filter((t) => t.status === "Concluído").length;
        return { name: p.name, pct: pt.length ? Math.round((done / pt.length) * 100) : 0, total: pt.length };
      })
      .filter((p) => p.total > 0)
      .sort((a, b) => a.pct - b.pct)
      .slice(-8)
  ), [tasks, projects]);

  useChart(ref, () => ({
    type: "bar",
    data: {
      labels: data.map((d) => d.name.length > 16 ? d.name.slice(0, 16) + "…" : d.name),
      datasets: [{
        label: "% Concluído",
        data: data.map((d) => d.pct),
        backgroundColor: data.map((d) =>
          d.pct >= 75 ? "rgba(52,211,153,.75)" : d.pct >= 40 ? "rgba(96,165,250,.75)" : "rgba(251,191,36,.75)"
        ),
        borderRadius: 6, borderSkipped: false,
      }],
    },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.x}%` } } },
      scales: {
        x: { max: 100, grid: { color: D.grid }, ticks: { color: D.text, font: { size: 10 }, callback: (v) => v + "%" }, border: { display: false } },
        y: { grid: { display: false }, ticks: { color: D.text, font: { size: 10 } }, border: { display: false } },
      },
    },
  }), [data.map((d) => d.pct).join()]);

  if (!data.length) return <p className="py-4 text-center text-xs text-slate-600">Nenhum projeto com atividades.</p>;
  return <div style={{ height: Math.max(120, data.length * 34), position: "relative" }}><canvas ref={ref} /></div>;
}

function WeeklyForecast({ tasks }) {
  const ref = useRef(null);
  const weeks = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Array.from({ length: 8 }, (_, i) => {
      const ws = new Date(today);
      ws.setDate(today.getDate() - today.getDay() + 1 + (i - 1) * 7);
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      const s = ws.toISOString().slice(0, 10);
      const e = we.toISOString().slice(0, 10);
      const wt = tasks.filter((t) => t.endDate >= s && t.endDate <= e);
      return {
        label: `${ws.getDate().toString().padStart(2,"0")}/${(ws.getMonth()+1).toString().padStart(2,"0")}`,
        done: wt.filter((t) => t.status === "Concluído").length,
        open: wt.filter((t) => t.status !== "Concluído").length,
      };
    });
  }, [tasks]);

  useChart(ref, () => ({
    type: "bar",
    data: {
      labels: weeks.map((w) => w.label),
      datasets: [
        { label: "Concluídas", data: weeks.map((w) => w.done), backgroundColor: "rgba(52,211,153,.75)", borderRadius: 4, stack: "s" },
        { label: "Em aberto",  data: weeks.map((w) => w.open), backgroundColor: "rgba(96,165,250,.55)",  borderRadius: 4, stack: "s" },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { color: D.text, padding: 10, boxWidth: 10, font: { size: 10 } } } },
      scales: {
        x: { stacked: true, grid: { color: D.grid }, ticks: { color: D.text, font: { size: 9 } }, border: { display: false } },
        y: { stacked: true, grid: { color: D.grid }, ticks: { color: D.text, font: { size: 10 }, stepSize: 1 }, border: { display: false } },
      },
    },
  }), [weeks.map((w) => w.done + "-" + w.open).join()]);

  return <div style={{ height: 200, position: "relative" }}><canvas ref={ref} /></div>;
}

function ResponsibleChart({ tasks }) {
  const ref = useRef(null);
  const data = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const names = Array.isArray(t.responsibles) && t.responsibles.length ? t.responsibles : t.responsible ? [t.responsible] : [];
      for (const name of names) {
        if (!name?.trim()) continue;
        const e = map.get(name) || { open: 0, done: 0 };
        if (t.status === "Concluído") e.done++; else e.open++;
        map.set(name, e);
      }
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => (b.open + b.done) - (a.open + a.done))
      .slice(0, 8);
  }, [tasks]);

  useChart(ref, () => ({
    type: "bar",
    data: {
      labels: data.map((d) => d.name.length > 14 ? d.name.slice(0, 14) + "…" : d.name),
      datasets: [
        { label: "Em aberto",  data: data.map((d) => d.open), backgroundColor: "rgba(96,165,250,.75)",  borderRadius: 4, stack: "s" },
        { label: "Concluídas", data: data.map((d) => d.done), backgroundColor: "rgba(52,211,153,.65)", borderRadius: 4, stack: "s" },
      ],
    },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { color: D.text, padding: 10, boxWidth: 10, font: { size: 10 } } } },
      scales: {
        x: { stacked: true, grid: { color: D.grid }, ticks: { color: D.text, font: { size: 10 } }, border: { display: false } },
        y: { stacked: true, grid: { display: false }, ticks: { color: D.text, font: { size: 10 } }, border: { display: false } },
      },
    },
  }), [data.map((d) => d.open + "-" + d.done).join()]);

  if (!data.length) return <p className="py-4 text-center text-xs text-slate-600">Sem responsáveis cadastrados.</p>;
  return <div style={{ height: Math.max(160, data.length * 36), position: "relative" }}><canvas ref={ref} /></div>;
}

export default function KpiScreen({ app }) {
  const today = new Date().toISOString().slice(0, 10);
  const { tasks, projects } = app;

  const kpis = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "Concluído").length;
    const open = tasks.filter((t) => t.status !== "Concluído");
    const late = open.filter((t) => t.endDate && t.endDate < today).length;
    const critical = open.filter((t) => t.priority === "Alta").length;
    const avgProgress = total > 0 ? Math.round(tasks.reduce((s, t) => s + (t.progress ?? 0), 0) / total) : 0;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, late, critical, avgProgress, completionRate };
  }, [tasks, today]);

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
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400/80">Analytics</p>
            <h2 className="text-xl font-black tracking-tight text-white">Painel de KPIs</h2>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: "Taxa de conclusão",  value: `${kpis.completionRate}%`, color: "text-emerald-300", icon: CheckCircle2, bg: "bg-emerald-500/10" },
            { label: "Progresso médio",    value: `${kpis.avgProgress}%`,   color: "text-blue-300",    icon: TrendingUp,   bg: "bg-blue-500/10"    },
            { label: "Em atraso",          value: kpis.late,                color: "text-red-300",     icon: AlertTriangle,bg: "bg-red-500/10"     },
            { label: "Críticas abertas",   value: kpis.critical,            color: "text-orange-300",  icon: Target,       bg: "bg-orange-500/10"  },
          ].map(({ label, value, color, icon: Icon, bg }) => (
            <div key={label} className={`rounded-2xl ${bg} p-3`}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <ChartCard title="Distribuição por status">
        <StatusDonut tasks={tasks} />
      </ChartCard>

      <ChartCard title="Progresso por projeto">
        <ProjectBars tasks={tasks} projects={projects} />
      </ChartCard>

      <ChartCard title="Distribuição semanal de prazos">
        <WeeklyForecast tasks={tasks} />
      </ChartCard>

      <ChartCard title="Workload por responsável">
        <ResponsibleChart tasks={tasks} />
      </ChartCard>
    </div>
  );
}
