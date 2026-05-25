import DarkCard from "../components/common/DarkCard";

export default function CalendarScreen({ app }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startBlank = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const pendingTasks = app.tasks.filter((task) => task.status !== "Concluído");

  function countTasksOnDay(day) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return pendingTasks.filter((task) => task.endDate === date).length;
  }

  return (
    <div className="space-y-4">
      <DarkCard>
        <h3 className="text-lg font-bold text-white">
          {today.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
        </h3>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <div key={`${d}-${i}`}>{d}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {Array.from({ length: startBlank }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const count = countTasksOnDay(day);

            return (
              <div
                key={day}
                className={`relative flex h-11 items-center justify-center rounded-2xl text-sm ${
                  count ? "bg-red-500 text-white" : "bg-slate-900 text-slate-300"
                }`}
              >
                {day}

                {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-600">
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </DarkCard>

      <p className="px-2 text-xs text-slate-500">
        Dias marcados indicam atividades pendentes com prazo de finalização.
      </p>
    </div>
  );
}