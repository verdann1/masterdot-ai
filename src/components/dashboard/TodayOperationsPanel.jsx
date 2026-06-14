import { AlertTriangle, CalendarDays, Clock, Target } from "lucide-react";
import Section from "../common/Section";
import TaskTree from "../tasks/TaskTree";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function TodayOperationsPanel({ app }) {
  const today = todayISO();
  const limit7 = addDays(today, 7);

  const open = app.tasks.filter((task) => task.status !== "Concluído");

  const late = open.filter((task) => task.endDate && task.endDate < today);
  const todayDue = open.filter((task) => task.endDate === today);

  const critical = open.filter(
    (task) =>
      task.priority === "Alta" &&
      task.endDate &&
      task.endDate >= today &&
      task.endDate <= limit7
  );

  const next7 = open.filter(
    (task) => task.endDate && task.endDate >= today && task.endDate <= limit7
  );

  const focusTasks = [...late, ...todayDue, ...critical, ...next7]
    .filter(
      (task, index, array) =>
        array.findIndex((item) => item.id === task.id) === index
    )
    .filter((task) => task.parentId === null)
    .slice(0, 6);

  function openFilter(filter) {
    app.setSearch("");
    app.setStatusFilter("Todos");
    app.setPriorityFilter("Todas");
    app.setQuickFilter(filter);
    app.setActiveTab("tasks");
  }

  function openCritical() {
    app.setSearch("");
    app.setStatusFilter("Todos");
    app.setQuickFilter("Todas");
    app.setPriorityFilter("Alta");
    app.setActiveTab("tasks");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => openFilter("Atrasadas")}
          className="rounded-3xl border border-red-500/20 bg-red-500/10 p-3 text-center transition active:scale-[0.98]"
        >
          <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-red-300" />
          <p className="text-lg font-bold text-red-300">{late.length}</p>
          <p className="text-[10px] text-red-200">Atrasadas</p>
        </button>

        <button
          onClick={() => openFilter("Hoje")}
          className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-3 text-center transition active:scale-[0.98]"
        >
          <CalendarDays className="mx-auto mb-1 h-5 w-5 text-sky-300" />
          <p className="text-lg font-bold text-sky-300">{todayDue.length}</p>
          <p className="text-[10px] text-sky-200">Hoje</p>
        </button>

        <button
          onClick={openCritical}
          className="rounded-3xl border border-orange-500/20 bg-orange-500/10 p-3 text-center transition active:scale-[0.98]"
        >
          <Target className="mx-auto mb-1 h-5 w-5 text-orange-300" />
          <p className="text-lg font-bold text-orange-300">{critical.length}</p>
          <p className="text-[10px] text-orange-200">Críticas</p>
        </button>

        <button
          onClick={() => openFilter("7 dias")}
          className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-3 text-center transition active:scale-[0.98]"
        >
          <Clock className="mx-auto mb-1 h-5 w-5 text-blue-300" />
          <p className="text-lg font-bold text-blue-300">{next7.length}</p>
          <p className="text-[10px] text-blue-200">7 dias</p>
        </button>
      </div>

      <Section title="Foco operacional">
        <TaskTree app={app} tasks={focusTasks} compact />
      </Section>
    </div>
  );
}