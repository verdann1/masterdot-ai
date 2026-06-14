import { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import InputDark from "../common/InputDark";
import TextareaDark from "../common/TextareaDark";
import SelectField from "../common/SelectField";

export default function EditProblemSheet({ app }) {
  const { editingProblem, setEditingProblem, updateProblem, projects, tasks } = app;

  const [form, setForm] = useState({
    project: "", taskId: "", product: "", line: "",
    problem: "", cause: "", action: "", responsible: "", due: "",
  });

  useEffect(() => {
    if (editingProblem) {
      setForm({
        project:     editingProblem.project     || "",
        taskId:      editingProblem.taskId      || "",
        product:     editingProblem.product     || "",
        line:        editingProblem.line        || "",
        problem:     editingProblem.problem     || "",
        cause:       editingProblem.cause       || "",
        action:      editingProblem.action      || "",
        responsible: editingProblem.responsible || "",
        due:         editingProblem.due         || "",
      });
    }
  }, [editingProblem]);

  if (!editingProblem) return null;

  const linkedTasks = tasks.filter((t) => !form.project || t.project === form.project);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.problem.trim()) return;
    updateProblem(editingProblem.id, form);
    setEditingProblem(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] border-t border-slate-800 bg-slate-950 p-4"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-500/15 p-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Editar problema</h2>
              <p className="text-xs text-slate-500">Atualize as informações</p>
            </div>
          </div>
          <button
            onClick={() => setEditingProblem(null)}
            className="rounded-2xl bg-slate-900 p-2 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <SelectField
            value={form.project}
            onChange={(v) => setForm((prev) => ({ ...prev, project: v, taskId: "" }))}
            options={["", ...projects.map((p) => p.name)]}
            labels={{ "": "Selecione o projeto" }}
          />
          <SelectField
            value={form.taskId}
            onChange={(v) => set("taskId", v)}
            options={["", ...linkedTasks.map((t) => String(t.id))]}
            labels={{
              "": "Sem vínculo com atividade",
              ...Object.fromEntries(linkedTasks.map((t) => [String(t.id), t.title])),
            }}
          />
          <InputDark
            placeholder="Produto / área"
            value={form.product}
            onChange={(e) => set("product", e.target.value)}
          />
          <InputDark
            placeholder="Linha / setor"
            value={form.line}
            onChange={(e) => set("line", e.target.value)}
          />
          <TextareaDark
            placeholder="Descrição do problema *"
            value={form.problem}
            onChange={(e) => set("problem", e.target.value)}
          />
          <TextareaDark
            placeholder="Causa raiz"
            value={form.cause}
            onChange={(e) => set("cause", e.target.value)}
          />
          <TextareaDark
            placeholder="Ação corretiva"
            value={form.action}
            onChange={(e) => set("action", e.target.value)}
          />
          <InputDark
            placeholder="Responsável pela ação"
            value={form.responsible}
            onChange={(e) => set("responsible", e.target.value)}
          />
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Prazo</p>
            <InputDark
              type="date"
              value={form.due}
              onChange={(e) => set("due", e.target.value)}
            />
          </div>
          <Button
            disabled={!form.problem.trim()}
            className="h-12 w-full rounded-2xl bg-slate-100 text-slate-950 disabled:opacity-40"
            onClick={handleSave}
          >
            Atualizar problema
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
