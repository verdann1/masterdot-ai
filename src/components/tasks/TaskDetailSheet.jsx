import { useState } from "react";
import {
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Clock3,
  PauseCircle,
  MessageCircle,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import InfoBox from "../common/infoBox";
import CommentBlock from "./CommentBlock";
import ChecklistBlock from "./ChecklistBlock";
import EvidenceBlock from "./EvidenceBlock";

import { formatDateBR } from "../../utils/dateUtils";
import { priorityColor, statusColor, isToday, isLate } from "./taskStyles";

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl bg-slate-950 p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

const ACTION_COLOR = {
  status:  "bg-blue-400",
  comment: "bg-blue-400",
  edit:    "bg-amber-400",
};

export default function TaskDetailSheet({ app }) {
  const [showHistory, setShowHistory] = useState(false);
  const task = app.tasks.find((item) => String(item.id) === String(app.selectedTaskId));
  if (!task) return null;

  const linkedProblems = app.problems.filter(
    (problem) => String(problem.taskId) === String(task.id)
  );

  const late = isLate(task);
  const today = isToday(task.endDate);
  const done = task.status === "Concluído";
  const progress = task.progress ?? null;

  async function setStatus(status) {
    await app.updateTaskStatus(task.id, status);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] border-t border-slate-800 bg-slate-950 p-4">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge className={`rounded-full border ${priorityColor(task.priority)}`}>
                {task.priority}
              </Badge>
              <Badge className={`rounded-full border ${statusColor(task.status)}`}>
                {task.status}
              </Badge>
              {today && (
                <Badge className="rounded-full border border-blue-500/40 bg-blue-500/20 text-blue-300">
                  Hoje
                </Badge>
              )}
              {late && (
                <Badge className="rounded-full border border-red-500/40 bg-red-500/20 text-red-300">
                  Atrasada
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold leading-tight text-white">{task.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{task.project || "Sem projeto"}</p>
          </div>
          <button
            onClick={() => app.setSelectedTaskId(null)}
            className="rounded-2xl bg-slate-900 p-2 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-slate-950 p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Responsáveis</p>
            {(() => {
              const list = Array.isArray(task.responsibles) && task.responsibles.length
                ? task.responsibles
                : task.responsible
                ? [task.responsible]
                : [];
              return list.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {list.map((r) => (
                    <span key={r} className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-300">
                      {r}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm font-medium text-slate-400">Sem responsável</p>
              );
            })()}
          </div>
          <Field label="Tipo" value={task.type} />
          <Field label="Início" value={formatDateBR(task.startDate)} />
          <Field label="Fim" value={formatDateBR(task.endDate)} />
        </div>

        {/* Progress bar */}
        {typeof progress === "number" && (
          <div className="mt-2 rounded-2xl bg-slate-950 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Progresso</p>
              <span className={`text-sm font-bold ${done ? "text-emerald-300" : "text-blue-300"}`}>
                {done ? "Concluída" : `${progress}%`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  done || progress >= 100 ? "bg-emerald-500" :
                  progress >= 50          ? "bg-blue-500"    :
                  progress > 0            ? "bg-orange-500"  : "bg-slate-700"
                }`}
                style={{ width: `${done ? 100 : progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 space-y-2">
          {/* Edit */}
          <Button
            className="h-11 w-full rounded-2xl bg-slate-100 text-slate-950"
            onClick={() => { app.setSelectedTaskId(null); app.setEditingTask(task); }}
          >
            <Pencil className="mr-1 h-4 w-4" />
            Editar atividade
          </Button>

          {/* Status row */}
          <div className="grid grid-cols-3 gap-2">
            {!done ? (
              <Button
                className="h-11 rounded-2xl bg-emerald-500 text-white"
                onClick={async () => { await setStatus("Concluído"); app.setSelectedTaskId(null); app.setActiveTab("home"); }}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Concluir
              </Button>
            ) : (
              <Button
                className="h-11 rounded-2xl bg-slate-700 text-white"
                onClick={async () => { await setStatus("Aberto"); app.setSelectedTaskId(null); }}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Reabrir
              </Button>
            )}

            <Button
              className="h-11 rounded-2xl bg-blue-600 text-white"
              onClick={() => setStatus("Em andamento")}
            >
              <Clock3 className="mr-1 h-4 w-4" />
              Andamento
            </Button>

            <Button
              className="h-11 rounded-2xl bg-purple-600 text-white"
              onClick={() => setStatus("Aguardando")}
            >
              <PauseCircle className="mr-1 h-4 w-4" />
              Aguardar
            </Button>
          </div>
        </div>

        {/* Share */}
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Compartilhar atividade
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => app.shareTaskWhatsApp(task)}
              className="flex h-12 flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 active:opacity-70"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-[10px] font-semibold">WhatsApp</span>
            </button>
            <button
              onClick={() => app.shareTaskPdf(task)}
              className="flex h-12 flex-col items-center justify-center gap-1 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300 active:opacity-70"
            >
              <FileText className="h-4 w-4" />
              <span className="text-[10px] font-semibold">PDF</span>
            </button>
            <button
              onClick={() => app.shareTaskExcel(task)}
              className="flex h-12 flex-col items-center justify-center gap-1 rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-300 active:opacity-70"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-[10px] font-semibold">Excel</span>
            </button>
          </div>
        </div>

        {/* Notes & progress comment */}
        {task.notes && (
          <div className="mt-4">
            <InfoBox title="Descritivo" text={task.notes} />
          </div>
        )}

        {task.progressComment && (
          <div className="mt-3">
            <InfoBox title="Último andamento" text={task.progressComment} />
          </div>
        )}

        {/* Blocks */}
        <div className="mt-4 space-y-3">
          <CommentBlock app={app} task={task} />
          <ChecklistBlock app={app} task={task} />
          <EvidenceBlock app={app} task={task} />
        </div>

        {/* Linked problems */}
        {linkedProblems.length > 0 && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-red-300">
              Problemas vinculados
            </p>
            <div className="space-y-2">
              {linkedProblems.map((problem) => (
                <div key={problem.id} className="rounded-xl bg-slate-950 p-3">
                  <p className="text-sm font-semibold text-white">{problem.problem}</p>
                  {problem.action && (
                    <p className="mt-1 text-xs text-slate-400">Ação: {problem.action}</p>
                  )}
                  {problem.responsible && (
                    <p className="mt-1 text-xs text-slate-500">Resp.: {problem.responsible}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {(task.history?.length > 0) && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Histórico de alterações ({task.history.length})
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-600 transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`}
              />
            </button>

            {showHistory && (
              <div className="mt-3 space-y-1.5">
                {[...task.history].reverse().map((h) => (
                  <div key={h.id} className="flex items-start gap-2.5 rounded-xl bg-slate-900 px-3 py-2">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${ACTION_COLOR[h.action] || "bg-slate-500"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-slate-300 break-words">{h.detail}</p>
                      <p className="mt-0.5 text-[10px] text-slate-600">{h.at}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete */}
        <Button
          variant="outline"
          className="mt-4 h-11 w-full rounded-2xl border-red-500/40 bg-red-500/10 text-red-300"
          onClick={() => { app.setSelectedTaskId(null); app.deleteTask(task.id); }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir atividade
        </Button>
      </div>
    </div>
  );
}
