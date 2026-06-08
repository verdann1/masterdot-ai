function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function completedLast7Days(tasks) {
  const today = new Date();

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);

    date.setDate(today.getDate() - (6 - index));

    const iso = date.toISOString().slice(0, 10);

    const total = tasks.filter((task) => task.endDate === iso).length;

    const done = tasks.filter(
      (task) =>
        task.endDate === iso &&
        task.status === "Concluído"
    ).length;

    return {
      date: iso,
      total,
      done,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  });
}

function formatShort(date) {
  const d = new Date(`${date}T00:00:00`);

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function ExecutivePanel({ app }) {
  const today = todayISO();

  const open = app.tasks.filter(
    (task) => task.status !== "Concluído"
  );

  const late = open.filter(
    (task) => task.endDate && task.endDate < today
  );

  const critical = open.filter(
    (task) => task.priority === "Alta"
  );

  const doneToday = app.tasks.filter(
    (task) =>
      task.status === "Concluído" &&
      task.endDate === today
  );

  const progress = app.tasks.length
    ? Math.round(
        (app.tasks.filter((task) => task.status === "Concluído").length /
          app.tasks.length) *
          100
      )
    : 0;

  const productivity = completedLast7Days(app.tasks);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Em aberto</p>

          <h3 className="mt-2 text-3xl font-bold text-white">
            {open.length}
          </h3>
        </div>

        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-xs text-red-300">Atrasadas</p>

          <h3 className="mt-2 text-3xl font-bold text-red-300">
            {late.length}
          </h3>
        </div>

        <div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-4">
          <p className="text-xs text-orange-300">Críticas</p>

          <h3 className="mt-2 text-3xl font-bold text-orange-300">
            {critical.length}
          </h3>
        </div>

        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-xs text-emerald-300">Concluídas hoje</p>

          <h3 className="mt-2 text-3xl font-bold text-emerald-300">
            {doneToday.length}
          </h3>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            Progresso geral
          </p>

          <p className="text-sm text-slate-400">
            {progress}%
          </p>
        </div>

        <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Produtividade últimos 7 dias
          </h3>
        </div>

        <div className="flex items-end gap-2">
          {productivity.map((item) => (
            <div
              key={item.date}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-24 w-full items-end rounded-2xl bg-slate-800 p-1">
                <div
                  className="w-full rounded-xl bg-blue-500"
                  style={{
                    height: `${Math.max(item.percent, item.total ? 10 : 0)}%`,
                  }}
                />
              </div>

              <p className="text-[10px] text-slate-500">
                {formatShort(item.date)}
              </p>

              <p className="text-[10px] text-slate-400">
                {item.done}/{item.total}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}