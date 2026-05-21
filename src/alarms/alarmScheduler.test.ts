import { afterEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../domain/task";
import { findDueAlarms, requestNotificationPermission, showTaskNotification } from "./alarmScheduler";

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

function removeNotification(): void {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, "Notification");
}

function stubNotification(notification: unknown): void {
  vi.stubGlobal("Notification", notification);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

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

  it("does not return alarms before they are due", () => {
    expect(findDueAlarms([baseTask], new Date("2026-05-21T17:59:30.000"))).toEqual([]);
  });
});

describe("requestNotificationPermission", () => {
  it("returns denied when Notification is unavailable", async () => {
    removeNotification();

    await expect(requestNotificationPermission()).resolves.toBe("denied");
  });

  it("requests permission when permission is default", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    stubNotification({ permission: "default", requestPermission });

    await expect(requestNotificationPermission()).resolves.toBe("granted");
    expect(requestPermission).toHaveBeenCalledOnce();
  });

  it("returns granted without requesting when permission is already granted", async () => {
    const requestPermission = vi.fn().mockResolvedValue("denied");
    stubNotification({ permission: "granted", requestPermission });

    await expect(requestNotificationPermission()).resolves.toBe("granted");
    expect(requestPermission).not.toHaveBeenCalled();
  });
});

describe("showTaskNotification", () => {
  it("does nothing when Notification is unavailable", () => {
    removeNotification();

    expect(() => showTaskNotification(baseTask)).not.toThrow();
  });

  it("does nothing when permission is not granted", () => {
    const NotificationMock = vi.fn();
    Reflect.set(NotificationMock, "permission", "denied");
    stubNotification(NotificationMock);

    showTaskNotification(baseTask);

    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it("constructs a notification with task details when permission is granted", () => {
    const NotificationMock = vi.fn();
    Reflect.set(NotificationMock, "permission", "granted");
    stubNotification(NotificationMock);

    showTaskNotification(baseTask);

    expect(NotificationMock).toHaveBeenCalledWith(
      baseTask.title,
      expect.objectContaining({
        body: expect.stringContaining("18:00"),
        tag: "task-1",
      }),
    );
  });
});
