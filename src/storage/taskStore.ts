import { createTask, type AppData, type TaskInput } from "../domain/task";

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

export function loadStore(): AppData {
  const rawData = localStorage.getItem(storageKey);
  if (!rawData) {
    return cloneDefaultData();
  }

  try {
    return JSON.parse(rawData) as AppData;
  } catch {
    localStorage.setItem(`${corruptStorageKeyPrefix}:${Date.now()}`, rawData);
    return cloneDefaultData();
  }
}

export function saveStore(data: AppData): AppData {
  localStorage.setItem(storageKey, JSON.stringify(data));
  return data;
}

export function addTaskToStore(input: TaskInput): AppData {
  const data = loadStore();
  const task = createTask(input);
  const nextData: AppData = {
    ...data,
    tasks: [task, ...data.tasks],
  };

  return saveStore(nextData);
}
