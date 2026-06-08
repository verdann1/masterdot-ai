import Section from "../common/Section";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatShortDate(date) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getLast7Days() {
  const today = todayISO();
  return Array.from({ length: 7 }).map((_, index) => addDays(today, index - 6));
}

function getDateRange(tasks) {
  const valid = tasks.filter((task) => task.startDate && task.endDate);

  if (!valid.length) return getLast7Days();

  const minDate = new Date(
    Math.min(...valid.map((task) => new Date(`${task.startDate}T00:00:00`).getTime()))
  );

  const maxDate = new Date(
    Math.max(...valid.map((task) => new Date(`${task.endDate}T00:00:00`).getTime()))
  );

  const dates = [];
  const current = new Date(minDate);

  while (current <= maxDate && dates.length < 21) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return dates.length ? dates : getLast7Days();
}

function isTaskInDate(task, date) {
  if (!task.startDate || !task.endDate) return false;
  return task.startDate <= date && task.endDate >= date;
}

function barColor(task) {
  const today = todayISO();

  if (task.status === "Concluído") return "bg-emerald-500";
  if (task.endDate && task.endDate < today) return "bg-red-500";
  return "bg-yellow-400";
}

function dayCompletion(tasks, date) {
  const dayTasks = tasks.filter((task) => task.endDate === date);
  const done = dayTasks.filter((task) => task.status === "Concluído").length;

  return {
    total: dayTasks.length,
    done,
    percent: dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0,
  };
}

export default function GanttPreview({ tasks }) {
  const validTasks = tasks
    .filter((task) => task.startDate && task.endDate)
    .sort((a, b) => {
      const aDone = a.status === "Concluído";
      const bDone = b.status === "Concluído";

      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      return String(a.endDate).localeCompare(String(b.endDate));
    });

  const visibleTasks = validTasks.slice(0, Math.max(3, Math.min(validTasks.length, 8)));
  const dates = getDateRange(visibleTasks);
  const last7 = getLast7Days();

  if (!visibleTasks.length) {
    return (
      <Section title="Gantt por data">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">
            Cadastre ao menos uma atividade com data de início e fim para exibir o Gantt.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Gantt por data">
      <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-300">
              Verde: concluído
            </span>
            <span className="rounded-full bg-yellow-400/20 px-2 py-1 text-yellow-300">
              Amarelo: pendente
            </span>
            <span className="rounded-full bg-red-500/20 px-2 py-1 text-red-300">
              Vermelho: atrasado
            </span>
          </div>

          <div className="overflow-x-auto">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `140px repeat(${dates.length}, 36px)`,
              }}
            >
              <div className="sticky left-0 z-10 bg-slate-900 text-xs font-semibold text-slate-400">
                Atividade
              </div>

              {dates.map((date) => (
                <div key={date} className="text-center text-[10px] text-slate-500">
                  {formatShortDate(date)}
                </div>
              ))}

              {visibleTasks.map((task) => (
                <>
                  <button
                    key={`${task.id}-title`}
                    className="sticky left-0 z-10 truncate rounded-xl bg-slate-900 py-2 pr-2 text-left text-xs text-slate-200"
                  >
                    {task.title}
                  </button>

                  {dates.map((date) => {
                    const active = isTaskInDate(task, date);

                    return (
                      <div
                        key={`${task.id}-${date}`}
                        className={`h-7 rounded-lg ${
                          active ? barColor(task) : "bg-slate-800"
                        }`}
                        title={`${task.title} - ${formatShortDate(date)}`}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-3">
          <h4 className="mb-3 text-sm font-semibold text-white">
            Conclusão últimos 7 dias
          </h4>

          <div className="flex items-end gap-2">
            {last7.map((date) => {
              const data = dayCompletion(tasks, date);

              return (
                <div key={date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end rounded-xl bg-slate-800 p-1">
                    <div
                      className="w-full rounded-lg bg-emerald-500"
                      style={{
                        height: `${Math.max(data.percent, data.total ? 8 : 0)}%`,
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500">{formatShortDate(date)}</p>
                  <p className="text-[10px] text-slate-400">
                    {data.done}/{data.total}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}