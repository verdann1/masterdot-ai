import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateBR(date) {
  if (!date) return "-";
  const [year, month, day] = String(date).split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function toBase64Pdf(doc) {
  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1];
}

function addHeader(doc, title) {
  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, 210, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Master DOT", 14, 14);

  doc.setTextColor(125, 211, 252);
  doc.setFontSize(9);
  doc.text(title, 150, 14);
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Página ${i} de ${pageCount}`, 180, 290);
    doc.text(`Gerado em ${formatDateBR(todayISO())}`, 14, 290);
  }
}

function kpis(tasks, projects) {
  const today = todayISO();

  const open = tasks.filter((task) => task.status !== "Concluído");
  const done = tasks.filter((task) => task.status === "Concluído");
  const late = open.filter((task) => task.endDate && task.endDate < today);
  const critical = open.filter((task) => task.priority === "Alta");

  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + 7);
  const limit = limitDate.toISOString().slice(0, 10);

  const next7 = open.filter(
    (task) => task.endDate && task.endDate >= today && task.endDate <= limit
  );

  const progress = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

  return {
    total: tasks.length,
    projects: projects.length,
    open: open.length,
    done: done.length,
    late: late.length,
    critical: critical.length,
    next7: next7.length,
    progress,
    openTasks: open,
    doneTasks: done,
    lateTasks: late,
    criticalTasks: critical,
    next7Tasks: next7,
  };
}

function taskRows(tasks) {
  return tasks.map((task) => [
    task.project || "-",
    task.title || "-",
    task.responsible || "-",
    task.priority || "-",
    task.status || "-",
    formatDateBR(task.startDate),
    formatDateBR(task.endDate),
    task.progressComment || "-",
  ]);
}

export async function shareTaskAsPdf(task, subtasks = []) {
  const doc = new jsPDF("p", "mm", "a4");

  const responsibles = Array.isArray(task.responsibles) && task.responsibles.length
    ? task.responsibles.join(", ")
    : task.responsible || "-";

  // ── Capa ──────────────────────────────────────────────────────────────────
  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, 210, 297, "F");

  addHeader(doc, task.project || "Master DOT");

  doc.setTextColor(125, 211, 252);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ATIVIDADE", 14, 36);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(task.title || "-", 182);
  doc.text(titleLines, 14, 46);

  let y = 46 + titleLines.length * 7 + 6;

  // ── KPI cards ─────────────────────────────────────────────────────────────
  const cards = [
    { label: "Status",      value: task.status   || "-" },
    { label: "Prioridade",  value: task.priority || "-" },
    { label: "Início",      value: formatDateBR(task.startDate) },
    { label: "Prazo",       value: formatDateBR(task.endDate) },
    { label: "Progresso",   value: `${task.progress ?? 0}%` },
    { label: "Responsável", value: responsibles.slice(0, 24) },
  ];

  let cx = 14, cy = y;
  cards.forEach((card, i) => {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(cx, cy, 57, 18, 3, 3, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, cx + 4, cy + 7);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(String(card.value), cx + 4, cy + 14);
    cx += 60;
    if ((i + 1) % 3 === 0) { cx = 14; cy += 22; }
  });

  y = cy + 26;

  if (task.notes) {
    doc.setTextColor(125, 211, 252);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("DESCRITIVO", 14, y);
    y += 5;
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(task.notes, 182);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
  }

  if (task.progressComment) {
    doc.setTextColor(125, 211, 252);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("ÚLTIMO ANDAMENTO", 14, y);
    y += 5;
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(task.progressComment, 182);
    doc.text(lines, 14, y);
  }

  // ── Checklist ─────────────────────────────────────────────────────────────
  if (task.checklist?.length) {
    doc.addPage();
    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, 210, 297, "F");
    addHeader(doc, "Checklist");

    autoTable(doc, {
      startY: 32,
      head: [["", "Item"]],
      body: task.checklist.map((i) => [i.done ? "✓" : "◻", i.text]),
      theme: "grid",
      headStyles:  { fillColor: [15, 23, 42], textColor: [125, 211, 252] },
      bodyStyles:  { textColor: [220, 220, 220], fillColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: 10 } },
      styles: { fontSize: 9 },
    });
  }

  // ── Comentários ───────────────────────────────────────────────────────────
  if (task.comments?.length) {
    doc.addPage();
    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, 210, 297, "F");
    addHeader(doc, "Histórico de comentários");

    autoTable(doc, {
      startY: 32,
      head: [["Data", "Comentário"]],
      body: task.comments.map((c) => [c.date, c.text]),
      theme: "grid",
      headStyles:  { fillColor: [15, 23, 42], textColor: [125, 211, 252] },
      bodyStyles:  { textColor: [220, 220, 220], fillColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: 42 } },
      styles: { fontSize: 9 },
    });
  }

  // ── Subatividades ─────────────────────────────────────────────────────────
  if (subtasks.length) {
    doc.addPage();
    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, 210, 297, "F");
    addHeader(doc, "Subatividades");

    autoTable(doc, {
      startY: 32,
      head: [["Título", "Responsável", "Status", "Prazo", "%"]],
      body: subtasks.map((s) => [
        s.title,
        Array.isArray(s.responsibles) ? s.responsibles.join(", ") : (s.responsible || "-"),
        s.status,
        formatDateBR(s.endDate),
        `${s.progress ?? 0}%`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [125, 211, 252] },
      bodyStyles: { textColor: [220, 220, 220], fillColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: 60 } },
      styles: { fontSize: 9 },
    });
  }

  addFooter(doc);

  const safeName = (task.title || "atividade").replace(/[^\w]/g, "-").slice(0, 30);
  const fileName = `masterdot-${safeName}-${todayISO()}.pdf`;
  const base64 = toBase64Pdf(doc);

  const savedFile = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });

  await Share.share({
    title: `Atividade: ${task.title}`,
    text: "Exportado pelo Master DOT.",
    url: savedFile.uri,
    dialogTitle: "Compartilhar atividade",
  });

  return savedFile.uri;
}

export async function exportExecutivePdfReport(tasks, projects = []) {
  const doc = new jsPDF("p", "mm", "a4");
  const data = kpis(tasks, projects);

  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, 210, 297, "F");

  doc.setTextColor(125, 211, 252);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("MASTER DOT", 14, 28);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text("Relatório Executivo", 14, 48);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(11);
  doc.text("Gestão de atividades, prazos, prioridades e performance operacional.", 14, 58);

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, 78, 182, 62, 6, 6, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Resumo Geral", 24, 94);

  const kpiCards = [
    ["Total", data.total],
    ["Abertas", data.open],
    ["Atrasadas", data.late],
    ["Críticas", data.critical],
    ["7 dias", data.next7],
    ["Progresso", `${data.progress}%`],
  ];

  let x = 24;
  let y = 108;

  kpiCards.forEach((item, index) => {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(x, y, 50, 20, 4, 4, "F");

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text(item[0], x + 4, y + 7);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(String(item[1]), x + 4, y + 16);

    x += 56;

    if ((index + 1) % 3 === 0) {
      x = 24;
      y += 25;
    }
  });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.text(`Projetos monitorados: ${data.projects}`, 14, 165);
  doc.text(`Relatório gerado em: ${formatDateBR(todayISO())}`, 14, 173);

  doc.addPage();
  addHeader(doc, "Resumo por projeto");

  const projectRows = projects.map((project) => {
    const projectTasks = tasks.filter(
      (task) =>
        String(task.project || "").trim().toLowerCase() ===
        String(project.name || "").trim().toLowerCase()
    );

    const done = projectTasks.filter((task) => task.status === "Concluído").length;
    const open = projectTasks.length - done;
    const late = projectTasks.filter(
      (task) => task.status !== "Concluído" && task.endDate && task.endDate < todayISO()
    ).length;

    const progress = projectTasks.length
      ? Math.round((done / projectTasks.length) * 100)
      : 0;

    return [project.name, projectTasks.length, open, done, late, `${progress}%`];
  });

  autoTable(doc, {
    startY: 32,
    head: [["Projeto", "Total", "Abertas", "Concluídas", "Atrasadas", "Progresso"]],
    body: projectRows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
  });

  doc.addPage();
  addHeader(doc, "Resumo por responsável");

  const responsibleMap = {};

  tasks.forEach((task) => {
    const responsible = task.responsible || "Sem responsável";

    if (!responsibleMap[responsible]) {
      responsibleMap[responsible] = {
        name: responsible,
        total: 0,
        open: 0,
        done: 0,
        late: 0,
        critical: 0,
      };
    }

    responsibleMap[responsible].total += 1;

    if (task.status === "Concluído") {
      responsibleMap[responsible].done += 1;
    } else {
      responsibleMap[responsible].open += 1;
    }

    if (task.status !== "Concluído" && task.endDate && task.endDate < todayISO()) {
      responsibleMap[responsible].late += 1;
    }

    if (task.status !== "Concluído" && task.priority === "Alta") {
      responsibleMap[responsible].critical += 1;
    }
  });

  autoTable(doc, {
    startY: 32,
    head: [["Responsável", "Total", "Abertas", "Concluídas", "Atrasadas", "Críticas"]],
    body: Object.values(responsibleMap).map((item) => [
      item.name,
      item.total,
      item.open,
      item.done,
      item.late,
      item.critical,
    ]),
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
  });

  doc.addPage();
  addHeader(doc, "Atividades críticas e atrasadas");

  autoTable(doc, {
    startY: 32,
    head: [["Projeto", "Atividade", "Responsável", "Prioridade", "Status", "Início", "Fim", "Comentário"]],
    body: taskRows([...data.lateTasks, ...data.criticalTasks]),
    theme: "grid",
    headStyles: { fillColor: [127, 29, 29], textColor: [255, 255, 255] },
    styles: { fontSize: 7 },
    columnStyles: {
      1: { cellWidth: 42 },
      7: { cellWidth: 45 },
    },
  });

  doc.addPage();
  addHeader(doc, "Vencimentos próximos 7 dias");

  autoTable(doc, {
    startY: 32,
    head: [["Projeto", "Atividade", "Responsável", "Prioridade", "Status", "Início", "Fim", "Comentário"]],
    body: taskRows(data.next7Tasks),
    theme: "grid",
    headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255] },
    styles: { fontSize: 7 },
    columnStyles: {
      1: { cellWidth: 42 },
      7: { cellWidth: 45 },
    },
  });

  doc.addPage();
  addHeader(doc, "Todas as atividades");

  autoTable(doc, {
    startY: 32,
    head: [["Projeto", "Atividade", "Responsável", "Prioridade", "Status", "Início", "Fim", "Comentário"]],
    body: taskRows(tasks),
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    styles: { fontSize: 7 },
    columnStyles: {
      1: { cellWidth: 42 },
      7: { cellWidth: 45 },
    },
  });

  addFooter(doc);

  const fileName = `masterdot-relatorio-executivo-${todayISO()}.pdf`;
  const base64 = toBase64Pdf(doc);

  const savedFile = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });

  await Share.share({
    title: "Relatório Executivo Master DOT",
    text: "Relatório PDF executivo exportado pelo Master DOT.",
    url: savedFile.uri,
    dialogTitle: "Salvar ou compartilhar PDF",
  });

  return savedFile.uri;
}