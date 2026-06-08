import { Preferences } from "@capacitor/preferences";

export const STORAGE_KEY = "master-dot-gestao-atividades-v1";
const PROD_KEY = "master-dot-production-v1";

export async function loadAppData() {
  const pref = await Preferences.get({ key: STORAGE_KEY });
  if (!pref.value) return null;
  return JSON.parse(pref.value);
}

export async function saveAppData(data) {
  await Preferences.set({
    key: STORAGE_KEY,
    value: JSON.stringify(data),
  });
}

export async function loadProductionData() {
  try {
    const pref = await Preferences.get({ key: PROD_KEY });
    if (!pref.value) return [];
    return JSON.parse(pref.value);
  } catch {
    return [];
  }
}

export async function saveProductionData(records) {
  try {
    await Preferences.set({
      key: PROD_KEY,
      value: JSON.stringify(records),
    });
  } catch (e) {
    console.warn("Could not persist production records:", e);
  }
}