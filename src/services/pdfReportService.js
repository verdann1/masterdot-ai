import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:      [2,   6,  23],
  surface: [15,  23,  42],
  surf2:   [20,  30,  55],
  border:  [30,  41,  59],
  cyan:    [96, 165, 250],
  white:   [255, 255, 255],
  text:    [203, 213, 225],
  muted:   [100, 116, 139],
  green:   [34,  197,  94],
  amber:   [251, 191,  36],
  red:     [239,  68,  68],
  redDk:   [127,  29,  29],
  ambDk:   [180,  83,   9],
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dateBR(d) {
  if (!d) return "—";
  const [y, m, day] = String(d).split("-");
  return y && m && day ? `${day}/${m}/${y}` : String(d);
}

function toBase64(doc) {
  return doc.output("datauristring").split(",")[1];
}

function trunc(s, max) {
  const str = s ? String(s) : "—";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function statusColor(s) {
  if (s === "Concluído")    return C.green;
  if (s === "Em andamento") return C.cyan;
  if (s === "Alta")         return C.red;
  if (s === "Média")        return C.amber;
  return C.muted;
}

function respOf(t) {
  return Array.isArray(t.responsibles) && t.responsibles.length
    ? t.responsibles[0]
    : t.responsible || "—";
}

// ── Layout helpers ────────────────────────────────────────────────────────────
function pageBg(doc) {
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, 210, 297, "F");
}

function header(doc, sub) {
  doc.setFillColor(...C.surface);
  doc.rect(0, 0, 210, 22, "F");
  doc.setFillColor(...C.cyan);
  doc.rect(0, 22, 210, 0.4, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("MetaPulse", 14, 14);
  if (sub) {
    doc.setTextColor(...C.muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(sub, 196, 14, { align: "right" });
  }
}

function footer(doc) {
  const n = doc.internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.bg);
    doc.rect(0, 283, 210, 14, "F");
    doc.setFillColor(...C.border);
    doc.rect(0, 283, 210, 0.3, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`MetaPulse  ·  ${dateBR(todayISO())}`, 14, 291);
    doc.text(`Página ${i} de ${n}`, 196, 291, { align: "right" });
  }
}

function progressBar(doc, x, y, w, h, pct) {
  const p = Math.min(100, Math.max(0, pct));
  doc.setFillColor(...C.border);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, "F");
  if (p > 0) {
    doc.setFillColor(...C.cyan);
    doc.roundedRect(x, y, Math.max(h, (w * p) / 100), h, h / 2, h / 2, "F");
  }
}

function sectionTitle(doc, label, y) {
  doc.setFillColor(...C.cyan);
  doc.rect(14, y - 3.5, 2.5, 5.5, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.cyan);
  doc.text(label.toUpperCase(), 19, y);
  return y + 5;
}

// ── Table style factory ───────────────────────────────────────────────────────
function tbl(headFill = C.surface, headText = C.cyan) {
  return {
    theme: "grid",
    margin: { top: 28, bottom: 18 },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: C.border,
      lineWidth: 0.2,
      textColor: C.text,
      fillColor: C.surface,
      font: "helvetica",
    },
    alternateRowStyles: { fillColor: C.surf2 },
    headStyles: {
      fillColor: headFill,
      textColor: headText,
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 3,
      lineColor: C.border,
      lineWidth: 0.2,
    },
  };
}

// ── KPI calculation ───────────────────────────────────────────────────────────
function kpis(tasks, projects) {
  const today = todayISO();
  const open = tasks.filter((t) => t.status !== "Concluído");
  const done = tasks.filter((t) => t.status === "Concluído");
  const late = open.filter((t) => t.endDate && t.endDate < today);
  const critical = open.filter((t) => t.priority === "Alta");
  const lim = new Date();
  lim.setDate(lim.getDate() + 7);
  const limISO = lim.toISOString().slice(0, 10);
  const next7 = open.filter((t) => t.endDate && t.endDate >= today && t.endDate <= limISO);
  const progress = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  return {
    total: tasks.length, projects: projects.length,
    open: open.length, done: done.length, late: late.length,
    critical: critical.length, next7: next7.length, progress,
    lateTasks: late, criticalTasks: critical, next7Tasks: next7,
  };
}

