# Jini Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive local-first task app with today/completed views, a Japan-based calendar with Korean holiday overlay, task-level alarms, dark mode, startup support, and Codex/CLI task insertion.

**Architecture:** Use a Vite React TypeScript app with a small domain layer shared by the UI, alarm scheduler, and CLI. Store app data in a local JSON-backed service for CLI access and mirror it into browser local storage for the web UI.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, Node CLI scripts, Browser Notification API, PWA service worker, PowerShell startup scripts.

---

## File Structure

- `package.json`: npm scripts for development, tests, build, CLI task insertion, and startup helpers.
- `index.html`: app shell.
- `src/main.tsx`: React entrypoint.
- `src/App.tsx`: top-level app state, navigation, and layout composition.
- `src/domain/task.ts`: task, alarm, settings types and validation.
- `src/domain/task.test.ts`: task validation tests.
- `src/domain/recurrence.ts`: alarm repeat scheduling.
- `src/domain/recurrence.test.ts`: repeat scheduling tests.
- `src/domain/holidays.ts`: bundled Japan/Korea holiday data and calendar overlay helpers.
- `src/domain/holidays.test.ts`: Japan base, Korea overlay, and JP+KR merge tests.
- `src/storage/taskStore.ts`: browser local storage task store.
- `src/storage/taskStore.test.ts`: browser storage tests with mocked storage.
- `src/alarms/alarmScheduler.ts`: due-alarm detection and notification scheduling helpers.
- `src/alarms/alarmScheduler.test.ts`: alarm scheduler tests.
- `src/components/Layout.tsx`: shell, sidebar, header tabs, responsive structure.
- `src/components/TodayView.tsx`: today metrics, active tasks, completed tasks, quick add.
- `src/components/CalendarView.tsx`: month grid, Japan holidays, Korea overlay toggle, inline schedule form.
- `src/components/CompletedView.tsx`: completed task history.
- `src/components/AlarmsView.tsx`: active alarm list and repeat summary.
- `src/components/SettingsView.tsx`: theme, notification permission, Korea overlay default, startup instructions.
- `src/components/TaskForm.tsx`: shared task/schedule form with time and repeat controls.
- `src/components/TaskCard.tsx`: task card with completion and alarm details.
- `src/styles.css`: responsive light/dark UI styling.
- `src/vite-env.d.ts`: Vite TypeScript declarations.
- `scripts/task-cli.mjs`: Codex/CLI task insertion into `data/tasks.json`.
- `scripts/enable-startup.ps1`: create Windows Startup shortcut.
- `scripts/disable-startup.ps1`: remove Windows Startup shortcut.
- `data/tasks.json`: initial local task store for CLI writes.
- `public/manifest.webmanifest`: installable PWA metadata.
- `public/sw.js`: simple service worker shell cache.

## Task 1: Scaffold App And Tooling

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/vite-env.d.ts`
- Create: `data/tasks.json`

- [ ] **Step 1: Create project metadata and scripts**

Write `package.json`:

```json
{
  "name": "jini-tasks",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest",
    "task:add": "node scripts/task-cli.mjs add",
    "startup:enable": "powershell -ExecutionPolicy Bypass -File scripts/enable-startup.ps1",
    "startup:disable": "powershell -ExecutionPolicy Bypass -File scripts/disable-startup.ps1"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.0.0",
    "typescript": "^5.8.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^25.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and npm exits successfully.

- [ ] **Step 3: Add Vite and TypeScript config**

Write `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
});
```

Write `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 4: Add the initial app shell**

Write `index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1e7b62" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>Jini Tasks</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Write `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

Write `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Write `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>Jini Tasks</h1>
      <p>오늘 할 일, 캘린더, 알람을 한 곳에서 관리합니다.</p>
    </main>
  );
}
```

Write `src/styles.css`:

```css
:root {
  color-scheme: light;
  font-family: "Segoe UI", "Noto Sans KR", Arial, sans-serif;
  color: #17211f;
  background: #f4f6f2;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

.app-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px;
}
```

Write `data/tasks.json`:

```json
{
  "tasks": [],
  "settings": {
    "theme": "system",
    "showKoreanHolidays": true,
    "notificationsEnabled": false
  }
}
```

- [ ] **Step 5: Verify the shell**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully.

- [ ] **Step 6: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html tsconfig.json vite.config.ts src data
git commit -m "chore: scaffold jini tasks app"
```

Expected: commit succeeds if this project is inside a git repository. If git is not initialized, run `git init` first, then repeat the commit.

## Task 2: Add Task Domain Model And Validation

**Files:**
- Create: `src/domain/task.ts`
- Create: `src/domain/task.test.ts`

- [ ] **Step 1: Write failing validation tests**

