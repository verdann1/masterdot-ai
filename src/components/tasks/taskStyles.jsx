export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getDueState(task) {
  const today = todayISO();
  const limit7 = addDays(today, 7);

  if (task.status === "Concluído") {
    return {
      label: "Concluída",
      tone: "green",
      className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    };
  }

  if (task.endDate && task.endDate < today) {
    return {
      label: "Atrasada",
      tone: "red",
      className: "border-red-500/40 bg-red-500/15 text-red-300",
    };
  }

  if (task.endDate === today) {
    return {
      label: "Vence hoje",
      tone: "cyan",
      className: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
    };
  }

  if (task.endDate && task.endDate > today && task.endDate <= limit7) {
    return {
      label: "7 dias",
      tone: "yellow",
      className: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
    };
  }

  return {
    label: "No prazo",
    tone: "slate",
    className: "border-slate-700 bg-slate-800/60 text-slate-300",
  };
}

export function statusColor(status) {
  if (status === "Concluído") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }

  if (status === "Em andamento") {
    return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  }

  if (status === "Aguardando") {
    return "bg-purple-500/15 text-purple-300 border-purple-500/30";
  }

  return "bg-amber-500/15 text-amber-300 border-amber-500/30";
}

export function priorityColor(priority) {
  if (priority === "Alta") {
    return "bg-red-500/15 text-red-300 border-red-500/30";
  }

  if (priority === "Média") {
    return "bg-orange-500/15 text-orange-300 border-orange-500/30";
  }

  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

export function priorityBorder(priority, status) {
  if (status === "Concluído") {
    return "border-emerald-500/40 opacity-80";
  }

  if (priority === "Alta") {
    return "border-red-500/70 shadow-red-500/10";
  }

  if (priority === "Média") {
    return "border-orange-500/60 shadow-orange-500/10";
  }

  return "border-slate-700";
}

export function progressColor(percent) {
  if (percent >= 100) return "bg-emerald-500";
  if (percent >= 50) return "bg-blue-500";
  if (percent > 0) return "bg-orange-500";
  return "bg-slate-700";
}

export function isToday(date) {
  if (!date) return false;
  return date === todayISO();
}

export function isLate(task) {
  if (!task?.endDate) return false;
  return task.status !== "Concluído" && task.endDate < todayISO();
}