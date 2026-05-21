import { afterEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../domain/task";
import { findDueAlarms, requestNotificationPermission, showTaskNotification } from "./alarmScheduler";

const baseTask: Task = {
  id: "task-1",
  title: "Bank transfer check",
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

const originalNotificationDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Notification");
const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");

function removeNotification(): void {
  Object.defineProperty(globalThis, "Notification", {
    configurable: true,
    value: undefined,
    writable: true,
  });
}

function stubNotification(notification: unknown): void {
  Object.defineProperty(globalThis, "Notification", {
    configurable: true,
    value: notification,
    writable: true,
  });
}

function stubServiceWorker(serviceWorker: unknown): void {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: serviceWorker,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  if (originalNotificationDescriptor) {
    Object.defineProperty(globalThis, "Notification", originalNotificationDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "Notification");
  }
  if (originalServiceWorkerDescriptor) {
    Object.defineProperty(navigator, "serviceWorker", originalServiceWorkerDescriptor);
  } else {
    Reflect.deleteProperty(navigator, "serviceWorker");
  }
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

  it("does not return alarms already fired for the same occurrence", () => {
    const task = {
      ...baseTask,
      alarm: {
        ...baseTask.alarm,
        lastFiredAt: "2026-05-21T18:00:00.000Z",
      },
    };

    expect(findDueAlarms([task], new Date("2026-05-21T18:00:30.000Z"))).toEqual([]);
  });

  it("returns daily repeats due after yesterday's last fire", () => {
    const task = {
      ...baseTask,
      date: "2026-05-20",
      alarm: {
        ...baseTask.alarm,
        repeat: "daily" as const,
        lastFiredAt: "2026-05-20T18:00:00.000Z",
      },
    };

    expect(findDueAlarms([task], new Date("2026-05-21T18:00:00.000Z")).map((item) => item.id)).toEqual(["task-1"]);
  });

  it("uses daily cadence for until-completed repeats", () => {
    const task = {
      ...baseTask,
      date: "2026-05-20",
      alarm: {
        ...baseTask.alarm,
        repeat: "until-completed" as const,
        lastFiredAt: "2026-05-20T18:00:00.000Z",
      },
    };

    expect(findDueAlarms([task], new Date("2026-05-21T18:00:00.000Z"))).toHaveLength(1);
  });

  it("honors monthly anchor days when finding the next occurrence", () => {
    const task = {
      ...baseTask,
      date: "2026-01-31",
      time: "09:00",
      alarm: {
        ...baseTask.alarm,
        time: "09:00",
        repeat: "monthly" as const,
        monthlyAnchorDay: 31,
        lastFiredAt: "2026-02-28T09:00:00.000Z",
      },
    };

    expect(findDueAlarms([task], new Date("2026-03-31T09:00:00.000Z"))).toHaveLength(1);
  });

  it("does not return old one-time alarms outside the one-minute window", () => {
    const task = {
      ...baseTask,
      alarm: {
        ...baseTask.alarm,
        repeat: "once" as const,
      },
    };

    expect(findDueAlarms([task], new Date("2026-05-21T18:01:00.000"))).toEqual([]);
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
  it("does nothing when Notification is unavailable", async () => {
    removeNotification();

    await expect(showTaskNotification(baseTask)).resolves.toBeUndefined();
  });

  it("does nothing when permission is not granted", async () => {
    const NotificationMock = vi.fn();
    Reflect.set(NotificationMock, "permission", "denied");
    stubNotification(NotificationMock);

    await showTaskNotification(baseTask);

    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it("uses service worker notification when available", async () => {
    const NotificationMock = vi.fn();
    const showNotification = vi.fn().mockResolvedValue(undefined);
    Reflect.set(NotificationMock, "permission", "granted");
    stubNotification(NotificationMock);
    stubServiceWorker({
      ready: Promise.resolve({ showNotification }),
    });

    await showTaskNotification(baseTask);

    expect(showNotification).toHaveBeenCalledWith(
      baseTask.title,
      expect.objectContaining({
        body: expect.stringContaining("18:00"),
        tag: "task-1",
      }),
    );
    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it("falls back to constructing a notification when service worker is unavailable", async () => {
    const NotificationMock = vi.fn();
    Reflect.set(NotificationMock, "permission", "granted");
    stubNotification(NotificationMock);

    await showTaskNotification(baseTask);

    expect(NotificationMock).toHaveBeenCalledWith(
      baseTask.title,
      expect.objectContaining({
        body: expect.stringContaining("18:00"),
        tag: "task-1",
      }),
    );
  });

  it("catches constructor errors", async () => {
    const NotificationMock = vi.fn(() => {
      throw new Error("blocked");
    });
    Reflect.set(NotificationMock, "permission", "granted");
    stubNotification(NotificationMock);

    await expect(showTaskNotification(baseTask)).resolves.toBeUndefined();
  });
});