Write `src/domain/task.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createTask, normalizeRepeatRule } from "./task";

describe("createTask", () => {
  it("creates a valid task with alarm settings", () => {
    const task = createTask({
      title: "주간 회고 초안 정리",
      date: "2026-05-21",
      time: "15:30",
      source: "manual",
      alarm: {
        enabled: true,
        time: "15:30",
        repeat: "weekly",
        advanceMinutes: 30,
      },
    });

    expect(task.title).toBe("주간 회고 초안 정리");
    expect(task.alarm.enabled).toBe(true);
    expect(task.alarm.repeat).toBe("weekly");
    expect(task.status).toBe("active");
  });

  it("rejects an empty title", () => {
    expect(() =>
      createTask({
        title: "   ",
        date: "2026-05-21",
        source: "manual",
      }),
    ).toThrow("Task title is required");
  });

  it("normalizes Korean repeat labels", () => {
    expect(normalizeRepeatRule("완료할 때까지 반복")).toBe("until-completed");
    expect(normalizeRepeatRule("매주")).toBe("weekly");
  });
});
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `npm test -- src/domain/task.test.ts`

Expected: FAIL because `src/domain/task.ts` does not exist.

- [ ] **Step 3: Implement task types and validation**

Write `src/domain/task.ts`:

```ts
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
```

- [ ] **Step 4: Run validation tests**

Run: `npm test -- src/domain/task.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit domain model**

Run:

```bash
git add src/domain/task.ts src/domain/task.test.ts
git commit -m "feat: add task domain model"
```

Expected: commit succeeds.

## Task 3: Add Repeat Scheduling

**Files:**
- Create: `src/domain/recurrence.ts`
- Create: `src/domain/recurrence.test.ts`

- [ ] **Step 1: Write failing recurrence tests**

Write `src/domain/recurrence.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { nextAlarmDate } from "./recurrence";

describe("nextAlarmDate", () => {
  it("returns no next date for once", () => {
    expect(nextAlarmDate("2026-05-21T15:30:00.000Z", "once")).toBeUndefined();
  });

  it("schedules daily alarms one day later", () => {
    expect(nextAlarmDate("2026-05-21T09:00:00.000Z", "daily")).toBe("2026-05-22T09:00:00.000Z");
  });

  it("skips weekends for weekdays", () => {
    expect(nextAlarmDate("2026-05-22T09:00:00.000Z", "weekdays")).toBe("2026-05-25T09:00:00.000Z");
  });

  it("schedules weekly alarms seven days later", () => {
    expect(nextAlarmDate("2026-05-21T15:30:00.000Z", "weekly")).toBe("2026-05-28T15:30:00.000Z");
  });

  it("schedules monthly alarms one month later", () => {
    expect(nextAlarmDate("2026-05-21T15:30:00.000Z", "monthly")).toBe("2026-06-21T15:30:00.000Z");
  });

  it("treats until-completed as daily cadence", () => {
    expect(nextAlarmDate("2026-05-21T18:00:00.000Z", "until-completed")).toBe("2026-05-22T18:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run recurrence tests to confirm failure**

Run: `npm test -- src/domain/recurrence.test.ts`

Expected: FAIL because `nextAlarmDate` is not defined.

- [ ] **Step 3: Implement recurrence helper**

Write `src/domain/recurrence.ts`:

```ts
import type { RepeatRule } from "./task";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function nextAlarmDate(lastIso: string, repeat: RepeatRule): string | undefined {
  const last = new Date(lastIso);

  if (repeat === "once") {
    return undefined;
  }

  if (repeat === "daily" || repeat === "until-completed") {
    return addDays(last, 1).toISOString();
  }

  if (repeat === "weekdays") {
    let next = addDays(last, 1);
    while (next.getUTCDay() === 0 || next.getUTCDay() === 6) {
      next = addDays(next, 1);
    }
    return next.toISOString();
  }

  if (repeat === "weekly") {
    return addDays(last, 7).toISOString();
  }

  const next = new Date(last);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next.toISOString();
}

export function combineDateAndTime(date: string, time = "09:00"): string {
  return `${date}T${time}:00.000`;
}
```

- [ ] **Step 4: Run recurrence tests**

Run: `npm test -- src/domain/recurrence.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit recurrence scheduling**

Run:

```bash
git add src/domain/recurrence.ts src/domain/recurrence.test.ts
git commit -m "feat: add alarm recurrence scheduling"
```

Expected: commit succeeds.

## Task 4: Add Japan Holiday Base And Korea Overlay

**Files:**
- Create: `src/domain/holidays.ts`
- Create: `src/domain/holidays.test.ts`

- [ ] **Step 1: Write failing holiday tests**

Write `src/domain/holidays.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildMonthCells, getHolidayBadges } from "./holidays";

describe("holiday calendar", () => {
  it("uses Japanese holidays by default", () => {
    const badges = getHolidayBadges("2026-05-06", false);
    expect(badges).toEqual([{ country: "JP", name: "振替休日" }]);
  });

  it("adds Korean holidays when overlay is enabled", () => {
    const badges = getHolidayBadges("2026-05-25", true);
    expect(badges).toEqual([{ country: "KR", name: "대체공휴일" }]);
  });

  it("merges JP and KR badges on the same date", () => {
    const badges = getHolidayBadges("2026-05-05", true);
    expect(badges).toEqual([
      { country: "JP", name: "こどもの日" },
      { country: "KR", name: "어린이날" },
    ]);
  });

  it("builds May 2026 month cells starting on Friday", () => {
    const cells = buildMonthCells(2026, 4, true);
    expect(cells[0].date).toBeUndefined();
    expect(cells[5].date).toBe("2026-05-01");
    expect(cells.some((cell) => cell.date === "2026-05-05" && cell.badges.length === 2)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `npm test -- src/domain/holidays.test.ts`

Expected: FAIL because `holidays.ts` does not exist.

- [ ] **Step 3: Implement holiday data and month builder**

Write `src/domain/holidays.ts`:

```ts
export type HolidayCountry = "JP" | "KR";

