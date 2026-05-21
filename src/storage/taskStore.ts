import {
  createTask,
  type AppData,
  type CreateTaskOptions,
  type Task,
  type TaskInput,
} from "../domain/task";
import { cloneDefaultData, defaultData, normalizeData } from "./appData";

const storageKey = "jini-tasks:data";
const corruptStorageKeyPrefix = "jini-tasks:data:corrupt";
const appDataEndpoint = "/api/app-data";

export { defaultData };

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function timestampValue(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortByUpdatedAtDesc(left: Task, right: Task): number {
  return timestampValue(right.updatedAt) - timestampValue(left.updatedAt);
}

export function mergeAppData(localData: AppData, serverData: AppData): AppData {
  const local = normalizeData(localData);
  const server = normalizeData(serverData);
  const tasksById = new Map<string, Task>();

  for (const task of local.tasks) {
    tasksById.set(task.id, task);
  }

  for (const task of server.tasks) {
    const existing = tasksById.get(task.id);
    if (!existing || timestampValue(task.updatedAt) > timestampValue(existing.updatedAt)) {
      tasksById.set(task.id, task);
    }
  }

  return {
    tasks: Array.from(tasksById.values()).sort(sortByUpdatedAtDesc),
    settings: local.settings,
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

export async function loadServerStore(fetcher: Fetcher | undefined = globalThis.fetch): Promise<AppData | undefined> {
  if (!fetcher) {
    return undefined;
  }

  try {
    const response = await fetcher(appDataEndpoint, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return undefined;
    }
    return normalizeData(await response.json());
  } catch {
    return undefined;
  }
}

export async function saveServerStore(data: AppData, fetcher: Fetcher | undefined = globalThis.fetch): Promise<void> {
  if (!fetcher) {
    return;
  }

  try {
    await fetcher(appDataEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeData(data)),
    });
  } catch {
    // Static/production builds do not expose the dev API; localStorage remains the fallback.
  }
}

export function saveStoreAndSync(data: AppData): AppData {
  const savedData = saveStore(data);
  void saveServerStore(savedData);
  return savedData;
}

export async function syncStoreFromServer(currentData = loadStore()): Promise<AppData> {
  const serverData = await loadServerStore();
  if (!serverData) {
    return currentData;
  }

  const mergedData = mergeAppData(currentData, serverData);
  saveStore(mergedData);
  void saveServerStore(mergedData);
  return mergedData;
}

export function addTaskToStore(input: TaskInput, options?: CreateTaskOptions): AppData {
  const data = loadStore();
  const task = createTask(input, options);
  const nextData: AppData = {
    ...data,
    tasks: [task, ...data.tasks],
  };

  return saveStoreAndSync(nextData);
}
