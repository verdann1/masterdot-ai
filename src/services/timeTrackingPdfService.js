import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import {
  calcDayOvertime,
  calcPeriodSummary,
  getPeriodDates,
  fmtPeriodLabel,
  fmtCurrency,
  fmtHours,
  dayLabel,
} from "./timeTrackingCalc";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:     [2,   6,  23],
  surf:   [15,  23,  42],
  surf2:  [20,  30,  55],
  border: [30,  41,  59],
  cyan:   [125, 211, 252],
  white:  [255, 255, 255],
  text:   [203, 213, 225],
  muted:  [100, 116, 139],
  green:  [34,  197,  94],
  amber:  [251, 191,  36],
  red:    [239,  68,  68],
};

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

// ── Layout ────────────────────────────────────────────────────────────────────
function pageBg(doc) {
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, 210, 297, "F");
}

function pageHeader(doc, sub) {
  doc.setFillColor(...C.surf);
  doc.rect(0, 0, 210, 22, "F");
  doc.setFillColor(...C.cyan);
  doc.rect(0, 22, 210, 0.4, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("MetaPulse  ·  Controle de Ponto", 14, 14);
  if (sub) {
    doc.setTextColor(...C.muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(sub, 196, 14, { align: "right" });
  }
}

function pageFooter(doc) {
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
    doc.text(`MetaPulse  ·  Gerado em ${dateBR(todayISO())}`, 14, 291);
    doc.text(`Página ${i} de ${n}`, 196, 291, { align: "right" });
  }
}

function tbl() {
  return {
    theme: "grid",
    margin: { top: 28, bottom: 18 },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: C.border,
      lineWidth: 0.2,
      textColor: C.text,
      fillColor: C.surf,
    },
    alternateRowStyles: { fillColor: C.surf2 },
    headStyles: {
      fillColor: C.surf,
      textColor: C.cyan,
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 3,
    },
  };
}

