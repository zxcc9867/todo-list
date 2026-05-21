import { describe, expect, it } from "vitest";
import { createTask, normalizeRepeatRule } from "./task";

const fixedNow = new Date("2026-05-21T06:30:00.000Z");
const fixedOptions = {
  now: fixedNow,
  generateId: () => "task-fixed-id",
};

describe("createTask", () => {
  it("creates a valid task with alarm settings", () => {
    const task = createTask(
      {
        title: "\uc8fc\uac04 \ud68c\uace0 \ucd08\uc548 \uc815\ub9ac",
        date: "2026-05-21",
        time: "15:30",
        source: "manual",
        alarm: {
          enabled: true,
          time: "15:30",
          repeat: "weekly",
          advanceMinutes: 30,
        },
      },
      fixedOptions,
    );

    expect(task.id).toBe("task-fixed-id");
    expect(task.title).toBe("\uc8fc\uac04 \ud68c\uace0 \ucd08\uc548 \uc815\ub9ac");
    expect(task.createdAt).toBe("2026-05-21T06:30:00.000Z");
    expect(task.updatedAt).toBe("2026-05-21T06:30:00.000Z");
    expect(task.alarm.enabled).toBe(true);
    expect(task.alarm.repeat).toBe("weekly");
    expect(task.status).toBe("active");
  });

  it("rejects an empty title", () => {
    expect(() =>
      createTask(
        {
          title: "   ",
          date: "2026-05-21",
          source: "manual",
        },
        fixedOptions,
      ),
    ).toThrow("Task title is required");
  });

  it("rejects invalid real dates", () => {
    for (const date of ["2026-02-31", "2026-99-99"]) {
      expect(() =>
        createTask(
          {
            title: "Invalid date",
            date,
            source: "manual",
          },
          fixedOptions,
        ),
      ).toThrow("Task date must be a valid YYYY-MM-DD date");
    }
  });

  it("rejects invalid task times", () => {
    for (const time of ["24:00", "12:60", "99:99"]) {
      expect(() =>
        createTask(
          {
            title: "Invalid time",
            date: "2026-05-21",
            time,
            source: "manual",
          },
          fixedOptions,
        ),
      ).toThrow("Task time must use HH:mm");
    }
  });

  it("rejects invalid alarm times even when disabled", () => {
    expect(() =>
      createTask(
        {
          title: "Invalid alarm time",
          date: "2026-05-21",
          source: "manual",
          alarm: {
            enabled: false,
            time: "99:99",
          },
        },
        fixedOptions,
      ),
    ).toThrow("Alarm time must use HH:mm");
  });

  it("rejects enabled alarms without a task or alarm time", () => {
    expect(() =>
      createTask(
        {
          title: "Missing alarm time",
          date: "2026-05-21",
          source: "manual",
          alarm: {
            enabled: true,
          },
        },
        fixedOptions,
      ),
    ).toThrow("Alarm time is required when alarm is enabled");
  });

  it("rejects invalid repeat rules", () => {
    expect(() =>
      createTask(
        {
          title: "Invalid repeat",
          date: "2026-05-21",
          source: "manual",
          alarm: {
            enabled: false,
            repeat: "yearly",
          },
        },
        fixedOptions,
      ),
    ).toThrow("Invalid repeat rule: yearly");
  });

  it("rejects invalid advance minutes", () => {
    for (const advanceMinutes of [-1, 1.5, Number.POSITIVE_INFINITY]) {
      expect(() =>
        createTask(
          {
            title: "Invalid advance",
            date: "2026-05-21",
            source: "manual",
            alarm: {
              enabled: false,
              advanceMinutes,
            },
          },
          fixedOptions,
        ),
      ).toThrow("Alarm advance minutes must be a non-negative integer");
    }
  });

  it("normalizes Korean repeat labels", () => {
    expect(normalizeRepeatRule("\uc644\ub8cc\ud560 \ub54c\uae4c\uc9c0 \ubc18\ubcf5")).toBe(
      "until-completed",
    );
    expect(normalizeRepeatRule("\ub9e4\uc8fc")).toBe("weekly");
  });
});
