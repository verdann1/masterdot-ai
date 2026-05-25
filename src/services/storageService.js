import { Preferences } from "@capacitor/preferences";

export const STORAGE_KEY = "master-dot-gestao-atividades-v1";

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