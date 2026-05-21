import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskForm } from "./TaskForm";

describe("TaskForm", () => {
  it("omits time and disables the alarm when the time field is empty", () => {
    const onAdd = vi.fn();
    render(<TaskForm date="2026-05-21" source="manual" onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("\uc624\ub298 \ud560 \uc77c"), {
      target: { value: "No alarm task" },
    });
    fireEvent.change(screen.getByLabelText("\uc54c\ub78c \uc2dc\uac04"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "\ub4f1\ub85d" }));

    expect(onAdd).toHaveBeenCalledWith({
      title: "No alarm task",
      date: "2026-05-21",
      priority: "normal",
      source: "manual",
      alarm: {
        enabled: false,
        repeat: "once",
      },
    });
  });
});
