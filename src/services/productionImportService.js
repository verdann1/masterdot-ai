import * as XLSX from "xlsx";

const MAX_IMPORT_ROWS = 30000;

const REQUIRED_COLUMNS = {
  date: ["date", "data"],
  time: ["time", "hora"],
  dateTime: ["datetime", "date/time", "datahora", "data/hora"],
  serial: ["serialnumber", "serial", "barcode", "codigo", "código"],
  user: ["username", "user", "usuario", "usuário", "equipamento"],
  verdict: [
    "verdictoveral",
    "verdict-overal",
    "verdictoverall",
    "verdict overall",
    "resultado",
  ],
};

const PRODUCT_BY_PN = {
  "6EA035710": "IM-65282",
  "6EA035453": "IM-65283A",
  "6EC035710": "IM-65361",
  "6EC035453": "IM-65362A",
  "5U0035453A": "IM-65251",
  "5U5035710A": "IM-65252A",
  "5U6035710A": "IM-50128",
  "5U7035710": "IM-50129",
  "52154650": "IM-65327",
  "26216361": "IM-65307",
  "96330BX050": "IM-65469-1",
  "96330R1050": "IM-50183",
  "96340BX050": "IM-50184",
  "B96330T8100": "IM-65489",
  "B96330T8000": "IM-65490",
  "9876276380": "IM-50002",
  "9876276780": "IM-650010",
};

function getProductByPartNumber(partNumber) {
  return (
    PRODUCT_BY_PN[String(partNumber || "").trim().toUpperCase()] ||
    "Produto não cadastrado"
  );
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[-_/]/g, "");
}

function findColumn(headers, names) {
  const normalizedNames = names.map(normalizeHeader);
  return headers.findIndex((header) =>
    normalizedNames.includes(normalizeHeader(header))
  );
}

function parseTextTable(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
  return lines.map((line) => line.split("\t"));
}

function readDateAndTime(row, indexes) {
  if (indexes.date >= 0 && indexes.time >= 0) {
    return {
      date: String(row[indexes.date] || "").trim(),
      time: String(row[indexes.time] || "").trim().slice(0, 5),
    };
  }
  if (indexes.dateTime >= 0) {
    return formatExcelDate(row[indexes.dateTime]);
  }
  return { date: "", time: "" };
}

function formatExcelDate(value) {
  if (!value) return { date: "", time: "" };
  let d;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return { date: "", time: "" };
    d = new Date(
      parsed.y,
      parsed.m - 1,
      parsed.d,
      parsed.H || 0,
      parsed.M || 0,
      parsed.S || 0
    );
  } else {
    const text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
      const [datePart, timePart = ""] = text.split(/[ T]/);
      return { date: datePart, time: timePart.slice(0, 5) };
    }
    d = new Date(text);
  }
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5),
  };
}

function cleanEquipment(value) {
  return String(value || "").replace(/^win:/i, "").trim();
}

function verdictToResult(value) {
  return Number(value) === 1 ? "OK" : "NOK";
}

