import * as XLSX from "xlsx";

function formatDate(value) {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);

    if (!date) return "";

    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(
      date.d
    ).padStart(2, "0")}`;
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!text || text.toUpperCase() === "TBD") return "";

    const parts = text.split(/[/-]/);

    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];

      return `${year}-${month}-${day}`;
    }
  }

  return "";
}

function cleanProjectName(text) {
  return String(text || "")
    .replace(/^\d+\s*,?\s*/, "")
    .trim();
}

function normalizeHeader(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.:]/g, "");
}

function getColumnIndex(headers, possibleNames) {
  return headers.findIndex((header) =>
    possibleNames.includes(normalizeHeader(header))
  );
}

function createChecklist(value) {
  const text = String(value || "").trim();

  if (!text) return [];

  return text
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => ({
      id: Date.now() + index + Math.floor(Math.random() * 1000),
      text: item,
      done: false,
    }));
}

function createInitialComment(value) {
  const text = String(value || "").trim();

  if (!text) return [];

  return [
    {
      id: Date.now() + Math.floor(Math.random() * 1000),
      date: new Date().toLocaleString("pt-BR"),
      text,
    },
  ];
}

function isProjectRow(item, description, responsible, startDate, endDate) {
  return (
    !item &&
    description &&
    !responsible &&
    !startDate &&
    !endDate &&
    /^\d+\s*,/.test(String(description).trim())
  );
}

function isActivityRow(item, description) {
  return item && description;
}

export async function importTasksFromExcelFile(file) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (!rows.length) {
    return {
      tasks: [],
      projects: [],
    };
  }

  const headers = rows[0];

  const itemIndex = getColumnIndex(headers, ["item"]);
  const descriptionIndex = getColumnIndex(headers, ["descricao", "descrição"]);
  const responsibleIndex = getColumnIndex(headers, [
    "responsavel",
    "responsável",
    "resp",
    "resp",
  ]);
  const startIndex = getColumnIndex(headers, [
    "data inicio",
    "data início",
    "inicio",
    "início",
  ]);
  const endIndex = getColumnIndex(headers, [
    "data termino",
    "data término",
    "termino",
    "término",
    "fim",
  ]);
  const commentIndex = getColumnIndex(headers, [
    "comentario",
    "comentário",
    "andamento",
    "observacao",
    "observação",
  ]);
  const checklistIndex = getColumnIndex(headers, [
    "checklist",
    "check list",
    "lista",
  ]);
  const statusIndex = getColumnIndex(headers, ["status", "situacao", "situação"]);
  const priorityIndex = getColumnIndex(headers, ["prioridade", "priority"]);

  const tasks = [];
  const projects = [];

  let currentProject = "";

  rows.slice(1).forEach((row) => {
    const item = itemIndex >= 0 ? row[itemIndex] : "";
    const description =
      descriptionIndex >= 0 ? String(row[descriptionIndex] || "").trim() : "";
    const responsible =
      responsibleIndex >= 0 ? String(row[responsibleIndex] || "").trim() : "";

    const startDate = startIndex >= 0 ? formatDate(row[startIndex]) : "";
    const endDate = endIndex >= 0 ? formatDate(row[endIndex]) : "";

    const comment =
      commentIndex >= 0 ? String(row[commentIndex] || "").trim() : "";

    const checklistText =
      checklistIndex >= 0 ? String(row[checklistIndex] || "").trim() : "";

    const status =
      statusIndex >= 0 && row[statusIndex]
        ? String(row[statusIndex]).trim()
        : "Aberto";

    const priority =
      priorityIndex >= 0 && row[priorityIndex]
        ? String(row[priorityIndex]).trim()
        : "Média";

    if (isProjectRow(item, description, responsible, startDate, endDate)) {
      currentProject = cleanProjectName(description);

      if (
        currentProject &&
        !projects.some((project) => project.name === currentProject)
      ) {
        projects.push({
          id: Date.now() + projects.length,
          name: currentProject,
          color: "blue",
        });
      }

      return;
    }

    if (!currentProject) return;

    if (isActivityRow(item, description)) {
      const checklist = createChecklist(checklistText);
      const comments = createInitialComment(comment);

      tasks.push({
        id: Date.now() + tasks.length + 1000,
        parentId: null,
        title: description,
        project: currentProject,
        priority,
        status,
        startDate,
        endDate: endDate || startDate,
        responsible,
        type: "Atividade Primária",
        notes: "",
        progressComment: comment,
        comments,
        evidences: [],
        checklist,
        source: "Excel",
      });
    }
  });

  return {
    tasks,
    projects,
  };
}