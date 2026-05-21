import { describe, expect, it } from "vitest";
import type { AppData, Task } from "../domain/task";
import { defaultData, mergePostedAppData } from "./appData";

function validStoredTask(overrides: Partial<Task> = {}): Task {
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

describe("mergePostedAppData", () => {
  it("preserves server-only tasks when a stale browser snapshot is posted", () => {
    const serverOnlyTask = validStoredTask({
      id: "cli-task",
      title: "CLI-only task",
      source: "codex",
      updatedAt: "2026-05-21T09:00:00.000Z",
    });
    const browserTask = validStoredTask({
      id: "browser-task",
      title: "Browser task",
      updatedAt: "2026-05-21T10:00:00.000Z",
    });
    const existingServerData: AppData = {
      tasks: [serverOnlyTask],
      settings: defaultData.settings,
    };
    const staleBrowserPost: AppData = {
      tasks: [browserTask],
      settings: {
        theme: "dark",
        showKoreanHolidays: true,
        notificationsEnabled: true,
      },
    };

    const merged = mergePostedAppData(existingServerData, staleBrowserPost);

    expect(merged.settings).toEqual(staleBrowserPost.settings);
    expect(merged.tasks.map((task) => task.id)).toEqual(["browser-task", "cli-task"]);
  });
});
