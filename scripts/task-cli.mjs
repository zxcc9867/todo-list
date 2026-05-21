import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repeatLabels = {
  "1회": "once",
  once: "once",
  매일: "daily",
  daily: "daily",
  평일: "weekdays",
  weekdays: "weekdays",
  매주: "weekly",
  weekly: "weekly",
  매월: "monthly",
  monthly: "monthly",
  "완료할 때까지 반복": "until-completed",
  "until-completed": "until-completed",
};

const defaultData = {
  tasks: [],
  settings: {
    theme: "system",
    showKoreanHolidays: true,
    notificationsEnabled: false,
  },
};

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(rootDir, "data", "tasks.json");

function parseArgs(argv) {
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
    throw new Error("Task date must be today or a valid YYYY-MM-DD date");
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("Task date must be today or a valid YYYY-MM-DD date");
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

function validateTime(value) {
  if (value !== undefined && !timePattern.test(value)) {
    throw new Error("Task time must use HH:mm");
  }
}

function createTask(input) {
  const title = input.title?.trim() ?? "";
  if (!title) {
    throw new Error("Task title is required");
  }

  const date = normalizeDate(input.date ?? "today");
  validateTime(input.time);
  const repeat = normalizeRepeatRule(input.repeat);
  const now = new Date().toISOString();
  const monthlyAnchorDay = repeat === "monthly" && input.time ? Number(date.slice(8, 10)) : undefined;

  return {
    id: randomUUID(),
    title,
    notes: "",
    status: "active",
    date,
    time: input.time,
    priority: "normal",
    source: "codex",
    createdAt: now,
    updatedAt: now,
    alarm: {
      enabled: Boolean(input.time),
      time: input.time,
      repeat,
      advanceMinutes: undefined,
      monthlyAnchorDay,
    },
  };
}

async function loadData() {
  try {
    const rawData = await readFile(dataPath, "utf8");
    const data = JSON.parse(rawData);
    return {
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      settings: data.settings ?? defaultData.settings,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return defaultData;
    }
    throw error;
  }
}

async function main() {
  const [command, ...argv] = process.argv.slice(2);
  if (command !== "add") {
    throw new Error("Usage: npm run task:add -- --title \"...\" --date today --time 15:30 --repeat weekly");
  }

  const args = parseArgs(argv);
  const task = createTask(args);
  const data = await loadData();
  const nextData = {
    ...data,
    tasks: [task, ...data.tasks],
  };

  await writeFile(dataPath, `${JSON.stringify(nextData, null, 2)}\n`, "utf8");
  console.log(`Added task: ${task.title}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
