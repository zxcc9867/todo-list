import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CalendarView } from "./CalendarView";

describe("CalendarView", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("navigates months and adds calendar tasks on the selected month date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T09:00:00.000"));
    const onAdd = vi.fn();

    render(
      <CalendarView
        tasks={[]}
        showKoreanHolidays={false}
        onToggleKoreanHolidays={vi.fn()}
        onAdd={onAdd}
        onComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));
    fireEvent.change(screen.getByLabelText("오늘 할 일"), {
      target: { value: "June task" },
    });
    fireEvent.click(screen.getByRole("button", { name: "등록" }));

    expect(screen.getByRole("heading", { name: "2026년 6월" })).toBeTruthy();
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "June task",
        date: "2026-06-21",
        source: "calendar",
      }),
    );
  });
});
