import * as XLSX from "xlsx";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateBR(date) {
  if (!date) return "";
  const [year, month, day] = String(date).split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function workbookToBase64(workbook) {
  const binary = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "binary",
  });

  let buffer = "";

  for (let i = 0; i < binary.length; i++) {
    buffer += String.fromCharCode(binary.charCodeAt(i) & 0xff);
  }

  return btoa(buffer);
}

function taskRows(tasks) {
  return tasks.map((task) => ({
    Projeto: task.project || "",
    Atividade: task.title || "",
    Responsável: task.responsible || "",
    Prioridade: task.priority || "",
    Status: task.status || "",
    Início: formatDateBR(task.startDate),
    Fim: formatDateBR(task.endDate),
    Comentário: task.progressComment || "",
    Checklist: (task.checklist || [])
      .map((item) => `${item.done ? "[x]" : "[ ]"} ${item.text}`)
      .join("; "),
  }));
}

function appendSheet(workbook, name, rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 45 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 50 },
    { wch: 70 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, name);
}

async function saveAndShareWorkbook(workbook, fileName, title) {
  const date = todayISO();
  const finalName = `${fileName}-${date}.xlsx`;
  const base64Data = workbookToBase64(workbook);

  const savedFile = await Filesystem.writeFile({
    path: finalName,
    data: base64Data,
    directory: Directory.Cache,
  });

  try {
    await Share.share({
      title,
      text: "Arquivo Excel exportado pelo MetaPulse.",
      url: savedFile.uri,
      dialogTitle: "Salvar ou compartilhar Excel",
    });
  } catch (err) {
    const msg = (err?.message || "").toLowerCase();
    if (!msg.includes("cancel") && !msg.includes("dismiss") && !msg.includes("abort")) throw err;
  }

  return savedFile.uri;
}

