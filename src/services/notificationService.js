import { LocalNotifications } from "@capacitor/local-notifications";

const NOTIF_FLAG          = "masterdot_notifications_enabled";
const NOTIF_DAYS_KEY      = "masterdot_notif_days";
const NOTIF_BRIEFING_KEY  = "masterdot_daily_briefing";
const DAILY_BRIEFING_ID   = 9999;

export function isNotificationsEnabled() {
  return localStorage.getItem(NOTIF_FLAG) === "1";
}

function setNotificationsEnabled(val) {
  if (val) localStorage.setItem(NOTIF_FLAG, "1");
  else localStorage.removeItem(NOTIF_FLAG);
}

export function getNotifDaysBefore() {
  return parseInt(localStorage.getItem(NOTIF_DAYS_KEY) || "3", 10);
}

export function setNotifDaysBefore(n) {
  localStorage.setItem(NOTIF_DAYS_KEY, String(n));
}

export function isDailyBriefingEnabled() {
  return localStorage.getItem(NOTIF_BRIEFING_KEY) === "1";
}

export async function scheduleDailyBriefing(tasks) {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  try { await LocalNotifications.cancel({ notifications: [{ id: DAILY_BRIEFING_ID }] }); } catch {}

  const today = todayISO();
  const open = tasks.filter((t) => t.status !== "Concluído");
  const todayTasks = open.filter(
    (t) => t.startDate && t.endDate && t.startDate <= today && t.endDate >= today
  );
  const late = open.filter((t) => t.endDate && t.endDate < today);

  const body =
    todayTasks.length > 0 || late.length > 0
      ? `${todayTasks.length} atividade(s) hoje${late.length > 0 ? `, ${late.length} atrasada(s)` : ""}`
      : open.length > 0
      ? `${open.length} atividade(s) em aberto`
      : "Tudo em dia! Bom trabalho.";

  await LocalNotifications.schedule({
    notifications: [{
      id: DAILY_BRIEFING_ID,
      title: "☀️ Bom dia — MetaPulse",
      body,
      schedule: { at: nextOccurrence(7, 0), repeating: true, every: "day" },
      smallIcon: "ic_stat_icon_config_sample",
    }],
  });

  localStorage.setItem(NOTIF_BRIEFING_KEY, "1");
  return true;
}

export async function cancelDailyBriefing() {
  try { await LocalNotifications.cancel({ notifications: [{ id: DAILY_BRIEFING_ID }] }); } catch {}
  localStorage.removeItem(NOTIF_BRIEFING_KEY);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateISO, days) {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns a Date for today at hour:minute. If already past, returns tomorrow.
function nextOccurrence(hour, minute) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  return d;
}