// ── Share single task as PDF ──────────────────────────────────────────────────
export async function shareTaskAsPdf(task, subtasks = []) {
  const doc = new jsPDF("p", "mm", "a4");

  const responsible = Array.isArray(task.responsibles) && task.responsibles.length
    ? task.responsibles.join(", ")
    : task.responsible || "—";

  // Page 1 — cover
  pageBg(doc);
  header(doc, task.project || "");

  let y = 30;

  // Title
  doc.setTextColor(...C.white);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(task.title || "—", 182);
  doc.text(titleLines, 14, y);
  y += titleLines.length * 7 + 3;

  // Status + priority badges
  function badge(text, color, bx, by) {
    const tw = doc.getTextWidth(text);
    doc.setFillColor(...color);
    doc.roundedRect(bx, by - 4.5, tw + 7, 6.5, 1.5, 1.5, "F");
    doc.setTextColor(...C.bg);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(text, bx + 3.5, by);
    return bx + tw + 10;
  }
  let bx = 14;
  bx = badge(task.status || "—", statusColor(task.status), bx, y);
  if (task.priority) badge(task.priority, statusColor(task.priority), bx, y);
  y += 11;

  // Divider
  doc.setFillColor(...C.border);
  doc.rect(14, y, 182, 0.3, "F");
  y += 6;

  // KPI cards row
  const cw = 57, ch = 14, cg = 4;
  const cards = [
    { label: "Início",      value: dateBR(task.startDate) },
    { label: "Prazo",       value: dateBR(task.endDate) },
    { label: "Responsável", value: trunc(responsible, 22) },
  ];
  cards.forEach((c, i) => {
    const cx = 14 + i * (cw + cg);
    doc.setFillColor(...C.surface);
    doc.roundedRect(cx, y, cw, ch, 2, 2, "F");
    doc.setFillColor(...C.cyan);
    doc.rect(cx, y, 2, ch, "F");
    doc.setTextColor(...C.muted);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text(c.label.toUpperCase(), cx + 5, y + 5);
    doc.setTextColor(...C.white);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(String(c.value), cx + 5, y + 11);
  });
  y += ch + 6;

  // Progress
  y = sectionTitle(doc, "Progresso", y + 1);
  progressBar(doc, 14, y, 155, 4, task.progress ?? 0);
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text(`${task.progress ?? 0}%`, 173, y + 3.2);
  y += 12;

  // Description
  if (task.notes) {
    y = sectionTitle(doc, "Descritivo", y);
    doc.setTextColor(...C.text);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(task.notes, 182);
    doc.text(lines, 14, y);
    y += lines.length * 4.5 + 8;
  }

  // Last update — boxed
  if (task.progressComment) {
    y = sectionTitle(doc, "Último andamento", y);
    const lines = doc.splitTextToSize(task.progressComment, 172);
    const bh = lines.length * 4.5 + 8;
    doc.setFillColor(...C.surface);
    doc.roundedRect(14, y - 1, 182, bh, 2, 2, "F");
    doc.setFillColor(...C.cyan);
    doc.rect(14, y - 1, 2.5, bh, "F");
    doc.setTextColor(...C.text);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(lines, 20, y + 3.5);
    y += bh + 8;
  }

  // Checklist
  if (task.checklist?.length) {
    if (y > 228) { doc.addPage(); pageBg(doc); header(doc, task.project || ""); y = 30; }
    else y = sectionTitle(doc, "Checklist", y);

    const doneCount = task.checklist.filter((i) => i.done).length;
    progressBar(doc, 14, y, 100, 3, Math.round((doneCount / task.checklist.length) * 100));
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(`${doneCount}/${task.checklist.length} itens`, 118, y + 2.5);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [["", "Item"]],
      body: task.checklist.map((i) => [i.done ? "✓" : "○", i.text || "—"]),
      ...tbl(),
      margin: { top: 28, bottom: 18, left: 14, right: 14 },
      columnStyles: { 0: { cellWidth: 9, halign: "center" }, 1: { cellWidth: 169 } },
      didDrawPage: () => { pageBg(doc); header(doc, "Checklist"); },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 0) {
          data.cell.styles.textColor = data.row.raw[0] === "✓" ? C.green : C.muted;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fontSize = 10;
        }
      },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Comments
  if (task.comments?.length) {
    if (y > 240) { doc.addPage(); pageBg(doc); header(doc, "Histórico"); y = 30; }
    else y = sectionTitle(doc, "Histórico de comentários", y);

    autoTable(doc, {
      startY: y,
      head: [["Data", "Comentário"]],
      body: task.comments.map((c) => [dateBR(c.date), c.text || "—"]),
      ...tbl(),
      margin: { top: 28, bottom: 18, left: 14, right: 14 },
      columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 150 } },
      didDrawPage: () => { pageBg(doc); header(doc, "Histórico"); },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Subtasks
  if (subtasks.length) {
    if (y > 228) { doc.addPage(); pageBg(doc); header(doc, "Subatividades"); y = 30; }
    else y = sectionTitle(doc, "Subatividades", y);

    autoTable(doc, {
      startY: y,
      head: [["Subatividade", "Responsável", "Status", "Prazo", "%"]],
      body: subtasks.map((s) => [
        trunc(s.title, 42),
        trunc(Array.isArray(s.responsibles) ? s.responsibles.join(", ") : (s.responsible || "—"), 22),
        s.status || "—",
        dateBR(s.endDate),
        `${s.progress ?? 0}%`,
      ]),
      ...tbl(),
      margin: { top: 28, bottom: 18, left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 68 }, 1: { cellWidth: 44 },
        2: { cellWidth: 32 }, 3: { cellWidth: 24 },
        4: { cellWidth: 10, halign: "right" },
      },
      didDrawPage: () => { pageBg(doc); header(doc, "Subatividades"); },
    });
  }

  footer(doc);

  const safeName = (task.title || "atividade").replace(/[^\w]/g, "-").slice(0, 30);
  const fileName = `masterdot-${safeName}-${todayISO()}.pdf`;
  const savedFile = await Filesystem.writeFile({ path: fileName, data: toBase64(doc), directory: Directory.Cache });

  try {
    await Share.share({ title: `Atividade: ${task.title}`, text: "Exportado pelo MetaPulse.", url: savedFile.uri, dialogTitle: "Compartilhar atividade" });
  } catch (err) {
    const m = (err?.message || "").toLowerCase();
    if (!m.includes("cancel") && !m.includes("dismiss") && !m.includes("abort")) throw err;
  }
  return savedFile.uri;
}