export interface HolidayBadge {
  country: HolidayCountry;
  name: string;
}

export interface CalendarCell {
  date?: string;
  day?: number;
  isWeekend: boolean;
  badges: HolidayBadge[];
}

const jpHolidays: Record<string, string> = {
  "2026-01-01": "元日",
  "2026-01-12": "成人の日",
  "2026-02-11": "建国記念の日",
  "2026-02-23": "天皇誕生日",
  "2026-03-20": "春分の日",
  "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日",
  "2026-05-04": "みどりの日",
  "2026-05-05": "こどもの日",
  "2026-05-06": "振替休日",
  "2026-07-20": "海の日",
  "2026-08-11": "山の日",
  "2026-09-21": "敬老の日",
  "2026-09-22": "国民の休日",
  "2026-09-23": "秋分の日",
  "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日",
  "2026-11-23": "勤労感謝の日"
};

const krHolidays: Record<string, string> = {
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "대체공휴일",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절"
};

export function getHolidayBadges(date: string, showKoreanHolidays: boolean): HolidayBadge[] {
  const badges: HolidayBadge[] = [];
  if (jpHolidays[date]) {
    badges.push({ country: "JP", name: jpHolidays[date] });
  }
  if (showKoreanHolidays && krHolidays[date]) {
    badges.push({ country: "KR", name: krHolidays[date] });
  }
  return badges;
}

function toDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildMonthCells(year: number, monthIndex: number, showKoreanHolidays: boolean): CalendarCell[] {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const cells: CalendarCell[] = [];

  for (let i = 0; i < first.getUTCDay(); i += 1) {
    cells.push({ isWeekend: i === 0 || i === 6, badges: [] });
  }

  for (let day = 1; day <= last.getUTCDate(); day += 1) {
    const date = toDateKey(year, monthIndex, day);
    const weekDay = new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
    cells.push({
      date,
      day,
      isWeekend: weekDay === 0 || weekDay === 6,
      badges: getHolidayBadges(date, showKoreanHolidays),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ isWeekend: false, badges: [] });
  }

  return cells;
}
```

- [ ] **Step 4: Run holiday tests**

Run: `npm test -- src/domain/holidays.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit holiday model**

Run:

```bash
git add src/domain/holidays.ts src/domain/holidays.test.ts
git commit -m "feat: add holiday calendar overlay"
```

Expected: commit succeeds.

## Task 5: Add Browser Store And Codex CLI Store

**Files:**
- Create: `src/storage/taskStore.ts`
- Create: `src/storage/taskStore.test.ts`
- Create: `scripts/task-cli.mjs`

- [ ] **Step 1: Write failing browser store tests**

Write `src/storage/taskStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { addTaskToStore, defaultData, loadStore } from "./taskStore";

describe("taskStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads default data when storage is empty", () => {
    expect(loadStore()).toEqual(defaultData);
  });

  it("adds a validated task to storage", () => {
    const data = addTaskToStore({
      title: "Codex로 추가한 작업",
      date: "2026-05-21",
      time: "15:30",
      source: "codex",
      alarm: { enabled: true, repeat: "weekly" },
    });

    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0].source).toBe("codex");
    expect(loadStore().tasks[0].title).toBe("Codex로 추가한 작업");
  });
});
```

- [ ] **Step 2: Run store tests to confirm failure**

Run: `npm test -- src/storage/taskStore.test.ts`

Expected: FAIL because `taskStore.ts` does not exist.

- [ ] **Step 3: Implement browser store**

Write `src/storage/taskStore.ts`:

```ts
import { createTask, type AppData, type TaskInput } from "../domain/task";

const storageKey = "jini-tasks:data";

export const defaultData: AppData = {
  tasks: [],
  settings: {
    theme: "system",
    showKoreanHolidays: true,
    notificationsEnabled: false,
  },
};

export function loadStore(): AppData {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return defaultData;
  }
  try {
    const parsed = JSON.parse(raw) as AppData;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      settings: { ...defaultData.settings, ...parsed.settings },
    };
  } catch {
    localStorage.setItem(`${storageKey}:corrupt:${Date.now()}`, raw);
    return defaultData;
  }
}

export function saveStore(data: AppData): AppData {
  localStorage.setItem(storageKey, JSON.stringify(data, null, 2));
  return data;
}

export function addTaskToStore(input: TaskInput): AppData {
  const data = loadStore();
  const task = createTask(input);
  return saveStore({ ...data, tasks: [task, ...data.tasks] });
}
```

