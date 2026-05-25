import { LocalNotifications } from "@capacitor/local-notifications";

export async function scheduleTaskNotifications(tasks) {
  const permission = await LocalNotifications.requestPermissions();

  if (permission.display !== "granted") {
    alert("Permissão de notificação não concedida.");
    return;
  }

  const notifications = tasks
    .filter((task) => task.status !== "Concluído" && task.endDate)
    .flatMap((task) => {
      const dueDate = new Date(`${task.endDate}T08:00:00`);
      const previousDate = new Date(dueDate);
      previousDate.setDate(previousDate.getDate() - 1);

      const now = new Date();
      const baseId = Number(String(task.id).slice(-7));
      const list = [];

      if (previousDate > now) {
        list.push({
          id: baseId,
          title: "Prazo amanhã",
          body: task.title,
          schedule: { at: previousDate },
        });
      }

      if (dueDate > now) {
        list.push({
          id: baseId + 10000000,
          title: "Prazo vence hoje",
          body: task.title,
          schedule: { at: dueDate },
        });
      }

      return list;
    });

  if (!notifications.length) {
    alert("Não há atividades futuras com prazo para notificar.");
    return;
  }

  await LocalNotifications.schedule({ notifications });
  alert(`${notifications.length} notificações agendadas.`);
}