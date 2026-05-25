export function statusColor(status) {
  if (status === "Concluído") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (status === "Em andamento") return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  if (status === "Aguardando") return "bg-purple-500/15 text-purple-300 border-purple-500/30";
  return "bg-amber-500/15 text-amber-300 border-amber-500/30";
}

export function priorityColor(priority) {
  if (priority === "Alta") return "bg-red-500/15 text-red-300 border-red-500/30";
  if (priority === "Média") return "bg-orange-500/15 text-orange-300 border-orange-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}