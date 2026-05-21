import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { AppData } from "../domain/task";
import { addTaskToStore, defaultData, loadStore, mergeAppData } from "./taskStore";

const storageKey = "jini-tasks:data";

const fixedCreateOptions = {
  now: new Date("2026-05-21T06:30:00.000Z"),
  generateId: () => "task-fixed-id",
};

function validStoredTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "valid-task",
    title: "Valid task",
    notes: "",
    status: "active",
    date: "2026-05-21",
    time: "15:30",
    priority: "normal",
    source: "manual",
    createdAt: "2026-05-21T06:30:00.000Z",
    updatedAt: "2026-05-21T06:30:00.000Z",
    alarm: {
      enabled: true,
      time: "15:30",
      repeat: "weekly",
    },
    ...overrides,
  };
}

describe("taskStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads default data when storage is empty", () => {
    expect(loadStore()).toEqual(defaultData);
    expect(loadStore().settings.showKoreanHolidays).toBe(false);
  });

  it("adds a validated task to storage", () => {
    const data = addTaskToStore(
      {
        title: "Codex\ub85c \ucd94\uac00\ud55c \uc791\uc5c5",
        date: "2026-05-21",
        time: "15:30",
        source: "codex",
        alarm: { enabled: true, repeat: "weekly" },
      },
      fixedCreateOptions,
    );

    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0].id).toBe("task-fixed-id");
    expect(data.tasks[0].source).toBe("codex");
    expect(loadStore().tasks[0].title).toBe("Codex\ub85c \ucd94\uac00\ud55c \uc791\uc5c5");
  });

  it("backs up corrupt primary storage and replaces it with defaults", () => {
    localStorage.setItem(storageKey, "{not-json");

    expect(loadStore()).toEqual(defaultData);

    const backupKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith("jini-tasks:data:corrupt:"),
    );
    expect(backupKeys).toHaveLength(1);
    expect(localStorage.getItem(backupKeys[0])).toBe("{not-json");
    expect(localStorage.getItem(storageKey)).toBe(JSON.stringify(defaultData));
  });

  it("normalizes invalid store shape over defaults", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        tasks: "not-an-array",
        settings: {
          theme: "dark",
          showKoreanHolidays: "yes",
        },
      }),
    );

    expect(loadStore()).toEqual({
      tasks: [],
      settings: {
        ...defaultData.settings,
        theme: "dark",
      },
    });
  });

  it("drops invalid tasks while keeping plausible tasks", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        tasks: [
          validStoredTask(),
          {
            id: "invalid-task",
            title: "Invalid task",
            date: "2026-05-21",
            status: "deleted",
            source: "manual",
            alarm: {
              enabled: true,
              repeat: "weekly",
            },
          },
        ],
      }),
    );

    const data = loadStore();

    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0].id).toBe("valid-task");
  });

  it.each([
    ["missing priority", { priority: undefined }],
    ["missing createdAt", { createdAt: undefined }],
    ["missing updatedAt", { updatedAt: undefined }],
    ["invalid alarm time", { alarm: { enabled: true, time: "99:99", repeat: "weekly" } }],
    ["invalid advance minutes", { alarm: { enabled: true, repeat: "weekly", advanceMinutes: -1 } }],
    ["invalid monthly anchor", { alarm: { enabled: true, repeat: "monthly", monthlyAnchorDay: 32 } }],
  ])("drops stored tasks with %s", (_name, overrides) => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        tasks: [validStoredTask(overrides)],
      }),
    );

    expect(loadStore().tasks).toEqual([]);
  });

  it("persists monthly alarm anchor days", () => {
    const data = addTaskToStore(
      {
        title: "Monthly billing",
        date: "2026-01-31",
        time: "09:00",
        source: "codex",
        alarm: { enabled: true, repeat: "monthly" },
      },
      fixedCreateOptions,
    );

    expect(data.tasks[0].alarm.monthlyAnchorDay).toBe(31);
    expect(loadStore().tasks[0].alarm.monthlyAnchorDay).toBe(31);
  });

  it("merges CLI-only tasks and newer duplicates without replacing local settings", () => {
    const localTask = validStoredTask({
      id: "shared-task",
      title: "Local title",
      updatedAt: "2026-05-21T08:00:00.000Z",
    }) as AppData["tasks"][number];
    const olderServerDuplicate = validStoredTask({
      id: "shared-task",
      title: "Server title",
      updatedAt: "2026-05-21T07:00:00.000Z",
    }) as AppData["tasks"][number];
    const cliOnlyTask = validStoredTask({
      id: "cli-task",
      title: "CLI task",
      source: "codex",
      updatedAt: "2026-05-21T09:00:00.000Z",
    }) as AppData["tasks"][number];

    const merged = mergeAppData(
      {
        tasks: [localTask],
        settings: {
          theme: "dark",
          showKoreanHolidays: true,
          notificationsEnabled: true,
        },
      },
      {
        tasks: [olderServerDuplicate, cliOnlyTask],
        settings: {
          theme: "light",
          showKoreanHolidays: false,
          notificationsEnabled: false,
        },
      },
    );

    expect(merged.settings).toEqual({
      theme: "dark",
      showKoreanHolidays: true,
      notificationsEnabled: true,
    });
    expect(merged.tasks.map((task) => task.id)).toEqual(["cli-task", "shared-task"]);
    expect(merged.tasks.find((task) => task.id === "shared-task")?.title).toBe("Local title");
  });
});