export async function shareTaskAsExcel(task, subtasks = []) {
  const responsibles = Array.isArray(task.responsibles) && task.responsibles.length
    ? task.responsibles.join(", ")
    : task.responsible || "-";

  const detailRows = [
    { Campo: "Título",           Valor: task.title || "-" },
    { Campo: "Projeto",          Valor: task.project || "-" },
    { Campo: "Responsável",      Valor: responsibles },
    { Campo: "Status",           Valor: task.status || "-" },
    { Campo: "Prioridade",       Valor: task.priority || "-" },
    { Campo: "Início",           Valor: formatDateBR(task.startDate) },
    { Campo: "Prazo",            Valor: formatDateBR(task.endDate) },
    { Campo: "Progresso",        Valor: `${task.progress ?? 0}%` },
    { Campo: "Descritivo",       Valor: task.notes || "-" },
    { Campo: "Último andamento", Valor: task.progressComment || "-" },
  ];

  const wb = XLSX.utils.book_new();

  const detailSheet = XLSX.utils.json_to_sheet(detailRows);
  detailSheet["!cols"] = [{ wch: 22 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, detailSheet, "Atividade");

  if (task.checklist?.length) {
    const checkRows = task.checklist.map((i) => ({ Feito: i.done ? "✓" : "◻", Item: i.text }));
    const cs = XLSX.utils.json_to_sheet(checkRows);
    cs["!cols"] = [{ wch: 8 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, cs, "Checklist");
  }

  if (task.comments?.length) {
    const comRows = task.comments.map((c) => ({ Data: c.date, Comentário: c.text }));
    const cms = XLSX.utils.json_to_sheet(comRows);
    cms["!cols"] = [{ wch: 22 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, cms, "Comentários");
  }

  if (subtasks.length) {
    appendSheet(wb, "Subatividades", taskRows(subtasks));
  }

  const safeName = (task.title || "atividade").replace(/[^\w]/g, "-").slice(0, 30);
  return saveAndShareWorkbook(wb, `masterdot-${safeName}`, `Atividade: ${task.title}`);
}

export async function exportTasksToExcel(
  tasks,
  fileName = "masterdot-atividades"
) {
  const workbook = XLSX.utils.book_new();

  appendSheet(workbook, "Atividades", taskRows(tasks));

  return saveAndShareWorkbook(
    workbook,
    fileName,
    "Exportação de Atividades MetaPulse"
  );
}

export async function exportExecutiveReport(tasks, projects = []) {
  const today = todayISO();

  const open = tasks.filter((task) => task.status !== "Concluído");
  const done = tasks.filter((task) => task.status === "Concluído");
  const late = open.filter((task) => task.endDate && task.endDate < today);
  const critical = open.filter((task) => task.priority === "Alta");

  const sevenDate = new Date();
  sevenDate.setDate(sevenDate.getDate() + 7);
  const limit = sevenDate.toISOString().slice(0, 10);

  const next7 = open.filter(
    (task) => task.endDate && task.endDate >= today && task.endDate <= limit
  );

  const summaryRows = [
    { Indicador: "Total de atividades", Valor: tasks.length },
    { Indicador: "Abertas", Valor: open.length },
    { Indicador: "Concluídas", Valor: done.length },
    { Indicador: "Atrasadas", Valor: late.length },
    { Indicador: "Críticas", Valor: critical.length },
    { Indicador: "Vencem em 7 dias", Valor: next7.length },
    { Indicador: "Projetos", Valor: projects.length },
    {
      Indicador: "Progresso geral",
      Valor: tasks.length ? `${Math.round((done.length / tasks.length) * 100)}%` : "0%",
    },
  ];

  const responsibleMap = {};

  tasks.forEach((task) => {
    const responsible = task.responsible || "Sem responsável";

    if (!responsibleMap[responsible]) {
      responsibleMap[responsible] = {
        Responsável: responsible,
        Total: 0,
        Abertas: 0,
        Concluídas: 0,
        Atrasadas: 0,
        Críticas: 0,
      };
    }

    responsibleMap[responsible].Total += 1;

    if (task.status === "Concluído") {
      responsibleMap[responsible].Concluídas += 1;
    } else {
      responsibleMap[responsible].Abertas += 1;
    }

    if (task.status !== "Concluído" && task.endDate && task.endDate < today) {
      responsibleMap[responsible].Atrasadas += 1;
    }

    if (task.status !== "Concluído" && task.priority === "Alta") {
      responsibleMap[responsible].Críticas += 1;
    }
  });

  const projectRows = projects.map((project) => {
    const projectTasks = tasks.filter(
      (task) =>
        String(task.project || "").trim().toLowerCase() ===
        String(project.name || "").trim().toLowerCase()
    );

    const projectDone = projectTasks.filter(
      (task) => task.status === "Concluído"
    );

    const projectLate = projectTasks.filter(
      (task) =>
        task.status !== "Concluído" && task.endDate && task.endDate < today
    );

    return {
      Projeto: project.name,
      Total: projectTasks.length,
      Concluídas: projectDone.length,
      Abertas: projectTasks.length - projectDone.length,
      Atrasadas: projectLate.length,
      Progresso: projectTasks.length
        ? `${Math.round((projectDone.length / projectTasks.length) * 100)}%`
        : "0%",
    };
  });

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(summaryRows),
    "Resumo"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(projectRows),
    "Projetos"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(Object.values(responsibleMap)),
    "Por responsável"
  );

  appendSheet(workbook, "Todas", taskRows(tasks));
  appendSheet(workbook, "Atrasadas", taskRows(late));
  appendSheet(workbook, "Críticas", taskRows(critical));
  appendSheet(workbook, "7 dias", taskRows(next7));
  appendSheet(workbook, "Concluídas", taskRows(done));

  return saveAndShareWorkbook(
    workbook,
    "masterdot-relatorio-executivo",
    "Relatório Executivo MetaPulse"
  );
}