- [ ] **Step 4: Add CLI task insertion**

Write `scripts/task-cli.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "tasks.json");

const repeatLabels = {
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

function readArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function createTask(args) {
  const title = (args.title ?? "").trim();
  if (!title) throw new Error("--title is required");
  const date = args.date === "today" || !args.date ? todayKey() : args.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("--date must be YYYY-MM-DD or today");
  const time = args.time;
  if (time && !/^\d{2}:\d{2}$/.test(time)) throw new Error("--time must be HH:mm");
  const repeat = repeatLabels[args.repeat ?? "once"];
  if (!repeat) throw new Error("--repeat must be once, daily, weekdays, weekly, monthly, or until-completed");
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title,
    notes: args.notes ?? "",
    status: "active",
    date,
    time,
    priority: args.priority ?? "normal",
    source: "codex",
    createdAt: now,
    updatedAt: now,
    alarm: {
      enabled: Boolean(time),
      time,
      repeat,
      advanceMinutes: args.advance ? Number(args.advance) : undefined,
    },
  };
}

function loadData() {
  if (!fs.existsSync(dataPath)) {
    return { tasks: [], settings: { theme: "system", showKoreanHolidays: true, notificationsEnabled: false } };
  }
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

if (process.argv[2] !== "add") {
  console.error("Usage: npm run task:add -- --title \"작업\" --date today --time 15:30 --repeat weekly");
  process.exit(1);
}

const task = createTask(readArgs(process.argv.slice(3)));
const data = loadData();
data.tasks = [task, ...(Array.isArray(data.tasks) ? data.tasks : [])];
fs.mkdirSync(path.dirname(dataPath), { recursive: true });
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Added task: ${task.title}`);
```

- [ ] **Step 5: Run store tests and CLI smoke test**

Run: `npm test -- src/storage/taskStore.test.ts`

Expected: PASS.

Run: `npm run task:add -- --title "코덱스로 추가한 테스트" --date today --time 15:30 --repeat weekly`

Expected: prints `Added task: 코덱스로 추가한 테스트` and prepends one task to `data/tasks.json`.

- [ ] **Step 6: Commit storage and CLI**

Run:

```bash
git add src/storage/taskStore.ts src/storage/taskStore.test.ts scripts/task-cli.mjs data/tasks.json
git commit -m "feat: add task storage and codex cli"
```

Expected: commit succeeds.

## Task 6: Add Alarm Scheduler

**Files:**
- Create: `src/alarms/alarmScheduler.ts`
- Create: `src/alarms/alarmScheduler.test.ts`

- [ ] **Step 1: Write failing alarm scheduler tests**

Write `src/alarms/alarmScheduler.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Task } from "../domain/task";
import { findDueAlarms } from "./alarmScheduler";

const baseTask: Task = {
  id: "task-1",
  title: "은행 이체 확인",
  notes: "",
  status: "active",
  date: "2026-05-21",
  time: "18:00",
  priority: "normal",
  source: "manual",
  createdAt: "2026-05-21T00:00:00.000Z",
  updatedAt: "2026-05-21T00:00:00.000Z",
  alarm: { enabled: true, time: "18:00", repeat: "until-completed" },
};

