import { Preferences } from "@capacitor/preferences";

const KEY = "masterdot_timetracking_v1";

export async function loadTimeTracking() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return { employees: [], records: [] };
    return JSON.parse(value);
  } catch {
    return { employees: [], records: [] };
  }
}

export async function saveTimeTracking(data) {
  await Preferences.set({ key: KEY, value: JSON.stringify(data) });
}