describe("task CLI domain integration", () => {
  it("uses domain validation for invalid real dates", async () => {
    // @ts-expect-error CLI is an ESM script outside the TypeScript source tree.
    const { createTaskFromCliArgs } = await import("../../scripts/task-cli.mjs");

    expect(() =>
      createTaskFromCliArgs(
        {
          title: "bad",
          date: "2026-02-31",
        },
        fixedCreateOptions,
      ),
    ).toThrow("Task date must be a valid YYYY-MM-DD date");
  });

  it("uses domain validation for invalid priorities", async () => {
    // @ts-expect-error CLI is an ESM script outside the TypeScript source tree.
    const { createTaskFromCliArgs } = await import("../../scripts/task-cli.mjs");

    expect(() =>
      createTaskFromCliArgs(
        {
          title: "bad priority",
          date: "2026-05-21",
          priority: "urgent",
        },
        fixedCreateOptions,
      ),
    ).toThrow("Invalid task priority");
  });

  it("uses domain monthly anchor calculation", async () => {
    // @ts-expect-error CLI is an ESM script outside the TypeScript source tree.
    const { createTaskFromCliArgs } = await import("../../scripts/task-cli.mjs");

    const task = createTaskFromCliArgs(
      {
        title: "Monthly billing",
        date: "2026-01-31",
        time: "09:00",
        repeat: "monthly",
      },
      fixedCreateOptions,
    );

    expect(task.alarm.monthlyAnchorDay).toBe(31);
  });

  it("loadData drops invalid tasks and normalizes invalid settings", async () => {
    // @ts-expect-error CLI is an ESM script outside the TypeScript source tree.
    const { loadData } = await import("../../scripts/task-cli.mjs");
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "jini-tasks-"));
    const tempPath = path.join(tempDir, "tasks.json");
    await writeFile(
      tempPath,
      JSON.stringify({
        tasks: [validStoredTask(), validStoredTask({ id: "missing-priority", priority: undefined })],
        settings: {
          theme: "dark",
          showKoreanHolidays: "yes",
          notificationsEnabled: "no",
        },
      }),
      "utf8",
    );

    expect(await loadData(tempPath)).toEqual({
      tasks: [validStoredTask()],
      settings: {
        ...defaultData.settings,
        theme: "dark",
      },
    });
  });

  it("loadData handles parsed non-object JSON as defaults", async () => {
    // @ts-expect-error CLI is an ESM script outside the TypeScript source tree.
    const { loadData } = await import("../../scripts/task-cli.mjs");
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "jini-tasks-"));
    const tempPath = path.join(tempDir, "tasks.json");
    await writeFile(tempPath, "null", "utf8");

    expect(await loadData(tempPath)).toEqual(defaultData);
  });
});