describe("findDueAlarms", () => {
  it("finds active due alarms", () => {
    expect(findDueAlarms([baseTask], new Date("2026-05-21T18:00:00.000")).map((task) => task.id)).toEqual(["task-1"]);
  });

  it("ignores completed tasks", () => {
    expect(findDueAlarms([{ ...baseTask, status: "completed" }], new Date("2026-05-21T18:00:00.000"))).toEqual([]);
  });

  it("honors advance reminders", () => {
    const task = { ...baseTask, alarm: { ...baseTask.alarm, advanceMinutes: 30 } };
    expect(findDueAlarms([task], new Date("2026-05-21T17:30:00.000"))).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `npm test -- src/alarms/alarmScheduler.test.ts`

Expected: FAIL because `alarmScheduler.ts` does not exist.

- [ ] **Step 3: Implement due-alarm detection and notification request**

Write `src/alarms/alarmScheduler.ts`:

```ts
import type { Task } from "../domain/task";

function alarmDate(task: Task): Date | undefined {
  if (!task.alarm.enabled || !task.alarm.time) {
    return undefined;
  }
  const [hour, minute] = task.alarm.time.split(":").map(Number);
  const date = new Date(`${task.date}T00:00:00.000`);
  date.setHours(hour, minute, 0, 0);
  if (task.alarm.advanceMinutes) {
    date.setMinutes(date.getMinutes() - task.alarm.advanceMinutes);
  }
  return date;
}

export function findDueAlarms(tasks: Task[], now = new Date()): Task[] {
  const currentMinute = now.getTime();
  return tasks.filter((task) => {
    if (task.status !== "active") return false;
    const due = alarmDate(task);
    if (!due) return false;
    return Math.abs(due.getTime() - currentMinute) < 60_000;
  });
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

export function showTaskNotification(task: Task): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  new Notification(task.title, {
    body: task.time ? `${task.time} 예정된 작업입니다.` : "예정된 작업입니다.",
    tag: task.id,
  });
}
```

- [ ] **Step 4: Run alarm tests**

Run: `npm test -- src/alarms/alarmScheduler.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit alarm scheduler**

Run:

```bash
git add src/alarms/alarmScheduler.ts src/alarms/alarmScheduler.test.ts
git commit -m "feat: add alarm scheduler"
```

Expected: commit succeeds.

## Task 7: Build Responsive UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/components/Layout.tsx`
- Create: `src/components/TodayView.tsx`
- Create: `src/components/CalendarView.tsx`
- Create: `src/components/CompletedView.tsx`
- Create: `src/components/AlarmsView.tsx`
- Create: `src/components/SettingsView.tsx`
- Create: `src/components/TaskForm.tsx`
- Create: `src/components/TaskCard.tsx`

- [ ] **Step 1: Create shared task form**

Write `src/components/TaskForm.tsx`:

```tsx
import { useState } from "react";
import type { RepeatRule, TaskInput } from "../domain/task";

interface Props {
  date: string;
  source: TaskInput["source"];
  onAdd: (input: TaskInput) => void;
}

const repeatOptions: Array<{ value: RepeatRule; label: string }> = [
  { value: "once", label: "1회" },
  { value: "daily", label: "매일" },
  { value: "weekdays", label: "평일" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
  { value: "until-completed", label: "완료까지 반복" },
];

export function TaskForm({ date, source, onAdd }: Props) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [repeat, setRepeat] = useState<RepeatRule>("once");

  return (
    <form
      className="task-form"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd({
          title,
          date,
          time: time || undefined,
          source,
          alarm: { enabled: Boolean(time), time: time || undefined, repeat },
        });
        setTitle("");
      }}
    >
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 주간 회고 초안 정리" />
      <input value={time} onChange={(event) => setTime(event.target.value)} type="time" aria-label="알람 시간" />
      <select value={repeat} onChange={(event) => setRepeat(event.target.value as RepeatRule)} aria-label="반복 알람">
        {repeatOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit">등록</button>
    </form>
  );
}
```

- [ ] **Step 2: Create task cards**

Write `src/components/TaskCard.tsx`:

```tsx
import type { Task } from "../domain/task";

const repeatLabels = {
  once: "1회",
  daily: "매일",
  weekdays: "평일",
  weekly: "매주",
  monthly: "매월",
  "until-completed": "완료까지 반복",
};

export function TaskCard({ task, onComplete }: { task: Task; onComplete?: (id: string) => void }) {
  return (
    <article className={`task-card ${task.status === "completed" ? "is-done" : ""}`}>
      <div>
        <strong>{task.title}</strong>
        <p>
          {task.time ? `${task.time} · ` : ""}
          {task.alarm.enabled ? repeatLabels[task.alarm.repeat] : "알람 없음"}
        </p>
      </div>
      {task.status === "active" && onComplete ? (
        <button type="button" onClick={() => onComplete(task.id)} aria-label={`${task.title} 완료`}>
          완료
        </button>
      ) : null}
    </article>
  );
}
```

- [ ] **Step 3: Create calendar view**

Write `src/components/CalendarView.tsx`:

```tsx
import type { Task, TaskInput } from "../domain/task";
import { buildMonthCells } from "../domain/holidays";
import { TaskForm } from "./TaskForm";

interface Props {
  tasks: Task[];
  showKoreanHolidays: boolean;
  onToggleKoreanHolidays: () => void;
  onAdd: (input: TaskInput) => void;
}

export function CalendarView({ tasks, showKoreanHolidays, onToggleKoreanHolidays, onAdd }: Props) {
  const year = 2026;
  const monthIndex = 4;
  const selectedDate = "2026-05-21";
  const cells = buildMonthCells(year, monthIndex, showKoreanHolidays);

  return (
    <section className="panel">
      <div className="calendar-header">
        <h2>2026년 5월</h2>
        <button type="button" className="soft-pill">일본 공휴일 기본</button>
        <button type="button" className="soft-pill blue" onClick={onToggleKoreanHolidays}>
          대한민국 공휴일 표시 {showKoreanHolidays ? "ON" : "OFF"}
        </button>
        <button type="button">+ 일정</button>
      </div>
      <div className="weekday-row">{["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">
        {cells.map((cell, index) => (
          <div key={`${cell.date ?? "blank"}-${index}`} className={`calendar-cell ${cell.isWeekend ? "weekend" : ""}`}>
            {cell.day ? <strong>{cell.day}</strong> : null}
            {cell.badges.map((badge) => (
              <span key={`${cell.date}-${badge.country}`} className={`holiday-badge ${badge.country.toLowerCase()}`}>
                {badge.country} {badge.name}
              </span>
            ))}
            {tasks.filter((task) => task.date === cell.date).map((task) => (
              <small key={task.id}>{task.title}</small>
            ))}
          </div>
        ))}
      </div>
      <div className="inline-editor">
        <h3>선택한 날짜: 5월 21일 목요일</h3>
        <TaskForm date={selectedDate} source="calendar" onAdd={onAdd} />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create today, completed, alarms, and settings views**

Write `src/components/TodayView.tsx`:

```tsx
import type { Task, TaskInput } from "../domain/task";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

export function TodayView({ tasks, onAdd, onComplete }: { tasks: Task[]; onAdd: (input: TaskInput) => void; onComplete: (id: string) => void }) {
  const today = "2026-05-21";
  const active = tasks.filter((task) => task.date === today && task.status === "active");
  const done = tasks.filter((task) => task.date === today && task.status === "completed");

  return (
    <section className="panel">
      <div className="metrics">
        <div><strong>{active.length}</strong><span>오늘 할 일</span></div>
        <div><strong>{done.length}</strong><span>끝낸 일</span></div>
        <div><strong>{tasks.filter((task) => task.alarm.enabled).length}</strong><span>알람</span></div>
      </div>
      <div className="lanes">
        <div><h2>오늘 해야 할 일</h2>{active.map((task) => <TaskCard key={task.id} task={task} onComplete={onComplete} />)}</div>
        <div><h2>끝낸 일</h2>{done.map((task) => <TaskCard key={task.id} task={task} />)}</div>
      </div>
      <TaskForm date={today} source="manual" onAdd={onAdd} />
    </section>
  );
}
```

Write `src/components/CompletedView.tsx`:

```tsx
import type { Task } from "../domain/task";
import { TaskCard } from "./TaskCard";

export function CompletedView({ tasks }: { tasks: Task[] }) {
  return <section className="panel"><h2>완료</h2>{tasks.filter((task) => task.status === "completed").map((task) => <TaskCard key={task.id} task={task} />)}</section>;
}
```

Write `src/components/AlarmsView.tsx`:

```tsx
import type { Task } from "../domain/task";
import { TaskCard } from "./TaskCard";

export function AlarmsView({ tasks }: { tasks: Task[] }) {
  return <section className="panel"><h2>알람</h2>{tasks.filter((task) => task.alarm.enabled && task.status === "active").map((task) => <TaskCard key={task.id} task={task} />)}</section>;
}
```

Write `src/components/SettingsView.tsx`:

```tsx
import type { AppSettings, ThemePreference } from "../domain/task";

export function SettingsView({ settings, onThemeChange, onRequestNotifications }: { settings: AppSettings; onThemeChange: (theme: ThemePreference) => void; onRequestNotifications: () => void }) {
  return (
    <section className="panel settings-panel">
      <h2>설정</h2>
      <label>
        테마
        <select value={settings.theme} onChange={(event) => onThemeChange(event.target.value as ThemePreference)}>
          <option value="system">시스템</option>
          <option value="light">라이트</option>
          <option value="dark">다크</option>
        </select>
      </label>
      <button type="button" onClick={onRequestNotifications}>알림 권한 요청</button>
      <p>자동실행은 `npm run startup:enable`로 켜고 `npm run startup:disable`로 끕니다.</p>
    </section>
  );
}
```

- [ ] **Step 5: Create layout and app composition**

Write `src/components/Layout.tsx`:

```tsx
import type { ReactNode } from "react";

export type ViewName = "today" | "calendar" | "completed" | "alarms" | "settings";

const navItems: Array<{ id: ViewName; label: string }> = [
  { id: "today", label: "오늘" },
  { id: "calendar", label: "캘린더" },
  { id: "completed", label: "완료" },
  { id: "alarms", label: "알람" },
  { id: "settings", label: "설정" },
];

export function Layout({ view, onViewChange, children }: { view: ViewName; onViewChange: (view: ViewName) => void; children: ReactNode }) {
  return (
    <main className="app-frame">
      <aside className="sidebar">
        <h1>Jini Tasks</h1>
        <nav>
          {navItems.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => onViewChange(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="content">{children}</div>
    </main>
  );
}
```

Replace `src/App.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { requestNotificationPermission } from "./alarms/alarmScheduler";
import { completeTask, type AppData, type TaskInput, type ThemePreference } from "./domain/task";
import { AlarmsView } from "./components/AlarmsView";
import { CalendarView } from "./components/CalendarView";
import { CompletedView } from "./components/CompletedView";
import { Layout, type ViewName } from "./components/Layout";
import { SettingsView } from "./components/SettingsView";
import { TodayView } from "./components/TodayView";
import { addTaskToStore, loadStore, saveStore } from "./storage/taskStore";

export default function App() {
  const [view, setView] = useState<ViewName>("today");
  const [data, setData] = useState<AppData>(() => loadStore());

  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme;
  }, [data.settings.theme]);

  const tasks = useMemo(() => data.tasks, [data.tasks]);

  function refresh(next: AppData) {
    setData(saveStore(next));
  }

  function addTask(input: TaskInput) {
    setData(addTaskToStore(input));
  }

  function markComplete(id: string) {
    refresh({ ...data, tasks: data.tasks.map((task) => (task.id === id ? completeTask(task) : task)) });
  }

  function setTheme(theme: ThemePreference) {
    refresh({ ...data, settings: { ...data.settings, theme } });
  }

  return (
    <Layout view={view} onViewChange={setView}>
      {view === "today" ? <TodayView tasks={tasks} onAdd={addTask} onComplete={markComplete} /> : null}
      {view === "calendar" ? (
        <CalendarView
          tasks={tasks}
          showKoreanHolidays={data.settings.showKoreanHolidays}
          onToggleKoreanHolidays={() => refresh({ ...data, settings: { ...data.settings, showKoreanHolidays: !data.settings.showKoreanHolidays } })}
          onAdd={addTask}
        />
      ) : null}
      {view === "completed" ? <CompletedView tasks={tasks} /> : null}
      {view === "alarms" ? <AlarmsView tasks={tasks} /> : null}
      {view === "settings" ? <SettingsView settings={data.settings} onThemeChange={setTheme} onRequestNotifications={requestNotificationPermission} /> : null}
    </Layout>
  );
}
```

- [ ] **Step 6: Replace CSS with responsive light/dark styling**

Replace `src/styles.css`:

```css
:root {
  color-scheme: light;
  --page: #f4f6f2;
  --panel: #ffffff;
  --panel-muted: #fbfcfb;
  --ink: #17211f;
  --muted: #62706c;
  --line: #d9e1dd;
  --green: #1e7b62;
  --green-soft: #e4f3ec;
  --blue: #245f9f;
  --blue-soft: #e7eef8;
  --rose: #b4425a;
  --rose-soft: #f8e6eb;
  --amber: #b36b19;
  --amber-soft: #f8eddd;
  font-family: "Segoe UI", "Noto Sans KR", Arial, sans-serif;
  background: var(--page);
  color: var(--ink);
}

[data-theme="dark"] {
  color-scheme: dark;
  --page: #101614;
  --panel: #17211e;
  --panel-muted: #1f2a27;
  --ink: #edf5f1;
  --muted: #a7b8b2;
  --line: #35443f;
  --green: #72d2ae;
  --green-soft: #253c35;
  --blue: #8fbfff;
  --blue-soft: #243550;
  --rose: #ff8aa2;
  --rose-soft: #3f2630;
  --amber: #f0b45f;
  --amber-soft: #47331f;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: var(--page);
}

button,
input,
select {
  font: inherit;
}

button {
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--panel);
  color: var(--ink);
  min-height: 36px;
  cursor: pointer;
}

button:hover {
  border-color: var(--green);
}

.app-frame {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  max-width: 1180px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 26px 18px;
  gap: 18px;
}

.sidebar {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 18px;
  align-self: start;
  position: sticky;
  top: 18px;
}

.sidebar h1 {
  margin: 0 0 20px;
  font-size: 22px;
  letter-spacing: 0;
}

.sidebar nav {
  display: grid;
  gap: 8px;
}

.sidebar button {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 9px 12px;
  text-align: left;
  border-color: transparent;
  background: transparent;
}

.sidebar button.active {
  background: var(--green-soft);
  color: var(--green);
  font-weight: 800;
}

.content {
  min-width: 0;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 22px;
}

.panel h2,
.panel h3 {
  margin: 0 0 14px;
  letter-spacing: 0;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.metrics div {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  background: var(--panel-muted);
}

.metrics strong {
  display: block;
  font-size: 30px;
}

.metrics span {
  color: var(--muted);
  font-size: 13px;
}

.lanes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.task-card {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  background: var(--panel-muted);
  overflow-wrap: anywhere;
}

.task-card strong {
  display: block;
  margin-bottom: 5px;
}

.task-card p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.task-card.is-done {
  opacity: 0.7;
}

.task-card.is-done strong {
  text-decoration: line-through;
}

.calendar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.calendar-header h2 {
  margin-right: auto;
}

.soft-pill {
  border-radius: 999px;
  background: var(--green-soft);
  color: var(--green);
  font-weight: 800;
  padding: 0 13px;
}

.soft-pill.blue {
  background: var(--blue-soft);
  color: var(--blue);
}

.weekday-row,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(72px, 1fr));
  gap: 8px;
}

.weekday-row {
  margin-bottom: 8px;
  color: var(--muted);
  font-weight: 800;
}

.weekday-row span {
  padding-left: 10px;
}

.calendar-cell {
  min-height: 92px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
  background: var(--panel-muted);
  overflow: hidden;
  overflow-wrap: anywhere;
}

.calendar-cell.weekend {
  background: var(--blue-soft);
}

.calendar-cell strong {
  display: block;
  margin-bottom: 8px;
}

.calendar-cell small {
  display: block;
  color: var(--green);
  font-weight: 800;
  margin-top: 4px;
}

.holiday-badge {
  display: block;
  width: fit-content;
  max-width: 100%;
  border-radius: 999px;
  padding: 2px 6px;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 800;
  white-space: normal;
}

.holiday-badge.jp {
  background: var(--rose-soft);
  color: var(--rose);
}

.holiday-badge.kr {
  background: var(--blue-soft);
  color: var(--blue);
}

.inline-editor {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel-muted);
  padding: 14px;
  margin-top: 18px;
}

.task-form {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 110px 150px 96px;
  gap: 10px;
}

.task-form input,
.task-form select {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 9px 10px;
  background: var(--panel);
  color: var(--ink);
}

.task-form button,
.calendar-header > button:last-child {
  border: 0;
  background: var(--green);
  color: var(--page);
  font-weight: 800;
}

.settings-panel {
  display: grid;
  gap: 14px;
  max-width: 560px;
}

.settings-panel label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-weight: 800;
}

