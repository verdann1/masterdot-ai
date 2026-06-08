import { useMemo, useState } from "react";
import Section from "../common/Section";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthLabel(date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function buildCalendar(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekDay = firstDay.getDay();

  const days = [];

  for (let i = 0; i < startWeekDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day);

    days.push({
      date: d.toISOString().slice(0, 10),
      day,
    });
  }

  return days;
}

function tasksOfDay(tasks, date) {
  return tasks.filter((task) => task.endDate === date);
}

function taskColor(task) {
  const today = todayISO();

  if (task.status === "Concluído") {
    return "bg-emerald-500/20 text-emerald-300";
  }

  if (task.endDate && task.endDate < today) {
    return "bg-red-500/20 text-red-300";
  }

  if (task.endDate === today) {
    return "bg-cyan-500/20 text-cyan-300";
  }

  return "bg-yellow-500/20 text-yellow-300";
}

function dotColor(task) {
  const today = todayISO();

  if (task.status === "Concluído") return "bg-emerald-400";
  if (task.endDate && task.endDate < today) return "bg-red-400";
  if (task.endDate === today) return "bg-cyan-400";
  return "bg-yellow-400";
}

export default function CalendarPreview({ app }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const today = todayISO();

  const calendarDays = useMemo(() => {
    return buildCalendar(currentDate);
  }, [currentDate]);

  const selectedTasks = useMemo(() => {
    return tasksOfDay(app.tasks, selectedDate);
  }, [app.tasks, selectedDate]);

  function previousMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  }

  return (
    <Section title="Calendário de vencimentos">
      <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            ←
          </button>

          <h3 className="text-sm font-semibold capitalize text-white">
            {monthLabel(currentDate)}
          </h3>

          <button
            onClick={nextMonth}
            className="rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
            <div key={`${day}-${index}`}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((item, index) => {
            if (!item) return <div key={index} />;

            const dayTasks = tasksOfDay(app.tasks, item.date);
            const isToday = item.date === today;
            const isSelected = item.date === selectedDate;

            return (
              <button
                key={item.date}
                onClick={() => setSelectedDate(item.date)}
                className={`relative flex h-12 flex-col items-center justify-center rounded-2xl border text-sm transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/20 text-white"
                    : "border-slate-800 bg-slate-950 text-slate-300"
                } ${isToday ? "ring-1 ring-cyan-400" : ""}`}
              >
                {item.day}

                {dayTasks.length > 0 && (
                  <div className="absolute bottom-1 flex gap-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={`h-1.5 w-1.5 rounded-full ${dotColor(task)}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 rounded-2xl bg-slate-950 p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">
              Vencimentos do dia
            </h4>

            <p className="text-xs text-slate-500">{selectedDate}</p>
          </div>

          {selectedTasks.length === 0 && (
            <p className="text-sm text-slate-500">
              Nenhuma atividade vence nesta data.
            </p>
          )}

          {selectedTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => {
                app.setSelectedTaskId(task.id);
                app.setActiveTab("tasks");
              }}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">
                  {task.title}
                </p>

                <span
                  className={`rounded-full px-2 py-1 text-[10px] ${taskColor(task)}`}
                >
                  {task.status}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {task.project} • {task.responsible || "Sem responsável"}
              </p>
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}