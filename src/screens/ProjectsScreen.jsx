import { useState } from "react";
import { BarChart3, Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DarkCard from "../components/common/DarkCard";
import InputDark from "../components/common/InputDark";
import ProjectDashboardSheet from "../components/projects/ProjectDashboardSheet";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export default function ProjectsScreen({ app }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingName, setEditingName] = useState("");

  function startEdit(project) {
    setEditingProjectId(project.id);
    setEditingName(project.name || "");
  }

  function cancelEdit() {
    setEditingProjectId(null);
    setEditingName("");
  }

  function saveEdit(project) {
    const name = editingName.trim();

    if (!name) return;

    app.updateProject(project.id, {
      name,
    });

    setEditingProjectId(null);
    setEditingName("");
  }

  return (
    <>
      <div className="space-y-3">
        {app.projects.map((project) => {
          const editing = editingProjectId === project.id;

          const projectTasks = app.tasks.filter(
            (task) => normalize(task.project) === normalize(project.name)
          );

          const done = projectTasks.filter(
            (task) => task.status === "Concluído"
          ).length;

          const open = projectTasks.filter(
            (task) => task.status !== "Concluído"
          ).length;

          const late = projectTasks.filter(
            (task) =>
              task.status !== "Concluído" &&
              task.endDate &&
              task.endDate < new Date().toISOString().slice(0, 10)
          ).length;

          const percent = projectTasks.length
            ? Math.round((done / projectTasks.length) * 100)
            : 0;

          return (
            <DarkCard key={project.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <InputDark
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Nome do projeto"
                    />
                  ) : (
                    <>
                      <h3 className="font-semibold text-white">
                        {project.name}
                      </h3>

                      <p className="text-sm text-slate-400">
                        {done}/{projectTasks.length} concluídas
                      </p>
                    </>
                  )}
                </div>

                <div className="flex gap-1">
                  {editing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-emerald-400"
                        onClick={() => saveEdit(project)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400"
                        onClick={cancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400"
                        onClick={() => startEdit(project)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400"
                        onClick={() => app.deleteProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-slate-950 p-2">
                  <p className="text-xs text-slate-500">Abertas</p>
                  <p className="font-bold text-white">{open}</p>
                </div>

                <div className="rounded-2xl bg-slate-950 p-2">
                  <p className="text-xs text-slate-500">Atrasadas</p>
                  <p className="font-bold text-red-400">{late}</p>
                </div>

                <div className="rounded-2xl bg-slate-950 p-2">
                  <p className="text-xs text-slate-500">Progresso</p>
                  <p className="font-bold text-cyan-400">{percent}%</p>
                </div>
              </div>

              {!editing && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-cyan-500/15 text-sm font-medium text-cyan-300"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Dashboard
                  </button>

                  <button
                    onClick={() => {
                      app.setSearch(project.name);
                      app.setActiveTab("tasks");
                    }}
                    className="h-10 rounded-2xl bg-slate-800 text-sm font-medium text-slate-100"
                  >
                    Ver atividades
                  </button>
                </div>
              )}
            </DarkCard>
          );
        })}
      </div>

      {selectedProject && (
        <ProjectDashboardSheet
          app={app}
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
}