function isInvalidReading(value) {
  const text = String(value || "").trim().toUpperCase();
  return (
    !text ||
    text === "A" ||
    text === "C" ||
    text.includes("ERROR") ||
    text.includes("NO READ") ||
    text.includes("NOREAD") ||
    text.includes("BARCODE")
  );
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function cleanToken(value) {
  return String(value || "")
    .replace(/^[^A-Z0-9]+/i, "")
    .replace(/[^A-Z0-9-]+$/i, "")
    .trim();
}

function splitOpAndSerial(value) {
  const digits = onlyDigits(value);
  if (!digits || digits.length <= 5) {
    return { productionOrder: "", serial: digits };
  }
  return {
    productionOrder: digits.slice(0, 5),
    serial: digits.slice(5),
  };
}

const SERIAL_PATTERNS = [
  {
    name: "AYNHP_MARKER_MNC",
    parse(text) {
      const pnMatch = text.match(/AYNHP(.*?)(SFDS|SDSP|SRDS)/);
      const serialMatch = text.match(/@(.*?)MNC/);
      if (!pnMatch || !serialMatch) return null;
      const serialData = splitOpAndSerial(serialMatch[1]);
      return {
        partNumber: cleanToken(pnMatch[1]),
        productionOrder: serialData.productionOrder,
        serial: cleanToken(serialMatch[1]),
        pattern: "AYNHP_MARKER_MNC",
      };
    },
  },

  {
    name: "HASH_PN_SERIAL",
    parse(text) {
      if (!text.startsWith("#")) return null;
      const parts = text
        .replace(/\*/g, "")
        .split("#")
        .map((item) => item.trim())
        .filter(Boolean);
      if (parts.length < 2) return null;
      const partNumber = cleanToken(parts[0]);
      const lastBlock = parts[parts.length - 1].replace(/\s+/g, "");
      if (!partNumber || !lastBlock) return null;
      if (lastBlock.includes("-")) {
        const { productionOrder, serial } = splitOpAndSerial(lastBlock);
        return { partNumber, productionOrder, serial, pattern: "HASH_PN_SERIAL" };
      }
      return {
        partNumber,
        productionOrder: "",
        serial: onlyDigits(lastBlock).replace(/^000/, ""),
        pattern: "HASH_PN_SERIAL",
      };
    },
  },

  {
    // FIX: was using undeclared `serialData` variable — now uses splitOpAndSerial correctly
    name: "NP_V_D",
    parse(text) {
      const pnMatch = text.match(/NP([A-Z0-9]+?)V/i);
      const serialMatch = text.match(/D(\d{8,})/i);
      if (!pnMatch || !serialMatch) return null;
      const serialData = splitOpAndSerial(serialMatch[1]);
      return {
        partNumber: cleanToken(pnMatch[1]),
        productionOrder: serialData.productionOrder,
        serial: cleanToken(serialMatch[1]),
        pattern: "NP_V_D",
      };
    },
  },

  {
    name: "PN_DASH_SERIAL",
    parse(text) {
      if (!text.includes("-")) return null;
      const parts = text
        .split("-")
        .map((item) => item.trim())
        .filter(Boolean);
      if (parts.length < 2) return null;
      const left = parts.slice(0, -1).join("-");
      const serialEnd = parts[parts.length - 1];
      const match = left.match(/^([A-Z0-9]+?)(\d{5,})$/i);
      if (!match) return null;
      const partNumber = cleanToken(match[1]);
      const combinedSerial = `${cleanToken(match[2])}-${cleanToken(serialEnd)}`;
      const { productionOrder, serial } = splitOpAndSerial(combinedSerial);
      if (!partNumber || !serial) return null;
      return { partNumber, productionOrder, serial, pattern: "PN_DASH_SERIAL" };
    },
  },

  {
    name: "PLAIN_PN_SERIAL",
    parse(text) {
      const match = text.match(/^([A-Z0-9]{8,12})(\d{8,})$/i);
      if (!match) return null;
      return {
        partNumber: cleanToken(match[1]),
        productionOrder: "",
        serial: cleanToken(match[2]),
        pattern: "PLAIN_PN_SERIAL",
      };
    },
  },
];

function splitSerialNumber(value) {
  const text = String(value || "").trim().toUpperCase();
  if (isInvalidReading(text)) return null;
  for (const pattern of SERIAL_PATTERNS) {
    const result = pattern.parse(text);
    if (result?.partNumber && result?.serial) {
      return { productionOrder: "", ...result };
    }
  }
  return null;
}

async function readRowsFromFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".log") || name.endsWith(".csv")) {
    const text = await file.text();
    return parseTextTable(text);
  }
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
}

function getColumnIndexes(headers) {
  const indexes = {
    date: findColumn(headers, REQUIRED_COLUMNS.date),
    time: findColumn(headers, REQUIRED_COLUMNS.time),
    dateTime: findColumn(headers, REQUIRED_COLUMNS.dateTime),
    serial: findColumn(headers, REQUIRED_COLUMNS.serial),
    user: findColumn(headers, REQUIRED_COLUMNS.user),
    verdict: findColumn(headers, REQUIRED_COLUMNS.verdict),
  };
  if (indexes.serial < 0) throw new Error("Coluna SerialNumber não encontrada.");
  if (indexes.user < 0) throw new Error("Coluna UserName não encontrada.");
  if (indexes.verdict < 0) throw new Error("Coluna Verdict-Overal não encontrada.");
  if (indexes.date < 0 && indexes.dateTime < 0)
    throw new Error("Coluna Date ou Date/Time não encontrada.");
  return indexes;
}

export async function importProductionFromExcel(file) {
  const rows = await readRowsFromFile(file);
  if (!rows.length) return [];
  const headers = rows[0];
  const indexes = getColumnIndexes(headers);
  return rows
    .slice(1, MAX_IMPORT_ROWS + 1)
    .map((row, index) => {
      const serialInfo = splitSerialNumber(row[indexes.serial]);
      if (!serialInfo) return null;
      const { date, time } = readDateAndTime(row, indexes);
      if (!date || !time) return null;
      return {
        id: Date.now() + index,
        date,
        time,
        equipment: cleanEquipment(row[indexes.user]),
        product: getProductByPartNumber(serialInfo.partNumber),
        partNumber: serialInfo.partNumber,
        productionOrder: serialInfo.productionOrder || "",
        serial: serialInfo.serial,
        barcodePattern: serialInfo.pattern,
        result: verdictToResult(row[indexes.verdict]),
        source:
          file.name.toLowerCase().endsWith(".log") ||
          file.name.toLowerCase().endsWith(".txt")
            ? "Klippel LOG"
            : "Klippel Excel",
        createdAt: new Date().toISOString(),
      };
    })
    .filter(Boolean);
}
