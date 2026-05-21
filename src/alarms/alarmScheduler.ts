import type { Task } from "../domain/task";

function alarmDate(task: Task): Date | undefined {
  if (!task.alarm.enabled || !task.alarm.time) {
    return undefined;
  }
  const [hour, minute] = task.alarm.time.split(":").map(Number);
  const date = new Date(`${task.date}T00:00:00.000`);
  date.setHours(hour, minute, 0, 0);
  if (task.alarm.advanceMinutes) {
    date.setMinutes(date.getMinutes() - task.alarm.advanceMinutes);
  }
  return date;
}

export function findDueAlarms(tasks: Task[], now = new Date()): Task[] {
  const currentMinute = now.getTime();
  return tasks.filter((task) => {
    if (task.status !== "active") return false;
    const due = alarmDate(task);
    if (!due) return false;
    const dueTime = due.getTime();
    return dueTime <= currentMinute && currentMinute - dueTime < 60_000;
  });
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

export function showTaskNotification(task: Task): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  new Notification(task.title, {
    body: task.time ? `${task.time} 예정된 작업입니다.` : "예정된 작업입니다.",
    tag: task.id,
  });
}
