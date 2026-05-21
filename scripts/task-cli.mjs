import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createTask } from "../src/domain/task.ts";
import { defaultData, normalizeData } from "../src/storage/appData.ts";

export { defaultData };

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

function normalizeCliDate(value) {
  if (value === "today") {
    return todayString();
  }
  return value;
}

function parseIntegerOption(value) {
  if (value === undefined) {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : value;
}

export function createTaskFromCliArgs(args, options = {}) {
  const alarmTime = args.alarmTime ?? args.time;
  return createTask(
    {
      title: args.title,
      notes: args.notes,
      date: normalizeCliDate(args.date ?? "today"),
      time: args.time,
      priority: args.priority,
      source: "codex",
      alarm: {
        enabled: Boolean(alarmTime),
        time: alarmTime,
        repeat: args.repeat,
        monthlyAnchorDay: parseIntegerOption(args.monthlyAnchorDay),
        advanceMinutes: parseIntegerOption(args.advanceMinutes),
      },
    },
    options,
  );
}

export function createCliTask(args, options = {}) {
  return createTaskFromCliArgs(args, options);
}

export async function loadData(targetPath = dataPath) {
  try {
    const rawData = await readFile(targetPath, "utf8");
    return normalizeData(JSON.parse(rawData));
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
