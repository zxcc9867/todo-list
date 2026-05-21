export type TaskStatus = "active" | "completed" | "archived";
export type TaskSource = "manual" | "calendar" | "codex";
export type ThemePreference = "system" | "light" | "dark";

export type RepeatRule =
  | "once"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "until-completed";

export interface AlarmSettings {
  enabled: boolean;
  time?: string;
  repeat: RepeatRule;
  advanceMinutes?: number;
  monthlyAnchorDay?: number;
  lastFiredAt?: string;
  snoozeUntil?: string;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  date: string;
  time?: string;
  priority: "low" | "normal" | "high";
  source: TaskSource;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  alarm: AlarmSettings;
}

export interface AppSettings {
  theme: ThemePreference;
  showKoreanHolidays: boolean;
  notificationsEnabled: boolean;
}

export interface AppData {
  tasks: Task[];
  settings: AppSettings;
}

export interface AlarmInput {
  enabled?: boolean;
  time?: string;
  repeat?: string;
  advanceMinutes?: number;
  monthlyAnchorDay?: number;
}

export interface TaskInput {
  title: string;
  notes?: string;
  date: string;
  time?: string;
  priority?: Task["priority"];
  source: TaskSource;
  alarm?: AlarmInput;
}

export interface CreateTaskOptions {
  now?: Date;
  generateId?: () => string;
}

export const repeatRules: RepeatRule[] = [
  "once",
  "daily",
  "weekdays",
  "weekly",
  "monthly",
  "until-completed",
];

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function normalizeRepeatRule(value: string | undefined): RepeatRule {
  const normalized = (value ?? "once").trim().toLowerCase();
  const labels: Record<string, RepeatRule> = {
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

  const rule = labels[normalized];
  if (!rule) {
    throw new Error(`Invalid repeat rule: ${value}`);
  }
  return rule;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateTime(value: string | undefined, message: string): void {
  if (value !== undefined && !timePattern.test(value)) {
    throw new Error(message);
  }
}

function validateMonthlyAnchorDay(value: number | undefined): void {
  if (
    value !== undefined &&
    (!Number.isFinite(value) || !Number.isInteger(value) || value < 1 || value > 31)
  ) {
    throw new Error("Monthly anchor day must be an integer from 1 to 31");
  }
}

function validatePriority(value: Task["priority"] | undefined): void {
  if (value !== undefined && value !== "low" && value !== "normal" && value !== "high") {
    throw new Error("Invalid task priority");
  }
}

function generateTaskId(generateId: (() => string) | undefined): string {
  const id = generateId?.() ?? globalThis.crypto?.randomUUID?.();
  if (!id) {
    throw new Error("Task ID generator is unavailable");
  }
  return id;
}

export function createTask(input: TaskInput, options: CreateTaskOptions = {}): Task {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Task title is required");
  }
  if (!isValidDate(input.date)) {
    throw new Error("Task date must be a valid YYYY-MM-DD date");
  }

  validateTime(input.time, "Task time must use HH:mm");
  validatePriority(input.priority);

  const alarmEnabled = Boolean(input.alarm?.enabled);
  const alarmTime = input.alarm?.time ?? input.time;
  validateTime(input.alarm?.time, "Alarm time must use HH:mm");
  if (alarmEnabled && !alarmTime) {
    throw new Error("Alarm time is required when alarm is enabled");
  }

  const advanceMinutes = input.alarm?.advanceMinutes;
  if (
    advanceMinutes !== undefined &&
    (!Number.isFinite(advanceMinutes) || !Number.isInteger(advanceMinutes) || advanceMinutes < 0)
  ) {
    throw new Error("Alarm advance minutes must be a non-negative integer");
  }

  validateMonthlyAnchorDay(input.alarm?.monthlyAnchorDay);

  const repeat = normalizeRepeatRule(input.alarm?.repeat);
  const monthlyAnchorDay =
    repeat === "monthly" && alarmTime
      ? (input.alarm?.monthlyAnchorDay ?? Number(input.date.slice(8, 10)))
      : undefined;

  const timestamp = (options.now ?? new Date()).toISOString();
  return {
    id: generateTaskId(options.generateId),
    title,
    notes: input.notes?.trim() ?? "",
    status: "active",
    date: input.date,
    time: input.time,
    priority: input.priority ?? "normal",
    source: input.source,
    createdAt: timestamp,
    updatedAt: timestamp,
    alarm: {
      enabled: alarmEnabled,
      time: alarmTime,
      repeat,
      advanceMinutes,
      monthlyAnchorDay,
    },
  };
}

export function completeTask(task: Task, now = new Date()): Task {
  return {
    ...task,
    status: "completed",
    completedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    alarm: {
      ...task.alarm,
      enabled: false,
    },
  };
}
