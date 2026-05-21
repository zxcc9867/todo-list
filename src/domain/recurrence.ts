import type { RepeatRule } from "./task";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function nextAlarmDate(lastIso: string, repeat: RepeatRule): string | undefined {
  const last = new Date(lastIso);

  if (repeat === "once") {
    return undefined;
  }

  if (repeat === "daily" || repeat === "until-completed") {
    return addDays(last, 1).toISOString();
  }

  if (repeat === "weekdays") {
    let next = addDays(last, 1);
    while (next.getUTCDay() === 0 || next.getUTCDay() === 6) {
      next = addDays(next, 1);
    }
    return next.toISOString();
  }

  if (repeat === "weekly") {
    return addDays(last, 7).toISOString();
  }

  const next = new Date(last);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next.toISOString();
}

export function combineDateAndTime(date: string, time = "09:00"): string {
  return `${date}T${time}:00.000`;
}
