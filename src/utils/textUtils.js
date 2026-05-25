export function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getColumn(row, possibleNames) {
  const keys = Object.keys(row || {});
  const foundKey = keys.find((key) => possibleNames.includes(normalizeText(key)));
  return foundKey ? row[foundKey] : "";
}