function kpiCard(doc, x, y, w, h, label, value, color = C.cyan) {
  doc.setFillColor(...C.surf);
  doc.roundedRect(x, y, w, h, 2, 2, "F");
  doc.setFillColor(...color);
  doc.rect(x, y + h - 1.5, w, 1.5, "F");
  doc.setTextColor(...C.muted);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text(label.toUpperCase(), x + 4, y + 6);
  doc.setTextColor(...color);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(String(value), x + 4, y + 14);
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function shareTimeTrackingPdf(employees, records, closingMonth) {
  const doc = new jsPDF("p", "mm", "a4");
  const { startISO, endISO } = getPeriodDates(closingMonth);
  const periodLabel = fmtPeriodLabel(startISO, endISO);

  // Cover summary page
  pageBg(doc);
  doc.setFillColor(...C.surf);
  doc.rect(0, 0, 210, 52, "F");
  doc.setFillColor(...C.cyan);
  doc.rect(0, 52, 210, 0.4, "F");

  doc.setFillColor(...C.cyan);
  doc.rect(14, 13, 3, 22, "F");
  doc.setTextColor(...C.white);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Folha de Ponto", 20, 27);
  doc.setTextColor(...C.muted);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("MetaPulse  ·  Controle de horas extras", 20, 38);
  doc.text(`Período: ${periodLabel}`, 196, 38, { align: "right" });

  // Summary table per employee
  let y = 62;
  const summaries = employees.map((emp) => calcPeriodSummary(emp, records, startISO, endISO));

  // KPI row
  const totalEmps = summaries.length;
  const withOT = summaries.filter((s) => s.totalOvertimeMinutes > 0).length;
  const totalOTValue = summaries.reduce((acc, s) => acc + s.totalOvertimeValue, 0);
  const totalOTHours = summaries.reduce((acc, s) => acc + s.totalOvertimeHours, 0);

  const kw = 42, kh = 18, kg = 4;
  [
    { label: "Funcionários",  value: totalEmps,              color: C.cyan  },
    { label: "Com HE",        value: withOT,                 color: C.amber },
    { label: "Total HE (h)",  value: fmtHours(totalOTHours), color: C.amber },
    { label: "Total a pagar", value: fmtCurrency(totalOTValue), color: C.green },
  ].forEach((k, i) => kpiCard(doc, 14 + i * (kw + kg), y, kw, kh, k.label, k.value, k.color));
  y += kh + 8;

  // Summary table
  autoTable(doc, {
    startY: y,
    head: [["Funcionário", "Dias trab.", "HE total", "Valor HE"]],
    body: summaries.map((s) => [
      s.employee.name,
      s.daysWorked,
      s.totalOvertimeMinutes > 0 ? fmtHours(s.totalOvertimeHours) : "—",
      s.totalOvertimeMinutes > 0 ? fmtCurrency(s.totalOvertimeValue) : "—",
    ]),
    ...tbl(),
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 40, halign: "center" },
      3: { cellWidth: 42, halign: "right" },
    },
    didDrawPage: () => { pageBg(doc); pageHeader(doc, periodLabel); },
  });

  // Detail page per employee
  for (const summary of summaries) {
    if (summary.details.length === 0) continue;

    doc.addPage();
    pageBg(doc);
    pageHeader(doc, summary.employee.name);

    let py = 28;

    // Employee info card
    doc.setFillColor(...C.surf);
    doc.roundedRect(14, py, 182, 20, 3, 3, "F");
    doc.setFillColor(...C.cyan);
    doc.rect(14, py, 3, 20, "F");

    doc.setTextColor(...C.white);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(summary.employee.name, 21, py + 8);

    doc.setTextColor(...C.muted);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Horário: ${summary.employee.workStart}–${summary.employee.workEnd}  ·  ` +
      `Salário: ${fmtCurrency(summary.employee.baseSalary || 0)}  ·  ` +
      `Hora: ${fmtCurrency((summary.employee.baseSalary || 0) / 220)}  ·  ` +
      `HE útil: ${summary.employee.weekdayOvertime}%  sáb: ${summary.employee.saturdayOvertime}%  dom: ${summary.employee.sundayOvertime}%`,
      21, py + 16,
    );
    py += 28;

    // Records table
    autoTable(doc, {
      startY: py,
      head: [["Data", "Dia", "Entrada", "Saída", "HE (h)", "%", "Valor HE", "Nota"]],
      body: summary.details.map(({ record, calc }) => [
        dateBR(record.date),
        dayLabel(record.date).split(",")[0],
        record.entryTime || "—",
        record.exitTime  || "—",
        calc.totalOvertimeMinutes > 0 ? fmtHours(calc.overtimeHours) : "—",
        calc.totalOvertimeMinutes > 0 ? `${calc.ratePercent}%` : "—",
        calc.totalOvertimeMinutes > 0 ? fmtCurrency(calc.overtimeValue) : "—",
        record.note || "",
      ]),
      foot: [[
        "Total", `${summary.daysWorked} dias`, "", "",
        fmtHours(summary.totalOvertimeHours), "",
        fmtCurrency(summary.totalOvertimeValue), "",
      ]],
      ...tbl(),
      footStyles: {
        fillColor: C.surf,
        textColor: C.cyan,
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 14 },
        2: { cellWidth: 16, halign: "center" },
        3: { cellWidth: 16, halign: "center" },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 10, halign: "center" },
        6: { cellWidth: 30, halign: "right" },
        7: { cellWidth: 56 },
      },
      didDrawPage: () => { pageBg(doc); pageHeader(doc, summary.employee.name); },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 4 && data.row.raw[4] !== "—") {
          data.cell.styles.textColor = C.amber;
          data.cell.styles.fontStyle = "bold";
        }
        if (data.section === "body" && data.column.index === 6 && data.row.raw[6] !== "—") {
          data.cell.styles.textColor = C.green;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
  }

  pageFooter(doc);

  const fileName = `masterdot-ponto-${closingMonth}.pdf`;
  const savedFile = await Filesystem.writeFile({
    path: fileName,
    data: toBase64(doc),
    directory: Directory.Cache,
  });

  try {
    await Share.share({
      title: `Folha de Ponto — ${periodLabel}`,
      text: "Exportado pelo MetaPulse.",
      url: savedFile.uri,
      dialogTitle: "Compartilhar folha de ponto",
    });
  } catch (err) {
    const m = (err?.message || "").toLowerCase();
    if (!m.includes("cancel") && !m.includes("dismiss") && !m.includes("abort")) throw err;
  }

  return savedFile.uri;
}
