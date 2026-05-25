import { daysUntil } from "../utils/dateUtils";
import { normalizeText } from "../utils/textUtils";

export function getAiPriority(task) {
  const due = daysUntil(task.endDate);
  const text = normalizeText(`${task.title} ${task.project} ${task.notes} ${task.progressComment}`);

  if (task.status === "Concluído") return { priority: task.priority, reason: "Atividade concluída." };
  if (due < 0) return { priority: "Alta", reason: "Atividade atrasada." };
  if (due <= 1) return { priority: "Alta", reason: "Prazo vence hoje ou amanhã." };
  if (text.includes("cliente") || text.includes("urgente") || text.includes("reclamacao")) {
    return { priority: "Alta", reason: "Tema sensível ou urgente." };
  }
  if (!task.responsible) return { priority: "Média", reason: "Sem responsável definido." };

  return { priority: task.priority || "Média", reason: "Sem mudança recomendada." };
}