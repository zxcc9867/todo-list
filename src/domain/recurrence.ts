import type { RepeatRule } from "./task";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

type NextAlarmDateOptions = {
  anchorDay?: number;
};

function addMonthsClamped(date: Date, months: number, anchorDay = date.getUTCDate()): Date {
  const targetMonthIndex = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const targetDay = Math.min(anchorDay, daysInUtcMonth(targetYear, targetMonth));

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

function validateDateInput(date: string): void {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error("Invalid alarm date");
  }

  const [, year, month, day] = match;
  const parsed = new Date(`${date}T00:00:00`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    throw new Error("Invalid alarm date");
  }
}

function validateTimeInput(time: string): void {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("Invalid alarm time");
  }
}

function validateAnchorDay(anchorDay: number | undefined): void {
  if (
    anchorDay !== undefined &&
    (!Number.isFinite(anchorDay) || !Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31)
  ) {
    throw new Error("Monthly anchor day must be an integer from 1 to 31");
  }
}

export function nextAlarmDate(
  lastIso: string,
  repeat: RepeatRule,
  options: NextAlarmDateOptions = {},
): string | undefined {
  const last = new Date(lastIso);

  if (Number.isNaN(last.getTime())) {
    throw new Error("Invalid alarm date");
  }
  validateAnchorDay(options.anchorDay);

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

  return addMonthsClamped(last, 1, options.anchorDay).toISOString();
}

export function combineDateAndTime(date: string, time = "09:00"): string {
  validateDateInput(date);
  validateTimeInput(time);

  return new Date(`${date}T${time}:00`).toISOString();
}
