import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DarkCard from "../components/common/DarkCard";

export default function ProjectsScreen({ app }) {
  return (
    <div className="space-y-3">
      {app.projects.map((project) => {
        const projectTasks = app.tasks.filter((task) => task.project === project.name);
        const done = projectTasks.filter((task) => task.status === "Concluído").length;
        const percent = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;

        return (
          <DarkCard key={project.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{project.name}</h3>
                <p className="text-sm text-slate-400">
                  {done}/{projectTasks.length} concluídas
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400"
                onClick={() => app.deleteProject(project.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${percent}%` }} />
            </div>

            <p className="text-xs text-slate-500">Progresso: {percent}%</p>
          </DarkCard>
        );
      })}
    </div>
  );
}