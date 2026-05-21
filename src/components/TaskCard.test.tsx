import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "../domain/task";
import { TaskCard } from "./TaskCard";

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "회의 자료 정리",
    notes: "",
    status: "active",
    date: "2026-05-21",
    time: "09:00",
    priority: "normal",
    source: "manual",
    createdAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
    alarm: {
      enabled: true,
      time: "09:00",
      repeat: "once",
    },
    ...overrides,
  };
}

describe("TaskCard", () => {
  it("renders an active task as a checklist item and completes it when checked", () => {
    const onComplete = vi.fn();
    render(<TaskCard task={createTask()} onComplete={onComplete} />);

    const checkbox = screen.getByRole("checkbox", { name: "회의 자료 정리 완료" }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);

    expect(onComplete).toHaveBeenCalledWith("task-1");
  });

  it("renders completed tasks as checked checklist items without a completion action", () => {
    render(<TaskCard task={createTask({ status: "completed" })} />);

    expect((screen.getByRole("checkbox", { name: "회의 자료 정리 완료됨" }) as HTMLInputElement).checked).toBe(true);
  });
});
