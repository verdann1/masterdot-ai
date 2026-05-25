import { AlertTriangle, CalendarDays, ClipboardList, Gauge } from "lucide-react";
import Metric from "../components/dashboard/Metric";
import KpiPanel from "../components/dashboard/KpiPanel";
import GanttPreview from "../components/dashboard/GanttPreview";
import TaskTree from "../components/tasks/TaskTree";
import Section from "../components/common/Section";

export default function HomeScreen({ app }) {
  const todayMainTasks = app.dashboard.todayTasks.filter((task) => task.parentId === null);
  const criticalMainTasks = app.dashboard.critical.filter((task) => task.parentId === null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Metric icon={<CalendarDays />} title="Hoje" value={app.dashboard.todayTasks.length} />
        <Metric icon={<AlertTriangle />} title="Críticas" value={app.dashboard.critical.length} />
        <Metric icon={<Gauge />} title="Atrasadas" value={app.dashboard.late.length} />
        <Metric icon={<ClipboardList />} title="Abertas" value={app.dashboard.openTasks.length} />
      </div>

      <KpiPanel tasks={app.tasks} />
      <GanttPreview tasks={app.tasks} />

      <Section title="Prioridade do dia">
        <TaskTree
          app={app}
          tasks={todayMainTasks.length ? todayMainTasks : criticalMainTasks.slice(0, 3)}
          compact
        />
      </Section>
    </div>
  );
}