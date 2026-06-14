import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputDark from "../common/InputDark";
import TextareaDark from "../common/TextareaDark";
import SelectField from "../common/SelectField";
import ResponsiblesInput from "../common/ResponsiblesInput";
import { progressColor } from "./taskStyles";

export default function EditTaskSheet({ app }) {
  const task = app.editingTask;
  if (!task) return null;

  const set = (field, value) => app.setEditingTask({ ...task, [field]: value });

  const progress = task.progress ?? 0;
  const responsibles = Array.isArray(task.responsibles)
    ? task.responsibles
    : task.responsible
    ? [task.responsible]
    : [];

  function setResponsibles(arr) {
    app.setEditingTask({ ...task, responsibles: arr, responsible: arr[0] || "" });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="absolute bottom-0 left-1/2 max-h-[92vh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-[2rem] border-t border-slate-800 bg-slate-950 p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Editar atividade</p>
            <h2 className="text-lg font-bold text-white">{task.title}</h2>
          </div>
          <button
            className="rounded-2xl bg-slate-900 p-2 text-slate-400"
            onClick={() => app.setEditingTask(null)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Título</p>
            <InputDark
              placeholder="Título"
              value={task.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Responsáveis</p>
            <ResponsiblesInput value={responsibles} onChange={setResponsibles} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Início</p>
              <InputDark type="date" value={task.startDate || ""} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Prazo</p>
              <InputDark type="date" value={task.endDate || ""} onChange={(e) => set("endDate", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Prioridade</p>
              <SelectField
                value={task.priority}
                onChange={(v) => set("priority", v)}
                options={["Alta", "Média", "Baixa"]}
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <SelectField
                value={task.status}
                onChange={(v) => set("status", v)}
                options={["Aberto", "Em andamento", "Aguardando", "Concluído"]}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Projeto</p>
            <SelectField
              value={task.project}
              onChange={(v) => set("project", v)}
              options={app.projects.map((p) => p.name)}
            />
          </div>

          {/* Progress slider */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">% Progresso</p>
              <span className="text-sm font-bold text-blue-300">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => set("progress", Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-blue-400"
            />
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${progressColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Descritivo</p>
            <TextareaDark
              placeholder="Detalhes, escopo, contexto..."
              value={task.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Último andamento</p>
            <TextareaDark
              placeholder="Como está o andamento?"
              value={task.progressComment || ""}
              onChange={(e) => set("progressComment", e.target.value)}
            />
          </div>

          <Button
            onClick={app.saveEditedTask}
            className="h-12 w-full rounded-2xl bg-slate-100 text-slate-950 hover:bg-white"
          >
            Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
