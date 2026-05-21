import {
  createTask,
  repeatRules,
  type AppData,
  type AppSettings,
  type CreateTaskOptions,
  type Task,
  type TaskInput,
} from "../domain/task";

const storageKey = "jini-tasks:data";
const corruptStorageKeyPrefix = "jini-tasks:data:corrupt";

export const defaultData: AppData = {
  tasks: [],
  settings: {
    theme: "system",
    showKoreanHolidays: true,
    notificationsEnabled: false,
  },
};

function cloneDefaultData(): AppData {
  return {
    tasks: [],
    settings: { ...defaultData.settings },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidTask(value: unknown): value is Task {
  if (!isRecord(value) || !isRecord(value.alarm)) {
    return false;
  }

  const alarm = value.alarm;
  const validStatuses = ["active", "completed", "archived"];
  const validSources = ["manual", "calendar", "codex"];

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.date === "string" &&
    typeof value.status === "string" &&
    validStatuses.includes(value.status) &&
    typeof value.source === "string" &&
    validSources.includes(value.source) &&
    typeof alarm.enabled === "boolean" &&
    typeof alarm.repeat === "string" &&
    repeatRules.some((repeat) => repeat === alarm.repeat)
  );
}

function normalizeSettings(value: unknown): AppSettings {
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

function normalizeData(value: unknown): AppData {
  if (!isRecord(value)) {
    return cloneDefaultData();
  }

  return {
    tasks: Array.isArray(value.tasks) ? value.tasks.filter(isValidTask) : [],
    settings: normalizeSettings(value.settings),
  };
}

export function loadStore(): AppData {
  const rawData = localStorage.getItem(storageKey);
  if (!rawData) {
    return cloneDefaultData();
  }

  try {
    return normalizeData(JSON.parse(rawData));
  } catch {
    const data = cloneDefaultData();
    try {
      localStorage.setItem(`${corruptStorageKeyPrefix}:${Date.now()}`, rawData);
    } catch {
      // Recovery should not depend on backup storage succeeding.
    }
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  }
}

export function saveStore(data: AppData): AppData {
  localStorage.setItem(storageKey, JSON.stringify(data));
  return data;
}

export function addTaskToStore(input: TaskInput, options?: CreateTaskOptions): AppData {
  const data = loadStore();
  const task = createTask(input, options);
  const nextData: AppData = {
    ...data,
    tasks: [task, ...data.tasks],
  };

  return saveStore(nextData);
}
