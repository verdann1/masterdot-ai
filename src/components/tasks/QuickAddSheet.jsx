import {
  ClipboardList,
  FolderKanban,
  AlertTriangle,
  Database,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import InputDark from "../common/InputDark";
import TextareaDark from "../common/TextareaDark";
import SelectField from "../common/SelectField";

export default function QuickAddSheet({ app }) {
  const mode = app.quickMode;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] border-t border-slate-800 bg-slate-950 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-3">
              {mode === "task" && (
                <ClipboardList className="text-cyan-400" />
              )}

              {mode === "project" && (
                <FolderKanban className="text-orange-400" />
              )}

              {mode === "problem" && (
                <AlertTriangle className="text-red-400" />
              )}

              {mode === "knowledge" && (
                <Database className="text-emerald-400" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === "task" && "Nova atividade"}
                {mode === "project" && "Novo projeto"}
                {mode === "problem" && "Novo problema"}
                {mode === "knowledge" && "Nova base"}
              </h2>

              <p className="text-sm text-slate-400">
                Preencha as informações abaixo
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

        {/* TASK */}

        {mode === "task" && (
          <div className="space-y-3">
            <InputDark
              placeholder="Título da atividade"
              value={app.taskForm.title}
              onChange={(e) =>
                app.setTaskForm({
                  ...app.taskForm,
                  title: e.target.value,
                })
              }
            />

            <SelectField
              value={app.taskForm.parentId}
              onChange={(v) =>
                app.setTaskForm({
                  ...app.taskForm,
                  parentId: v,
                })
              }
              options={[
                "",
                ...app.tasks
                  .filter((task) => task.parentId === null)
                  .map((task) => String(task.id)),
              ]}
              labels={{
                "": "Atividade primária",
                ...Object.fromEntries(
                  app.tasks
                    .filter((task) => task.parentId === null)
                    .map((task) => [
                      String(task.id),
                      task.title,
                    ])
                ),
              }}
            />

            <SelectField
              value={app.taskForm.project}
              onChange={(v) =>
                app.setTaskForm({
                  ...app.taskForm,
                  project: v,
                })
              }
              options={app.projects.map((project) => project.name)}
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                value={app.taskForm.priority}
                onChange={(v) =>
                  app.setTaskForm({
                    ...app.taskForm,
                    priority: v,
                  })
                }
                options={[
                  "Baixa",
                  "Média",
                  "Alta",
                ]}
              />

              <SelectField
                value={app.taskForm.status}
                onChange={(v) =>
                  app.setTaskForm({
                    ...app.taskForm,
                    status: v,
                  })
                }
                options={[
                  "Aberto",
                  "Em andamento",
                  "Concluído",
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputDark
                type="date"
                value={app.taskForm.startDate}
                onChange={(e) =>
                  app.setTaskForm({
                    ...app.taskForm,
                    startDate: e.target.value,
                  })
                }
              />

              <InputDark
                type="date"
                value={app.taskForm.endDate}
                onChange={(e) =>
                  app.setTaskForm({
                    ...app.taskForm,
                    endDate: e.target.value,
                  })
                }
              />
            </div>

            <InputDark
              placeholder="Responsável"
              value={app.taskForm.responsible}
              onChange={(e) =>
                app.setTaskForm({
                  ...app.taskForm,
                  responsible: e.target.value,
                })
              }
            />

            <TextareaDark
              placeholder="Descrição"
              value={app.taskForm.notes}
              onChange={(e) =>
                app.setTaskForm({
                  ...app.taskForm,
                  notes: e.target.value,
                })
              }
            />

            <TextareaDark
              placeholder="Comentário inicial"
              value={app.taskForm.progressComment}
              onChange={(e) =>
                app.setTaskForm({
                  ...app.taskForm,
                  progressComment: e.target.value,
                })
              }
            />

            <Button
              className="h-12 w-full rounded-2xl bg-slate-100 text-slate-950"
              onClick={app.addTask}
            >
              Salvar atividade
            </Button>
          </div>
        )}

        {/* PROJECT */}

        {mode === "project" && (
          <div className="space-y-3">
            <InputDark
              placeholder="Nome do projeto"
              value={app.projectForm.name}
              onChange={(e) =>
                app.setProjectForm({
                  ...app.projectForm,
                  name: e.target.value,
                })
              }
            />

            <SelectField
              value={app.projectForm.color}
              onChange={(v) =>
                app.setProjectForm({
                  ...app.projectForm,
                  color: v,
                })
              }
              options={[
                "blue",
                "orange",
                "emerald",
                "red",
                "purple",
              ]}
            />

            <Button
              className="h-12 w-full rounded-2xl bg-slate-100 text-slate-950"
              onClick={app.addProject}
            >
              Salvar projeto
            </Button>
          </div>
        )}

        {/* PROBLEM */}

        {mode === "problem" && (
          <div className="space-y-3">
            <SelectField
              value={app.problemForm.taskId}
              onChange={(v) =>
                app.setProblemForm({
                  ...app.problemForm,
                  taskId: v,
                })
              }
              options={[
                "",
                ...app.tasks.map((task) =>
                  String(task.id)
                ),
              ]}
              labels={{
                "": "Sem vínculo com atividade",
                ...Object.fromEntries(
                  app.tasks.map((task) => [
                    String(task.id),
                    task.title,
                  ])
                ),
              }}
            />

            <InputDark
              placeholder="Produto / área"
              value={app.problemForm.product}
              onChange={(e) =>
                app.setProblemForm({
                  ...app.problemForm,
                  product: e.target.value,
                })
              }
            />

            <InputDark
              placeholder="Linha / setor"
              value={app.problemForm.line}
              onChange={(e) =>
                app.setProblemForm({
                  ...app.problemForm,
                  line: e.target.value,
                })
              }
            />

            <TextareaDark
              placeholder="Descrição do problema"
              value={app.problemForm.problem}
              onChange={(e) =>
                app.setProblemForm({
                  ...app.problemForm,
                  problem: e.target.value,
                })
              }
            />

            <TextareaDark
              placeholder="Causa"
              value={app.problemForm.cause}
              onChange={(e) =>
                app.setProblemForm({
                  ...app.problemForm,
                  cause: e.target.value,
                })
              }
            />

            <TextareaDark
              placeholder="Ação"
              value={app.problemForm.action}
              onChange={(e) =>
                app.setProblemForm({
                  ...app.problemForm,
                  action: e.target.value,
                })
              }
            />

            <InputDark
              placeholder="Responsável"
              value={app.problemForm.responsible}
              onChange={(e) =>
                app.setProblemForm({
                  ...app.problemForm,
                  responsible: e.target.value,
                })
              }
            />

            <InputDark
              type="date"
              value={app.problemForm.due}
              onChange={(e) =>
                app.setProblemForm({
                  ...app.problemForm,
                  due: e.target.value,
                })
              }
            />

            <Button
              className="h-12 w-full rounded-2xl bg-slate-100 text-slate-950"
              onClick={app.addProblem}
            >
              Salvar problema
            </Button>
          </div>
        )}

        {/* KNOWLEDGE */}

        {mode === "knowledge" && (
          <div className="space-y-3">
            <SelectField
              value={app.knowledgeForm.category}
              onChange={(v) =>
                app.setKnowledgeForm({
                  ...app.knowledgeForm,
                  category: v,
                })
              }
              options={[
                "Geral",
                "Projeto",
                "Processo",
                "Lição aprendida",
              ]}
            />

            <InputDark
              placeholder="Título"
              value={app.knowledgeForm.title}
              onChange={(e) =>
                app.setKnowledgeForm({
                  ...app.knowledgeForm,
                  title: e.target.value,
                })
              }
            />

            <TextareaDark
              placeholder="Conteúdo"
              value={app.knowledgeForm.content}
              onChange={(e) =>
                app.setKnowledgeForm({
                  ...app.knowledgeForm,
                  content: e.target.value,
                })
              }
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