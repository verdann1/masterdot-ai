import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputDark from "../common/InputDark";
import TextareaDark from "../common/TextareaDark";
import SelectField from "../common/SelectField";

export default function EditTaskSheet({ app }) {
  const task = app.editingTask;

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="absolute bottom-0 left-1/2 max-h-[88vh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-[2rem] border border-slate-800 bg-slate-900 p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Editar atividade</p>
            <h2 className="text-lg font-bold text-white">{task.title}</h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300"
            onClick={() => app.setEditingTask(null)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-3">
          <InputDark
            placeholder="Título"
            value={task.title}
            onChange={(e) => app.setEditingTask({ ...task, title: e.target.value })}
          />

          <TextareaDark
            placeholder="Descritivo"
            value={task.notes || ""}
            onChange={(e) => app.setEditingTask({ ...task, notes: e.target.value })}
          />

          <TextareaDark
            placeholder="Último andamento"
            value={task.progressComment || ""}
            onChange={(e) => app.setEditingTask({ ...task, progressComment: e.target.value })}
          />

          <InputDark
            placeholder="Responsável"
            value={task.responsible || ""}
            onChange={(e) => app.setEditingTask({ ...task, responsible: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-2">
            <InputDark
              type="date"
              value={task.startDate || ""}
              onChange={(e) => app.setEditingTask({ ...task, startDate: e.target.value })}
            />

            <InputDark
              type="date"
              value={task.endDate || ""}
              onChange={(e) => app.setEditingTask({ ...task, endDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SelectField
              value={task.priority}
              onChange={(v) => app.setEditingTask({ ...task, priority: v })}
              options={["Alta", "Média", "Baixa"]}
            />

            <SelectField
              value={task.status}
              onChange={(v) => app.setEditingTask({ ...task, status: v })}
              options={["Aberto", "Em andamento", "Aguardando", "Concluído"]}
            />
          </div>

          <SelectField
            value={task.project}
            onChange={(v) => app.setEditingTask({ ...task, project: v })}
            options={app.projects.map((project) => project.name)}
          />

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