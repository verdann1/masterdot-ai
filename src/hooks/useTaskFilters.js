import { useState, useMemo } from "react";
import { todayISO } from "../utils/dateUtils";

export function useTaskFilters({ mainTasks, problems }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [projectFilter, setProjectFilter] = useState("Todos");
  const [quickFilter, setQuickFilter] = useState("Todas");

  const today = todayISO();

  const filteredMainTasks = useMemo(() => {
    let filtered = mainTasks.filter((task) => {
      const commentsText = (task.comments || [])
        .map((comment) => comment.text)
        .join(" ");

      const checklistText = (task.checklist || [])
        .map((item) => item.text)
        .join(" ");

      const linkedProblemsText = problems
        .filter((problem) => String(problem.taskId) === String(task.id))
        .map(
          (problem) =>
            `${problem.problem} ${problem.cause} ${problem.action} ${problem.responsible}`
        )
        .join(" ");

      const text = `
        ${task.title}
        ${task.project}
        ${task.notes}
        ${task.responsible}
        ${task.progressComment}
        ${commentsText}
        ${checklistText}
        ${linkedProblemsText}
      `.toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        (statusFilter === "Todos" || task.status === statusFilter) &&
        (priorityFilter === "Todas" || task.priority === priorityFilter) &&
        (projectFilter === "Todos" || task.project === projectFilter)
      );
    });

    if (quickFilter === "Abertas") {
      filtered = filtered.filter((task) => task.status !== "Concluído");
    }
    if (quickFilter === "Concluídas") {
      filtered = filtered.filter((task) => task.status === "Concluído");
    }
    if (quickFilter === "Atrasadas") {
      filtered = filtered.filter(
        (task) =>
          task.status !== "Concluído" && task.endDate && task.endDate < today
      );
    }
    if (quickFilter === "Hoje") {
      filtered = filtered.filter(
        (task) => task.status !== "Concluído" && task.endDate === today
      );
    }
    if (quickFilter === "7 dias") {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 7);
      const limit = limitDate.toISOString().slice(0, 10);
      filtered = filtered.filter(
        (task) =>
          task.status !== "Concluído" &&
          task.endDate &&
          task.endDate >= today &&
          task.endDate <= limit
      );
    }

    return filtered.sort((a, b) => {
      const aDone = a.status === "Concluído";
      const bDone = b.status === "Concluído";
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      const aDate = a.endDate || "9999-12-31";
      const bDate = b.endDate || "9999-12-31";
      return aDate.localeCompare(bDate);
    });
  }, [mainTasks, problems, search, statusFilter, priorityFilter, projectFilter, quickFilter, today]);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    projectFilter,
    setProjectFilter,
    quickFilter,
    setQuickFilter,
    filteredMainTasks,
  };
}
