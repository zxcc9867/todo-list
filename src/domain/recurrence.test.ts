import { describe, expect, it } from "vitest";
import { combineDateAndTime, nextAlarmDate } from "./recurrence";
import { createTask } from "./task";

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

  it("clamps January 31 monthly alarms to February 28 in non-leap years", () => {
    expect(nextAlarmDate("2026-01-31T09:00:00.000Z", "monthly")).toBe("2026-02-28T09:00:00.000Z");
  });

  it("clamps January 30 monthly alarms to February 28 in non-leap years", () => {
    expect(nextAlarmDate("2026-01-30T09:00:00.000Z", "monthly")).toBe("2026-02-28T09:00:00.000Z");
  });

  it("clamps January 31 monthly alarms to February 29 in leap years", () => {
    expect(nextAlarmDate("2024-01-31T09:00:00.000Z", "monthly")).toBe("2024-02-29T09:00:00.000Z");
  });

  it("clamps March 31 monthly alarms to April 30", () => {
    expect(nextAlarmDate("2026-03-31T09:00:00.000Z", "monthly")).toBe("2026-04-30T09:00:00.000Z");
  });

  it("uses anchor day to recover from a clamped February 31 recurrence", () => {
    const feb = nextAlarmDate("2026-01-31T09:00:00.000Z", "monthly", { anchorDay: 31 });

    expect(feb).toBe("2026-02-28T09:00:00.000Z");
    expect(nextAlarmDate(feb!, "monthly", { anchorDay: 31 })).toBe("2026-03-31T09:00:00.000Z");
  });

  it("uses anchor day to recover from a clamped February 30 recurrence", () => {
    const feb = nextAlarmDate("2026-01-30T09:00:00.000Z", "monthly", { anchorDay: 30 });

    expect(feb).toBe("2026-02-28T09:00:00.000Z");
    expect(nextAlarmDate(feb!, "monthly", { anchorDay: 30 })).toBe("2026-03-30T09:00:00.000Z");
  });

  it("treats until-completed as daily cadence", () => {
    expect(nextAlarmDate("2026-05-21T18:00:00.000Z", "until-completed")).toBe("2026-05-22T18:00:00.000Z");
  });

  it("throws for invalid daily alarm input", () => {
    expect(() => nextAlarmDate("not-a-date", "daily")).toThrow("Invalid alarm date");
  });

  it("throws for invalid once alarm input", () => {
    expect(() => nextAlarmDate("not-a-date", "once")).toThrow("Invalid alarm date");
  });

  it("skips Saturday inputs for weekdays", () => {
    expect(nextAlarmDate("2026-05-23T09:00:00.000Z", "weekdays")).toBe("2026-05-25T09:00:00.000Z");
  });

  it("skips Sunday inputs for weekdays", () => {
    expect(nextAlarmDate("2026-05-24T09:00:00.000Z", "weekdays")).toBe("2026-05-25T09:00:00.000Z");
  });

  it("preserves parsed instant cadence for timezone offsets", () => {
    expect(nextAlarmDate("2026-05-21T09:00:00.000+09:00", "daily")).toBe("2026-05-22T00:00:00.000Z");
  });

  it("rejects invalid monthly anchor days", () => {
    for (const anchorDay of [0, 32, Number.NaN]) {
      expect(() =>
        nextAlarmDate("2026-01-31T09:00:00.000Z", "monthly", { anchorDay }),
      ).toThrow("Monthly anchor day must be an integer from 1 to 31");
    }
  });

  it("recovers monthly recurrence using a persisted task anchor day", () => {
    const task = createTask(
      {
        title: "Monthly billing",
        date: "2026-01-31",
        source: "manual",
        alarm: {
          enabled: true,
          time: "09:00",
          repeat: "monthly",
        },
      },
      {
        now: new Date("2026-01-01T00:00:00.000Z"),
        generateId: () => "monthly-task",
      },
    );
    const jan = combineDateAndTime(task.date, task.alarm.time);
    const feb = nextAlarmDate(jan, task.alarm.repeat, { anchorDay: task.alarm.monthlyAnchorDay });

    expect(feb).toBe("2026-02-28T00:00:00.000Z");
    expect(nextAlarmDate(feb!, task.alarm.repeat, { anchorDay: task.alarm.monthlyAnchorDay })).toBe(
      "2026-03-31T00:00:00.000Z",
    );
  });
});

describe("combineDateAndTime", () => {
  it("returns a canonical UTC ISO instant from local wall-clock input", () => {
    const expected = new Date("2026-05-21T09:30:00").toISOString();

    expect(combineDateAndTime("2026-05-21", "09:30")).toBe(expected);
  });

  it("round-trips combined local time through daily recurrence", () => {
    const alarm = combineDateAndTime("2026-05-21", "09:00");
    const expected = new Date("2026-05-22T09:00:00").toISOString();

    expect(nextAlarmDate(alarm, "daily")).toBe(expected);
  });

  it("throws for invalid calendar dates", () => {
    expect(() => combineDateAndTime("2026-02-31", "09:00")).toThrow("Invalid alarm date");
  });

  it("throws for invalid alarm times", () => {
    expect(() => combineDateAndTime("2026-05-21", "24:00")).toThrow("Invalid alarm time");
  });
});
