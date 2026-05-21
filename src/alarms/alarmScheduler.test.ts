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
