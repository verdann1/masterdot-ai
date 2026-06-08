import { LocalNotifications } from "@capacitor/local-notifications";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeNotificationDate(hour = 8, minute = 0) {
  const date = new Date();

  date.setHours(hour, minute, 0, 0);

  if (date <= new Date()) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

export async function requestNotificationPermission() {
  const permission = await LocalNotifications.requestPermissions();

  return permission.display === "granted";
}

export async function cancelAllTaskNotifications() {
  const pending = await LocalNotifications.getPending();

  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((item) => ({
        id: item.id,
      })),
    });
  }
}

export function getTaskAlerts(tasks) {
  const today = todayISO();
  const limit7 = addDays(today, 7);

  const open = tasks.filter((task) => task.status !== "Concluído");

  const late = open.filter((task) => task.endDate && task.endDate < today);

  const todayDue = open.filter((task) => task.endDate === today);

  const next7 = open.filter(
    (task) => task.endDate && task.endDate > today && task.endDate <= limit7
  );

  const critical = open.filter((task) => task.priority === "Alta");

  return {
    late,
    todayDue,
    next7,
    critical,
  };
}

export async function scheduleTaskNotifications(tasks) {
  const allowed = await requestNotificationPermission();

  if (!allowed) {
    throw new Error("Permissão de notificação negada.");
  }

  await cancelAllTaskNotifications();

  const alerts = getTaskAlerts(tasks);

  const notifications = [];

  if (alerts.late.length > 0) {
    notifications.push({
      id: 1001,
      title: "Master DOT - Atividades atrasadas",
      body: `${alerts.late.length} atividade(s) estão atrasadas.`,
      schedule: {
        at: makeNotificationDate(8, 0),
      },
      smallIcon: "ic_stat_icon_config_sample",
    });
  }

  if (alerts.todayDue.length > 0) {
    notifications.push({
      id: 1002,
      title: "Master DOT - Vencem hoje",
      body: `${alerts.todayDue.length} atividade(s) vencem hoje.`,
      schedule: {
        at: makeNotificationDate(8, 10),
      },
      smallIcon: "ic_stat_icon_config_sample",
    });
  }

  if (alerts.critical.length > 0) {
    notifications.push({
      id: 1003,
      title: "Master DOT - Atividades críticas",
      body: `${alerts.critical.length} atividade(s) críticas em aberto.`,
      schedule: {
        at: makeNotificationDate(8, 20),
      },
      smallIcon: "ic_stat_icon_config_sample",
    });
  }

  if (alerts.next7.length > 0) {
    notifications.push({
      id: 1004,
      title: "Master DOT - Próximos 7 dias",
      body: `${alerts.next7.length} atividade(s) vencem nos próximos 7 dias.`,
      schedule: {
        at: makeNotificationDate(8, 30),
      },
      smallIcon: "ic_stat_icon_config_sample",
    });
  }

  if (notifications.length === 0) {
    return {
      scheduled: 0,
      alerts,
    };
  }

  await LocalNotifications.schedule({
    notifications,
  });

  return {
    scheduled: notifications.length,
    alerts,
  };
}