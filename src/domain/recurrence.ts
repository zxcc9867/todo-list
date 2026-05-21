import type { RepeatRule } from "./task";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function addMonthsClamped(date: Date, months: number): Date {
  const targetMonthIndex = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const targetDay = Math.min(date.getUTCDate(), daysInUtcMonth(targetYear, targetMonth));

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

export function nextAlarmDate(lastIso: string, repeat: RepeatRule): string | undefined {
  const last = new Date(lastIso);

  if (Number.isNaN(last.getTime())) {
    throw new Error("Invalid alarm date");
  }

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

  return addMonthsClamped(last, 1).toISOString();
}

export function combineDateAndTime(date: string, time = "09:00"): string {
  return new Date(`${date}T${time}:00`).toISOString();
}
