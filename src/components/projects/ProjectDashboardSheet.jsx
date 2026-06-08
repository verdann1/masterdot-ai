import { X, AlertTriangle, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TaskTree from "../tasks/TaskTree";
import GanttPreview from "../dashboard/GanttPreview";
import CalendarPreview from "../dashboard/CalendarPreview";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ProjectDashboardSheet({ app, project, onClose }) {
  if (!project) return null;

  const today = todayISO();
  const limit7 = addDays(today, 7);

  const projectTasks = app.tasks.filter(
    (task) => normalize(task.project) === normalize(project.name)
  );

  const mainTasks = projectTasks.filter((task) => task.parentId === null);

  const open = projectTasks.filter((task) => task.status !== "Concluído");
  const done = projectTasks.filter((task) => task.status === "Concluído");
  const late = open.filter((task) => task.endDate && task.endDate < today);
  const critical = open.filter((task) => task.priority === "Alta");
  const next7 = open.filter(
    (task) => task.endDate && task.endDate >= today && task.endDate <= limit7
  );

  const percent = projectTasks.length
    ? Math.round((done.length / projectTasks.length) * 100)
    : 0;

  const focusTasks = [...late, ...critical, ...next7]
    .filter(
      (task, index, array) =>
        array.findIndex((item) => item.id === task.id) === index
    )
    .filter((task) => task.parentId === null)
    .slice(0, 6);

  const projectApp = {
    ...app,
    tasks: projectTasks,
    dashboard: {
      openTasks: open,
      todayTasks: open.filter((task) => task.endDate === today),
      late,
      critical,
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[36px] border-t border-slate-800 bg-slate-950 p-4 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
              Dashboard do projeto
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              {project.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {projectTasks.length} atividade(s) vinculada(s)
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-900 p-2 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-slate-400">Progresso do projeto</p>
            <p className="text-sm font-bold text-white">{percent}%</p>
          </div>

          <div className="h-4 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-3 text-center">
            <Clock3 className="mx-auto mb-1 h-5 w-5 text-slate-300" />
            <p className="text-xl font-bold text-white">{open.length}</p>
            <p className="text-[10px] text-slate-500">Abertas</p>
          </div>

          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-3 text-center">
            <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-red-300" />
            <p className="text-xl font-bold text-red-300">{late.length}</p>
            <p className="text-[10px] text-red-200">Atrasadas</p>
          </div>

          <div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-3 text-center">
            <CalendarDays className="mx-auto mb-1 h-5 w-5 text-orange-300" />
            <p className="text-xl font-bold text-orange-300">{next7.length}</p>
            <p className="text-[10px] text-orange-200">7 dias</p>
          </div>

          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
            <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-emerald-300" />
            <p className="text-xl font-bold text-emerald-300">{done.length}</p>
            <p className="text-[10px] text-emerald-200">Concluídas</p>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-white">Foco do projeto</h3>

            <Badge className="rounded-full border border-slate-700 bg-slate-950 text-slate-300">
              {focusTasks.length}
            </Badge>
          </div>

          <TaskTree app={app} tasks={focusTasks.length ? focusTasks : mainTasks.slice(0, 5)} compact />
        </div>

        <div className="mt-4">
          <GanttPreview tasks={projectTasks} />
        </div>

        <div className="mt-4">
          <CalendarPreview app={projectApp} />
        </div>
      </div>
    </div>
  );
}