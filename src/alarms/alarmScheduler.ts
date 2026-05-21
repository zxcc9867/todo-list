import type { Task } from "../domain/task";
import { combineDateAndTime, nextAlarmDate } from "../domain/recurrence";

const dueWindowMs = 60_000;
const maxOccurrenceAdvances = 500;

function nextOccurrenceAfter(task: Task, iso: string): string | undefined {
  return nextAlarmDate(iso, task.alarm.repeat, { anchorDay: task.alarm.monthlyAnchorDay });
}

function alarmOccurrenceDate(task: Task, now: Date): Date | undefined {
  if (!task.alarm.enabled || !task.alarm.time) {
    return undefined;
  }

  let occurrenceIso = task.alarm.lastFiredAt
    ? nextOccurrenceAfter(task, task.alarm.lastFiredAt)
    : combineDateAndTime(task.date, task.alarm.time);

  if (!occurrenceIso) {
    return undefined;
  }

  const advanceMs = (task.alarm.advanceMinutes ?? 0) * 60_000;
  const staleBefore = now.getTime() - dueWindowMs;

  for (let index = 0; index < maxOccurrenceAdvances; index += 1) {
    const occurrence = new Date(occurrenceIso);
    if (Number.isNaN(occurrence.getTime())) {
      return undefined;
    }

    if (task.alarm.lastFiredAt && new Date(task.alarm.lastFiredAt).getTime() >= occurrence.getTime()) {
      return undefined;
    }

    if (occurrence.getTime() - advanceMs >= staleBefore || task.alarm.repeat === "once") {
      return occurrence;
    }

    const nextOccurrenceIso = nextOccurrenceAfter(task, occurrenceIso);
    if (!nextOccurrenceIso) {
      return undefined;
    }
    occurrenceIso = nextOccurrenceIso;
  }

  return undefined;
}

export function findDueAlarms(tasks: Task[], now = new Date()): Task[] {
  const currentMinute = now.getTime();
  return tasks.filter((task) => {
    if (task.status !== "active") return false;
    const occurrence = alarmOccurrenceDate(task, now);
    if (!occurrence) return false;
    const dueTime = occurrence.getTime() - (task.alarm.advanceMinutes ?? 0) * 60_000;
    return dueTime <= currentMinute && currentMinute - dueTime < dueWindowMs;
  });
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") {
    return "denied";
  }
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

function notificationOptions(task: Task): NotificationOptions {
  return {
    body: task.time ? `${task.time} scheduled task.` : "Scheduled task.",
    tag: task.id,
  };
}

export async function showTaskNotification(task: Task): Promise<void> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }

  const options = notificationOptions(task);
  const serviceWorkerReady = navigator.serviceWorker?.ready;
  if (serviceWorkerReady) {
    const registration = await serviceWorkerReady;
    await registration.showNotification(task.title, options);
    return;
  }

  try {
    new Notification(task.title, options);
  } catch {
    // Some browsers expose Notification but block construction outside secure contexts.
  }
}
