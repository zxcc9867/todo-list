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
