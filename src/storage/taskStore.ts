import {
  createTask,
  type AppData,
  type CreateTaskOptions,
  type TaskInput,
} from "../domain/task";
import { cloneDefaultData, defaultData, normalizeData } from "./appData";

const storageKey = "jini-tasks:data";
const corruptStorageKeyPrefix = "jini-tasks:data:corrupt";

export { defaultData };

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