// Returns a Date for a specific ISO date at hour:minute, or null if in the past.
function dateAt(isoDate, hour, minute = 0) {
  const d = new Date(`${isoDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
  return d > new Date() ? d : null;
}

function truncate(str, max = 55) {
  return str && str.length > max ? str.slice(0, max - 1) + "…" : str || "";
}

export async function requestNotificationPermission() {
  const perm = await LocalNotifications.requestPermissions();
  return perm.display === "granted";
}

export async function cancelAllTaskNotifications() {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
}

export function getTaskAlerts(tasks) {
  const today = todayISO();
  const limit7 = addDays(today, 7);
  const open = tasks.filter((t) => t.status !== "Concluído");
  return {
    late:     open.filter((t) => t.endDate && t.endDate < today),
    todayDue: open.filter((t) => t.endDate === today),
    next7:    open.filter((t) => t.endDate && t.endDate > today && t.endDate <= limit7),
    critical: open.filter((t) => t.priority === "Alta"),
  };
}

export async function scheduleTaskNotifications(tasks) {
  const granted = await requestNotificationPermission();
  if (!granted) throw new Error("Permissão de notificação negada.");

  await cancelAllTaskNotifications();
  setNotificationsEnabled(true);

  const today    = todayISO();
  const tomorrow = addDays(today, 1);
  const in7      = addDays(today, 7);
  const alerts   = getTaskAlerts(tasks);
  const open     = tasks.filter((t) => t.status !== "Concluído");

  const notifications = [];

  // ── Atrasadas: diária às 8h (repeating) ─────────────────────────────────
  if (alerts.late.length > 0) {
    notifications.push({
      id: 1001,
      title: "⚠️ Atividades atrasadas",
      body: alerts.late.length === 1
        ? truncate(alerts.late[0].title)
        : `${alerts.late.length} atividades estão atrasadas.`,
      schedule: { at: nextOccurrence(8, 0), repeating: true, every: "day" },
      smallIcon: "ic_stat_icon_config_sample",
    });
  }

  // ── Por atividade: prazo hoje (até 10 notificações às 8h05+) ────────────
  const dueToday = alerts.todayDue.slice(0, 10);
  dueToday.forEach((task, i) => {
    const at = nextOccurrence(8, 5 + i);
    notifications.push({
      id: 2000 + i,
      title: "📅 Prazo hoje",
      body: truncate(task.title),
      schedule: { at },
      smallIcon: "ic_stat_icon_config_sample",
    });
  });

  // ── Por atividade: vence amanhã (até 10 notificações às 8h20+) ──────────
  const dueTomorrow = open
    .filter((t) => t.endDate === tomorrow)
    .slice(0, 10);
  dueTomorrow.forEach((task, i) => {
    const at = nextOccurrence(8, 20 + i);
    notifications.push({
      id: 3000 + i,
      title: "🔔 Vence amanhã",
      body: truncate(task.title),
      schedule: { at },
      smallIcon: "ic_stat_icon_config_sample",
    });
  });

  // ── Resumo: próximos 7 dias (exceto hoje/amanhã) às 8h35 ────────────────
  const dueNext7 = open.filter(
    (t) => t.endDate && t.endDate > tomorrow && t.endDate <= in7
  );
  if (dueNext7.length > 0) {
    notifications.push({
      id: 1004,
      title: "🗓️ Vencimentos nos próximos 7 dias",
      body: dueNext7.length === 1
        ? truncate(dueNext7[0].title)
        : `${dueNext7.length} atividades vencem em breve.`,
      schedule: { at: nextOccurrence(8, 35) },
      smallIcon: "ic_stat_icon_config_sample",
    });
  }

  // ── Críticas abertas (Alta prioridade, não concluídas) às 8h45 ──────────
  if (alerts.critical.length > 0) {
    notifications.push({
      id: 1005,
      title: "🔴 Atividades críticas em aberto",
      body: alerts.critical.length === 1
        ? truncate(alerts.critical[0].title)
        : `${alerts.critical.length} atividades de alta prioridade.`,
      schedule: { at: nextOccurrence(8, 45) },
      smallIcon: "ic_stat_icon_config_sample",
    });
  }

  // ── Notificações individuais por prazo (D-day e D-X) para tasks em breve ─
  const daysWindow = Math.max(getNotifDaysBefore(), 2);
  const upcoming = open
    .filter((t) => t.endDate && t.endDate > tomorrow && t.endDate <= addDays(today, daysWindow))
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .slice(0, 20);

  let perTaskId = 4000;
  for (const task of upcoming) {
    // No dia do prazo às 8h
    const onDay = dateAt(task.endDate, 8, 0);
    if (onDay) {
      notifications.push({
        id: perTaskId++,
        title: "📌 Prazo: " + task.endDate.split("-").reverse().join("/"),
        body: truncate(task.title),
        schedule: { at: onDay },
        smallIcon: "ic_stat_icon_config_sample",
      });
    }

    // 1 dia antes às 8h05
    const dayBefore = dateAt(addDays(task.endDate, -1), 8, 5);
    if (dayBefore) {
      notifications.push({
        id: perTaskId++,
        title: "🔔 Vence amanhã",
        body: truncate(task.title),
        schedule: { at: dayBefore },
        smallIcon: "ic_stat_icon_config_sample",
      });
    }
  }

  if (notifications.length === 0) {
    return { scheduled: 0, alerts };
  }

  await LocalNotifications.schedule({ notifications });
  return { scheduled: notifications.length, alerts };
}

// Silently re-schedules if the user previously enabled notifications.
// Call this on app startup after tasks are loaded.
export async function autoScheduleIfEnabled(tasks) {
  if (!isNotificationsEnabled() || tasks.length === 0) return;
  try {
    await scheduleTaskNotifications(tasks);
  } catch {
    // silent — don't bother the user on background reschedule
  }
}
