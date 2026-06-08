import { useState } from "react";
import {
  ClipboardList,
  FolderKanban,
  AlertTriangle,
  Database,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import InputDark from "../common/InputDark";
import TextareaDark from "../common/TextareaDark";
import SelectField from "../common/SelectField";

// ─── step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === current
              ? "w-5 bg-cyan-400"
              : i < current
              ? "w-1.5 bg-cyan-600"
              : "w-1.5 bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

// ─── task form in 2 steps ─────────────────────────────────────────────────────

function TaskForm({ app, onClose }) {
  const [step, setStep] = useState(0);

  const form = app.taskForm;
  const set = (field, value) => app.setTaskForm({ ...form, [field]: value });

  const step1Valid = form.title.trim().length > 0;

  return (
    <div className="space-y-4">
      <StepDots current={step} total={2} />

      {step === 0 && (
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Título *
            </p>
            <InputDark
              placeholder="Ex: Revisar procedimento de setup"
              value={form.title}
              autoFocus
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Projeto
            </p>
            <SelectField
              value={form.project}
              onChange={(v) => set("project", v)}
              options={app.projects.map((p) => p.name)}
            />
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Subatividade de
            </p>
            <SelectField
              value={form.parentId}
              onChange={(v) => set("parentId", v)}
              options={["", ...app.tasks.filter((t) => t.parentId === null).map((t) => String(t.id))]}
              labels={{
                "": "Atividade primária",
                ...Object.fromEntries(
                  app.tasks.filter((t) => t.parentId === null).map((t) => [String(t.id), t.title])
                ),
              }}
            />
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Responsável
            </p>
            <InputDark
              placeholder="Nome do responsável"
              value={form.responsible}
              onChange={(e) => set("responsible", e.target.value)}
            />
          </div>

          <button
            disabled={!step1Valid}
            onClick={() => setStep(1)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 text-sm font-bold text-white disabled:opacity-30"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Início *
              </p>
              <InputDark
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Prazo *
              </p>
              <InputDark
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Prioridade
              </p>
              <SelectField
                value={form.priority}
                onChange={(v) => set("priority", v)}
                options={["Baixa", "Média", "Alta"]}
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Status
              </p>
              <SelectField
                value={form.status}
                onChange={(v) => set("status", v)}
                options={["Aberto", "Em andamento", "Aguardando", "Concluído"]}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              % Progresso
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={form.progress ?? 0}
                onChange={(e) => set("progress", Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-400"
              />
              <span className="min-w-[36px] text-right text-sm font-bold text-cyan-300">
                {form.progress ?? 0}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all"
                style={{ width: `${form.progress ?? 0}%` }}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Descrição
            </p>
            <TextareaDark
              placeholder="Detalhes, escopo, contexto..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Primeiro andamento
            </p>
            <TextareaDark
              placeholder="Como está o andamento inicial?"
              value={form.progressComment}
              onChange={(e) => set("progressComment", e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(0)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <Button
              disabled={app.saving}
              className="h-12 flex-1 rounded-2xl bg-slate-100 text-slate-950 disabled:opacity-50"
              onClick={app.addTask}
            >
              {app.saving ? "Salvando..." : "Salvar atividade"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── main sheet ───────────────────────────────────────────────────────────────

export default function QuickAddSheet({ app }) {
  const mode = app.quickMode;

  const problemTasks = app.tasks.filter(
    (task) => !app.problemForm.project || task.project === app.problemForm.project
  );

  const selectedProblemTask = app.tasks.find(
    (task) => String(task.id) === String(app.problemForm.taskId)
  );

  const modeConfig = {
    task:      { icon: <ClipboardList className="text-cyan-400" />,    title: "Nova atividade"  },
    project:   { icon: <FolderKanban className="text-orange-400" />,   title: "Novo projeto"    },
    problem:   { icon: <AlertTriangle className="text-red-400" />,     title: "Novo problema"   },
    knowledge: { icon: <Database className="text-emerald-400" />,      title: "Nova base"       },
  };

  const cfg = modeConfig[mode] || modeConfig.task;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] border-t border-slate-800 bg-slate-950 p-4">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-3">{cfg.icon}</div>
            <div>
              <h2 className="text-lg font-bold text-white">{cfg.title}</h2>
              <p className="text-xs text-slate-500">
                {mode === "task" ? "Preencha as etapas abaixo" : "Preencha as informações abaixo"}
              </p>
            </div>
          </div>
          <button
            onClick={() => app.setShowQuickAdd(false)}
            className="rounded-2xl bg-slate-900 p-2 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task — 2-step form */}
        {mode === "task" && <TaskForm app={app} onClose={() => app.setShowQuickAdd(false)} />}

        {/* Project */}
        {mode === "project" && (
          <div className="space-y-3">
            <InputDark
              placeholder="Nome do projeto"
              value={app.projectForm.name}
              onChange={(e) => app.setProjectForm({ ...app.projectForm, name: e.target.value })}
            />
            <SelectField
              value={app.projectForm.color}
              onChange={(v) => app.setProjectForm({ ...app.projectForm, color: v })}
              options={["blue", "orange", "emerald", "red", "purple"]}
            />
            <Button
              className="h-12 w-full rounded-2xl bg-slate-100 text-slate-950"
              onClick={app.addProject}
            >
              Salvar projeto
            </Button>
          </div>
        )}

        {/* Problem */}
        {mode === "problem" && (
          <div className="space-y-3">
            <SelectField
              value={app.problemForm.project || ""}
              onChange={(v) => app.setProblemForm({ ...app.problemForm, project: v, taskId: "" })}
              options={["", ...app.projects.map((p) => p.name)]}
              labels={{ "": "Selecione o projeto" }}
            />
            <SelectField
              value={app.problemForm.taskId}
              onChange={(v) => app.setProblemForm({ ...app.problemForm, taskId: v })}
              options={["", ...problemTasks.map((t) => String(t.id))]}
              labels={{
                "": "Sem vínculo com atividade",
                ...Object.fromEntries(problemTasks.map((t) => [String(t.id), t.title])),
              }}
            />
            {selectedProblemTask && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                <p className="text-xs font-semibold text-cyan-300">Atividade selecionada</p>
                <p className="mt-1 text-sm font-bold text-white">{selectedProblemTask.title}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <p><span className="text-slate-500">Projeto:</span> {selectedProblemTask.project || "-"}</p>
                  <p><span className="text-slate-500">Status:</span> {selectedProblemTask.status || "-"}</p>
                  <p><span className="text-slate-500">Resp.:</span> {selectedProblemTask.responsible || "-"}</p>
                  <p><span className="text-slate-500">Prazo:</span> {selectedProblemTask.endDate || "-"}</p>
                </div>
              </div>
            )}
            <InputDark
              placeholder="Produto / área"
              value={app.problemForm.product}
              onChange={(e) => app.setProblemForm({ ...app.problemForm, product: e.target.value })}
            />
            <InputDark
              placeholder="Linha / setor"
              value={app.problemForm.line}
              onChange={(e) => app.setProblemForm({ ...app.problemForm, line: e.target.value })}
            />
            <TextareaDark
              placeholder="Descrição do problema"
              value={app.problemForm.problem}
              onChange={(e) => app.setProblemForm({ ...app.problemForm, problem: e.target.value })}
            />
            <TextareaDark
              placeholder="Causa"
              value={app.problemForm.cause}
              onChange={(e) => app.setProblemForm({ ...app.problemForm, cause: e.target.value })}
            />
            <TextareaDark
              placeholder="Ação"
              value={app.problemForm.action}
              onChange={(e) => app.setProblemForm({ ...app.problemForm, action: e.target.value })}
            />
            <InputDark
              placeholder="Responsável"
              value={app.problemForm.responsible}
              onChange={(e) => app.setProblemForm({ ...app.problemForm, responsible: e.target.value })}
            />
            <InputDark
              type="date"
              value={app.problemForm.due}
              onChange={(e) => app.setProblemForm({ ...app.problemForm, due: e.target.value })}
            />
            <Button
              className="h-12 w-full rounded-2xl bg-slate-100 text-slate-950"
              onClick={app.addProblem}
            >
              Salvar problema
            </Button>
          </div>
        )}

        {/* Knowledge */}
        {mode === "knowledge" && (
          <div className="space-y-3">
            <SelectField
              value={app.knowledgeForm.category}
              onChange={(v) => app.setKnowledgeForm({ ...app.knowledgeForm, category: v })}
              options={["Geral", "Projeto", "Processo", "Lição aprendida"]}
            />
            <InputDark
              placeholder="Título"
              value={app.knowledgeForm.title}
              onChange={(e) => app.setKnowledgeForm({ ...app.knowledgeForm, title: e.target.value })}
            />
            <TextareaDark
              placeholder="Conteúdo"
              value={app.knowledgeForm.content}
              onChange={(e) => app.setKnowledgeForm({ ...app.knowledgeForm, content: e.target.value })}
            />
            <Button
              className="h-12 w-full rounded-2xl bg-slate-100 text-slate-950"
              onClick={app.addKnowledge}
            >
              Salvar base
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
