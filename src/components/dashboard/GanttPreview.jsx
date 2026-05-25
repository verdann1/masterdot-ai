import Section from "../common/Section";
import { formatDateBR } from "../../utils/dateUtils";

export default function GanttPreview({ tasks }) {
  const visibleTasks = tasks
    .filter((task) => task.startDate && task.endDate)
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
    .slice(0, 6);

  if (!visibleTasks.length) return null;

  const startTimes = visibleTasks.map((task) => new Date(`${task.startDate}T00:00:00`).getTime());
  const endTimes = visibleTasks.map((task) => new Date(`${task.endDate}T00:00:00`).getTime());
  const min = Math.min(...startTimes);
  const max = Math.max(...endTimes);
  const total = Math.max(max - min, 86400000);

  return (
    <Section title="Gantt automático">
      <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-4">
        {visibleTasks.map((task) => {
          const start = new Date(`${task.startDate}T00:00:00`).getTime();
          const end = new Date(`${task.endDate}T00:00:00`).getTime();
          const left = Math.max(0, Math.round(((start - min) / total) * 100));
          const width = Math.max(8, Math.round(((end - start || 86400000) / total) * 100));

          return (
            <div key={task.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-slate-200">{task.title}</p>
                <p className="shrink-0 text-[10px] text-slate-500">{formatDateBR(task.endDate)}</p>
              </div>

              <div className="relative h-3 rounded-full bg-slate-800">
                <div
                  className="absolute h-3 rounded-full bg-blue-400"
                  style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                />
              </div>
            </div>
          );
        })}

        <p className="text-[11px] text-slate-500">Exibe até 6 atividades com data de início e fim.</p>
      </div>
    </Section>
  );
}