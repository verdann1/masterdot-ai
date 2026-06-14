function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDay(date) {
  const d = new Date(`${date}T00:00:00`);

  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
  });
}

function tasksOfDay(tasks, date) {
  return tasks.filter((task) => task.endDate === date);
}

function statusColor(task) {
  const today = todayISO();

  if (task.status === "Concluído") return "border-emerald-500/30 bg-emerald-500/10";
  if (task.endDate < today) return "border-red-500/30 bg-red-500/10";
  if (task.endDate === today) return "border-sky-500/30 bg-sky-500/10";

  return "border-yellow-500/30 bg-yellow-500/10";
}

export default function WeeklySchedule({ app }) {
  const week = Array.from({ length: 7 }).map((_, index) =>
    addDays(todayISO(), index)
  );

  return (
    <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="font-semibold text-white">Vencimentos da semana</h3>

      <div className="space-y-2">
        {week.map((date) => {
          const dayTasks = tasksOfDay(app.tasks, date);

          return (
            <div key={date} className="rounded-2xl bg-slate-950 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold capitalize text-white">
                  {formatDay(date)}
                </p>

                <span className="text-xs text-slate-500">
                  {dayTasks.length} vencimento(s)
                </span>
              </div>

              {dayTasks.length === 0 ? (
                <p className="text-xs text-slate-600">Sem vencimentos.</p>
              ) : (
                <div className="space-y-2">
                  {dayTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        app.setSelectedTaskId(task.id);
                        app.setActiveTab("tasks");
                      }}
                      className={`w-full rounded-xl border p-2 text-left ${statusColor(task)}`}
                    >
                      <p className="text-sm font-medium text-white">
                        {task.title}
                      </p>

                      <p className="text-xs text-slate-500">
                        {task.project} • {task.status} • {task.priority}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}