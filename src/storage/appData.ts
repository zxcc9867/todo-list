import {
  repeatRules,
  type AlarmSettings,
  type AppData,
  type AppSettings,
  type Task,
} from "../domain/task";

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const defaultData: AppData = {
  tasks: [],
  settings: {
    theme: "system",
    showKoreanHolidays: true,
    notificationsEnabled: false,
  },
};

export function cloneDefaultData(): AppData {
  return {
    tasks: [],
    settings: { ...defaultData.settings },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isOptionalTime(value: unknown): boolean {
  return value === undefined || (typeof value === "string" && timePattern.test(value));
}

function isNonNegativeInteger(value: unknown): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && Number(value) >= 0;
}

function isMonthlyAnchorDay(value: unknown): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 31;
}

function isValidAlarm(value: unknown): value is AlarmSettings {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.enabled === "boolean" &&
    typeof value.repeat === "string" &&
    repeatRules.some((repeat) => repeat === value.repeat) &&
    isOptionalTime(value.time) &&
    (value.advanceMinutes === undefined || isNonNegativeInteger(value.advanceMinutes)) &&
    (value.monthlyAnchorDay === undefined || isMonthlyAnchorDay(value.monthlyAnchorDay)) &&
    isOptionalString(value.lastFiredAt) &&
    isOptionalString(value.snoozeUntil)
  );
}

export function isValidTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  const validStatuses = ["active", "completed", "archived"];
  const validSources = ["manual", "calendar", "codex"];
  const validPriorities = ["low", "normal", "high"];

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.notes === "string" &&
    typeof value.date === "string" &&
    isOptionalTime(value.time) &&
    typeof value.status === "string" &&
    validStatuses.includes(value.status) &&
    typeof value.priority === "string" &&
    validPriorities.includes(value.priority) &&
    typeof value.source === "string" &&
    validSources.includes(value.source) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isOptionalString(value.completedAt) &&
    isValidAlarm(value.alarm)
  );
}

export function normalizeSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return { ...defaultData.settings };
  }

  const settings = { ...defaultData.settings };
  if (value.theme === "system" || value.theme === "light" || value.theme === "dark") {
    settings.theme = value.theme;
  }
  if (typeof value.showKoreanHolidays === "boolean") {
    settings.showKoreanHolidays = value.showKoreanHolidays;
  }
  if (typeof value.notificationsEnabled === "boolean") {
    settings.notificationsEnabled = value.notificationsEnabled;
  }
  return settings;
}

export function normalizeData(value: unknown): AppData {
  if (!isRecord(value)) {
    return cloneDefaultData();
  }

  return {
    tasks: Array.isArray(value.tasks) ? value.tasks.filter(isValidTask) : [],
    settings: normalizeSettings(value.settings),
  };
}
