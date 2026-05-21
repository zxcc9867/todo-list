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

export interface TaskInput {
  title: string;
  notes?: string;
  date: string;
  time?: string;
  priority?: Task["priority"];
  source: TaskSource;
  alarm?: Partial<AlarmSettings>;
}

export const repeatRules: RepeatRule[] = [
  "once",
  "daily",
  "weekdays",
  "weekly",
  "monthly",
  "until-completed",
];

export function normalizeRepeatRule(value: string | undefined): RepeatRule {
  const normalized = (value ?? "once").trim().toLowerCase();
  const labels: Record<string, RepeatRule> = {
    "1회": "once",
    once: "once",
    "매일": "daily",
    daily: "daily",
    "평일": "weekdays",
    weekdays: "weekdays",
    "매주": "weekly",
    weekly: "weekly",
    "매월": "monthly",
    monthly: "monthly",
    "완료할 때까지 반복": "until-completed",
    "until-completed": "until-completed",
  };

  const rule = labels[normalized];
  if (!rule) {
    throw new Error(`Invalid repeat rule: ${value}`);
  }
  return rule;
}

export function createTask(input: TaskInput, now = new Date()): Task {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Task title is required");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error("Task date must use YYYY-MM-DD");
  }
  if (input.time && !/^\d{2}:\d{2}$/.test(input.time)) {
    throw new Error("Task time must use HH:mm");
  }

  const alarmEnabled = Boolean(input.alarm?.enabled);
  const alarmTime = input.alarm?.time ?? input.time;
  if (alarmEnabled && alarmTime && !/^\d{2}:\d{2}$/.test(alarmTime)) {
    throw new Error("Alarm time must use HH:mm");
  }

  const timestamp = now.toISOString();
  return {
    id: crypto.randomUUID(),
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
      repeat: normalizeRepeatRule(input.alarm?.repeat),
      advanceMinutes: input.alarm?.advanceMinutes,
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
