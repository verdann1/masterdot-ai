import * as XLSX from "xlsx";
import { getColumn } from "../utils/textUtils";

function excelDateToString(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return "";
    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);

  return String(value);
}

export async function importTasksFromExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const importedTasks = [];
  const parentMap = new Map();

  rows.forEach((row, index) => {
    const primaryTitle = String(
      getColumn(row, ["atividade primaria", "atividade principal", "atividade pai", "pai", "parent"])
    ).trim();

    const title = String(
      getColumn(row, ["atividade", "subatividade", "titulo", "title", "acao", "ação", "descricao", "descrição"])
    ).trim();

    if (!title && !primaryTitle) return;

    const project = String(getColumn(row, ["projeto", "project"]) || "Rotina diária").trim();
    const priority = String(getColumn(row, ["prioridade", "priority"]) || "Média").trim();
    const status = String(getColumn(row, ["status", "situacao", "situação", "status atual"]) || "Aberto").trim();
    const responsible = String(getColumn(row, ["responsavel", "responsável", "owner", "responsible"]) || "").trim();
    const notes = String(getColumn(row, ["descritivo", "descricao", "descrição", "observacao", "observação", "notes"]) || "").trim();
    const progressComment = String(getColumn(row, ["andamento", "comentario", "comentário", "comentario andamento"]) || "").trim();

    const startDate = excelDateToString(getColumn(row, ["inicio", "início", "data inicio", "data início", "start", "start date"]));
    const endDate = excelDateToString(getColumn(row, ["fim", "data fim", "prazo", "due", "end", "end date"]));

    let parentId = null;

    if (primaryTitle) {
      if (!parentMap.has(primaryTitle)) {
        const newParentId = Date.now() + index + Math.floor(Math.random() * 1000);
        parentMap.set(primaryTitle, newParentId);

        importedTasks.push({
          id: newParentId,
          parentId: null,
          title: primaryTitle,
          project,
          priority,
          status: "Aberto",
          startDate,
          endDate,
          responsible,
          type: "Atividade Primária",
          notes: "Importado da planilha Excel.",
          progressComment: "",
          comments: [],
          evidences: [],
          checklist: [],
        });
      }

      parentId = parentMap.get(primaryTitle);
    }

    importedTasks.push({
      id: Date.now() + index + 5000 + Math.floor(Math.random() * 1000),
      parentId,
      title: title || primaryTitle,
      project,
      priority,
      status,
      startDate,
      endDate,
      responsible,
      type: parentId ? "Subatividade" : "Atividade Primária",
      notes,
      progressComment,
      comments: progressComment
        ? [{ id: Date.now() + index + 12000, date: new Date().toLocaleString("pt-BR"), text: progressComment }]
        : [],
      evidences: [],
      checklist: [],
    });
  });

  return importedTasks;
}