@media (max-width: 820px) {
  .app-frame {
    grid-template-columns: 1fr;
    padding: 14px;
  }

  .sidebar {
    position: static;
  }

  .sidebar nav {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .sidebar button {
    justify-content: center;
    padding: 8px 4px;
  }

  .metrics,
  .lanes {
    grid-template-columns: 1fr;
  }

  .weekday-row,
  .calendar-grid {
    grid-template-columns: repeat(7, minmax(40px, 1fr));
    gap: 5px;
  }

  .calendar-cell {
    min-height: 78px;
    padding: 7px;
  }

  .holiday-badge {
    font-size: 10px;
  }

  .task-form {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Build and inspect UI**

Run: `npm run build`

Expected: PASS.

Run: `npm run dev`

Expected: dev server starts and prints a localhost URL.

Open the URL and manually verify:

- Sidebar has no `Codex 추가`.
- Holiday controls appear only in the calendar header.
- The right-side mobile notification mock is not part of the app.
- Task form has title, time, repeat, and submit controls.
- Dark mode setting changes the page theme.

- [ ] **Step 8: Commit UI**

Run:

```bash
git add src/App.tsx src/components src/styles.css
git commit -m "feat: build jini tasks ui"
```

Expected: commit succeeds.

## Task 8: Add PWA And Windows Startup Scripts

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Modify: `src/main.tsx`
- Create: `scripts/enable-startup.ps1`
- Create: `scripts/disable-startup.ps1`

- [ ] **Step 1: Add manifest and service worker**

Write `public/manifest.webmanifest`:

```json
{
  "name": "Jini Tasks",
  "short_name": "Jini Tasks",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f4f6f2",
  "theme_color": "#1e7b62",
  "icons": []
}
```

Write `public/sw.js`:

```js
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("jini-tasks-v1").then((cache) => cache.addAll(["/"])));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
```

- [ ] **Step 2: Register service worker**

Update `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
```

- [ ] **Step 3: Add startup scripts**

Write `scripts/enable-startup.ps1`:

```powershell
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$startup = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startup "Jini Tasks.lnk"
$target = "cmd.exe"
$arguments = "/c cd /d `"$projectRoot`" && npm run dev"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $target
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = $projectRoot
$shortcut.WindowStyle = 7
$shortcut.Save()
Write-Output "Created startup shortcut: $shortcutPath"
```

Write `scripts/disable-startup.ps1`:

```powershell
$ErrorActionPreference = "Stop"
$startup = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startup "Jini Tasks.lnk"
if (Test-Path $shortcutPath) {
  Remove-Item -LiteralPath $shortcutPath
  Write-Output "Removed startup shortcut: $shortcutPath"
} else {
  Write-Output "Startup shortcut was not present: $shortcutPath"
}
```

- [ ] **Step 4: Verify PWA and scripts**

Run: `npm run build`

Expected: PASS.

Run: `powershell -ExecutionPolicy Bypass -File scripts/enable-startup.ps1`

Expected: prints `Created startup shortcut: ...Jini Tasks.lnk`.

Run: `powershell -ExecutionPolicy Bypass -File scripts/disable-startup.ps1`

Expected: prints `Removed startup shortcut: ...Jini Tasks.lnk`.

- [ ] **Step 5: Commit PWA/startup**

Run:

```bash
git add public src/main.tsx scripts/enable-startup.ps1 scripts/disable-startup.ps1 package.json
git commit -m "feat: add pwa and startup support"
```

Expected: commit succeeds.

## Task 9: Final Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-05-21-jini-tasks-design.md` only if implementation reveals a spec correction.

- [ ] **Step 1: Run full tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: build passes and `dist/` is created.

- [ ] **Step 3: Smoke test CLI insertion**

Run:

```bash
npm run task:add -- --title "구현 완료 후 점검" --date today --time 18:00 --repeat "완료할 때까지 반복"
```

Expected: `data/tasks.json` contains a new task with `"source": "codex"` and `"repeat": "until-completed"`.

- [ ] **Step 4: Browser verification**

Run: `npm run dev`

Expected: dev server starts.

Manual checks:

- Today view shows active and completed columns.
- Calendar view shows Japanese holidays by default.
- Korea overlay button toggles Korean holiday badges.
- No duplicated holiday controls exist in the sidebar.
- No `Codex 추가` UI exists.
- Task form can save time and repeat alarm.
- Settings can switch light/dark/system.
- Mobile viewport does not overlap text.

- [ ] **Step 5: Commit final fixes**

Run:

```bash
git status --short
git add .
git commit -m "test: verify jini tasks implementation"
```

Expected: commit succeeds if verification required final changes. If no files changed, do not create an empty commit.
