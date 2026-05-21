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

  it("suppresses Korean-only holidays when overlay is disabled", () => {
    const badges = getHolidayBadges("2026-05-25", false);
    expect(badges).toEqual([]);
  });

  it("includes updated 2026 Korean public holidays when overlay is enabled", () => {
    expect(getHolidayBadges("2026-05-01", true)).toEqual([{ country: "KR", name: "노동절" }]);
    expect(getHolidayBadges("2026-06-03", true)).toEqual([{ country: "KR", name: "지방선거일" }]);
    expect(getHolidayBadges("2026-07-17", true)).toEqual([{ country: "KR", name: "제헌절" }]);
  });

  it("includes expected Japanese holiday dates", () => {
    expect(getHolidayBadges("2026-05-06", false)).toEqual([{ country: "JP", name: "振替休日" }]);
    expect(getHolidayBadges("2026-09-22", false)).toEqual([{ country: "JP", name: "国民の休日" }]);
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

  it("marks trailing Saturday blank cells as weekends", () => {
    const cells = buildMonthCells(2026, 4, true);
    expect(cells[41]).toEqual({ isWeekend: true, badges: [] });
  });

  it("rejects invalid month indexes", () => {
    for (const monthIndex of [-1, 12, 4.5]) {
      expect(() => buildMonthCells(2026, monthIndex, true)).toThrow("Invalid month index");
    }
  });
});