// ── Executive PDF report ──────────────────────────────────────────────────────
export async function exportExecutivePdfReport(tasks, projects = []) {
  const doc = new jsPDF("p", "mm", "a4");
  const d = kpis(tasks, projects);

  // Cover
  pageBg(doc);
  doc.setFillColor(...C.surface);
  doc.rect(0, 0, 210, 52, "F");
  doc.setFillColor(...C.cyan);
  doc.rect(0, 52, 210, 0.4, "F");

  doc.setFillColor(...C.cyan);
  doc.rect(14, 13, 3, 22, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório", 20, 27);
  doc.setTextColor(...C.cyan);
  doc.text("Executivo", 20 + doc.getTextWidth("Relatório") + 3, 27);
  doc.setTextColor(...C.muted);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("MetaPulse  ·  Gestão de obras e engenharia", 20, 39);
  doc.text(dateBR(todayISO()), 196, 39, { align: "right" });

  // KPI grid (2 rows × 3 cols)
  const kpiDefs = [
    { label: "Total",      value: d.total,    color: C.cyan  },
    { label: "Abertas",    value: d.open,     color: C.text  },
    { label: "Concluídas", value: d.done,     color: C.green },
    { label: "Atrasadas",  value: d.late,     color: C.red   },
    { label: "Críticas",   value: d.critical, color: C.amber },
    { label: "7 dias",     value: d.next7,    color: C.amber },
  ];

  const kw = 57, kh = 20, kg = 3;
  let kx = 14, ky = 62;
  kpiDefs.forEach((k, i) => {
    doc.setFillColor(...C.surface);
    doc.roundedRect(kx, ky, kw, kh, 3, 3, "F");
    doc.setFillColor(...k.color);
    doc.rect(kx, ky + kh - 1.5, kw, 1.5, "F");
    doc.setTextColor(...C.muted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(k.label.toUpperCase(), kx + 5, ky + 7);
    doc.setTextColor(...k.color);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(String(k.value), kx + 5, ky + 17);
    kx += kw + kg;
    if ((i + 1) % 3 === 0) { kx = 14; ky += kh + kg; }
  });

  let y = ky + kh + 8;

  // Overall progress panel
  doc.setFillColor(...C.surface);
  doc.roundedRect(14, y, 182, 18, 3, 3, "F");
  doc.setTextColor(...C.muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("PROGRESSO GERAL", 20, y + 7);
  progressBar(doc, 20, y + 10, 148, 4, d.progress);
  doc.setTextColor(...C.cyan);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${d.progress}%`, 176, y + 14, { align: "right" });
  y += 26;

  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.setFont("helvetica", "normal");
  doc.text(`${d.projects} projeto(s)  ·  ${d.total} atividade(s)`, 14, y);

  // By project
  doc.addPage(); pageBg(doc); header(doc, "Resumo por Projeto");
  const projRows = projects.map((p) => {
    const pt = tasks.filter(
      (t) => String(t.project || "").trim().toLowerCase() === String(p.name || "").trim().toLowerCase()
    );
    const dn = pt.filter((t) => t.status === "Concluído").length;
    const lt = pt.filter((t) => t.status !== "Concluído" && t.endDate && t.endDate < todayISO()).length;
    const pg = pt.length ? Math.round((dn / pt.length) * 100) : 0;
    return [trunc(p.name, 38), pt.length, pt.length - dn, dn, lt, `${pg}%`];
  });
  autoTable(doc, {
    startY: 28,
    head: [["Projeto", "Total", "Abertas", "Concluídas", "Atrasadas", "Progresso"]],
    body: projRows.length ? projRows : [["Nenhum projeto cadastrado", "—", "—", "—", "—", "—"]],
    ...tbl(),
    columnStyles: {
      0: { cellWidth: 74 }, 1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 22, halign: "center" }, 3: { cellWidth: 26, halign: "center" },
      4: { cellWidth: 24, halign: "center" }, 5: { cellWidth: 18, halign: "center" },
    },
    didDrawPage: () => { pageBg(doc); header(doc, "Resumo por Projeto"); },
  });

  // By responsible
  doc.addPage(); pageBg(doc); header(doc, "Resumo por Responsável");
  const respMap = {};
  tasks.forEach((t) => {
    const r = respOf(t);
    if (!respMap[r]) respMap[r] = { name: r, total: 0, open: 0, done: 0, late: 0, critical: 0 };
    respMap[r].total++;
    if (t.status === "Concluído") { respMap[r].done++; }
    else {
      respMap[r].open++;
      if (t.endDate && t.endDate < todayISO()) respMap[r].late++;
      if (t.priority === "Alta") respMap[r].critical++;
    }
  });
  autoTable(doc, {
    startY: 28,
    head: [["Responsável", "Total", "Abertas", "Concluídas", "Atrasadas", "Críticas"]],
    body: Object.values(respMap).map((r) => [r.name, r.total, r.open, r.done, r.late, r.critical]),
    ...tbl(),
    columnStyles: {
      0: { cellWidth: 74 }, 1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 22, halign: "center" }, 3: { cellWidth: 26, halign: "center" },
      4: { cellWidth: 24, halign: "center" }, 5: { cellWidth: 18, halign: "center" },
    },
    didDrawPage: () => { pageBg(doc); header(doc, "Resumo por Responsável"); },
  });

  // Shared cols for detail tables
  const detailCols = {
    0: { cellWidth: 28 }, 1: { cellWidth: 54 }, 2: { cellWidth: 34 },
    3: { cellWidth: 20, halign: "center" }, 4: { cellWidth: 24, halign: "center" },
    5: { cellWidth: 20, halign: "center" }, 6: { cellWidth: 18, halign: "center" },
  };
  const detailRow = (t) => [
    trunc(t.project, 18), trunc(t.title, 36), trunc(respOf(t), 22),
    t.priority || "—", t.status || "—", dateBR(t.startDate), dateBR(t.endDate),
  ];
  const detailHead = [["Projeto", "Atividade", "Responsável", "Prioridade", "Status", "Início", "Fim"]];

  // Critical + late (deduplicated)
  doc.addPage(); pageBg(doc); header(doc, "Críticas e Atrasadas");
  const critMap = new Map();
  [...d.lateTasks, ...d.criticalTasks].forEach((t) => critMap.set(t.id || t.title, t));
  autoTable(doc, {
    startY: 28,
    head: detailHead,
    body: [...critMap.values()].map(detailRow),
    ...tbl(C.redDk, [255, 200, 200]),
    columnStyles: detailCols,
    didDrawPage: () => { pageBg(doc); header(doc, "Críticas e Atrasadas"); },
  });

  // Next 7 days
  doc.addPage(); pageBg(doc); header(doc, "Vencimentos em 7 Dias");
  autoTable(doc, {
    startY: 28,
    head: detailHead,
    body: d.next7Tasks.map(detailRow),
    ...tbl(C.ambDk, [255, 230, 180]),
    columnStyles: detailCols,
    didDrawPage: () => { pageBg(doc); header(doc, "Vencimentos em 7 Dias"); },
  });

  // All tasks
  doc.addPage(); pageBg(doc); header(doc, "Todas as Atividades");
  autoTable(doc, {
    startY: 28,
    head: detailHead,
    body: tasks.map(detailRow),
    ...tbl(),
    columnStyles: detailCols,
    didDrawPage: () => { pageBg(doc); header(doc, "Todas as Atividades"); },
  });

  footer(doc);

  const fileName = `masterdot-relatorio-executivo-${todayISO()}.pdf`;
  const savedFile = await Filesystem.writeFile({ path: fileName, data: toBase64(doc), directory: Directory.Cache });

  try {
    await Share.share({ title: "Relatório Executivo MetaPulse", text: "Relatório PDF exportado pelo MetaPulse.", url: savedFile.uri, dialogTitle: "Salvar ou compartilhar PDF" });
  } catch (err) {
    const m = (err?.message || "").toLowerCase();
    if (!m.includes("cancel") && !m.includes("dismiss") && !m.includes("abort")) throw err;
  }
  return savedFile.uri;
}
