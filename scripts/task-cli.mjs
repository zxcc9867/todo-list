import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const repeatRules = ["once", "daily", "weekdays", "weekly", "monthly", "until-completed"];

const repeatLabels = {
  "\u0031\ud68c": "once",
  once: "once",
  "\ub9e4\uc77c": "daily",
  daily: "daily",
  "\ud3c9\uc77c": "weekdays",
  weekdays: "weekdays",
  "\ub9e4\uc8fc": "weekly",
  weekly: "weekly",
  "\ub9e4\uc6d4": "monthly",
  monthly: "monthly",
  "\uc644\ub8cc\ud560 \ub54c\uae4c\uc9c0 \ubc18\ubcf5": "until-completed",
  "until-completed": "until-completed",
};

export const defaultData = {
  tasks: [],
  settings: {
    theme: "system",
    showKoreanHolidays: true,
    notificationsEnabled: false,
  },
};

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const dataPath = path.join(rootDir, "data", "tasks.json");

export function parseTaskArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = value;
    index += 1;
  }
  return args;
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value) {
  if (value === "today") {
    return todayString();
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Task date must be a valid YYYY-MM-DD date");
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("Task date must be a valid YYYY-MM-DD date");
  }
  return value;
}

function normalizeRepeatRule(value = "once") {
  const repeat = repeatLabels[value.trim().toLowerCase()];
  if (!repeat) {
    throw new Error(`Invalid repeat rule: ${value}`);
  }
  return repeat;
}

function validateTime(value, message) {
  if (value !== undefined && !timePattern.test(value)) {
    throw new Error(message);
  }
}

function normalizeMonthlyAnchorDay(value) {
  if (value === undefined) {
    return undefined;
  }

  const monthlyAnchorDay = Number(value);
  if (
    !Number.isFinite(monthlyAnchorDay) ||
    !Number.isInteger(monthlyAnchorDay) ||
    monthlyAnchorDay < 1 ||
    monthlyAnchorDay > 31
  ) {
    throw new Error("Monthly anchor day must be an integer from 1 to 31");
  }
  return monthlyAnchorDay;
}

export function createCliTask(input, options = {}) {
  const title = input.title?.trim() ?? "";
  if (!title) {
    throw new Error("Task title is required");
  }

  const date = normalizeDate(input.date ?? "today");
  validateTime(input.time, "Task time must use HH:mm");

  const alarmTime = input.alarmTime ?? input.time;
  validateTime(input.alarmTime, "Alarm time must use HH:mm");

  const repeat = normalizeRepeatRule(input.repeat);
  const inputMonthlyAnchorDay = normalizeMonthlyAnchorDay(input.monthlyAnchorDay);
  const monthlyAnchorDay =
    repeat === "monthly" && alarmTime
      ? (inputMonthlyAnchorDay ?? Number(date.slice(8, 10)))
      : undefined;

  const timestamp = (options.now ?? new Date()).toISOString();
  return {
    id: options.generateId?.() ?? randomUUID(),
    title,
    notes: input.notes?.trim() ?? "",
    status: "active",
    date,
    time: input.time,
    priority: "normal",
    source: "codex",
    createdAt: timestamp,
    updatedAt: timestamp,
    alarm: {
      enabled: Boolean(alarmTime),
      time: alarmTime,
      repeat,
      advanceMinutes: undefined,
      monthlyAnchorDay,
    },
  };
}

export async function loadData(targetPath = dataPath) {
  try {
    const rawData = await readFile(targetPath, "utf8");
    const data = JSON.parse(rawData);
    return {
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      settings: data.settings ?? defaultData.settings,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        tasks: [],
        settings: { ...defaultData.settings },
      };
    }
    throw error;
  }
}

export async function saveData(data, targetPath = dataPath) {
  const directory = path.dirname(targetPath);
  await mkdir(directory, { recursive: true });

  const tempPath = path.join(
    directory,
    `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.tmp`,
  );
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tempPath, targetPath);
}

export async function addTask(argv, targetPath = dataPath) {
  const args = parseTaskArgs(argv);
  const task = createCliTask(args);
  const data = await loadData(targetPath);
  const nextData = {
    ...data,
    tasks: [task, ...data.tasks],
  };

  await saveData(nextData, targetPath);
  return task;
}

async function main() {
  const [command, ...argv] = process.argv.slice(2);
  if (command !== "add") {
    throw new Error("Usage: npm run task:add -- --title \"...\" --date today --time 15:30 --repeat weekly");
  }

  const task = await addTask(argv);
  console.log(`Added task: ${task.title}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
