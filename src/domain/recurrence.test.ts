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
