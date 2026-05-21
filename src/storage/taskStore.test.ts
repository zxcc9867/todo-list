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
