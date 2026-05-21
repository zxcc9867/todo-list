import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { buildMonthCells } from "../domain/holidays";
import type { Task, TaskInput } from "../domain/task";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

const calendarYear = 2026;
const labels = {
  selectedDatePrefix: "\uc120\ud0dd\ud55c \ub0a0\uc9dc:",
  japanHolidayBase: "\uc77c\ubcf8 \uacf5\ud734\uc77c \uae30\ubcf8",
  koreaHolidayToggle: "\ub300\ud55c\ubbfc\uad6d \uacf5\ud734\uc77c \ud45c\uc2dc",
  previousMonth: "\uc774\uc804 \ub2ec",
  nextMonth: "\ub2e4\uc74c \ub2ec",
};
const weekdays = ["\uc77c", "\uc6d4", "\ud654", "\uc218", "\ubaa9", "\uae08", "\ud1a0"];
const weekdayNames = [
  "\uc77c\uc694\uc77c",
  "\uc6d4\uc694\uc77c",
  "\ud654\uc694\uc77c",
  "\uc218\uc694\uc77c",
  "\ubaa9\uc694\uc77c",
  "\uae08\uc694\uc77c",
  "\ud1a0\uc694\uc77c",
];

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function dateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateKey(date: string): { monthIndex: number; day: number } {
  return {
    monthIndex: Number(date.slice(5, 7)) - 1,
    day: Number(date.slice(8, 10)),
  };
}

function initialSelectedDate(): string {
  const now = new Date();
  const monthIndex = Math.min(11, Math.max(0, now.getMonth()));
  const day = Math.min(now.getDate(), daysInMonth(calendarYear, monthIndex));
  return dateKey(calendarYear, monthIndex, day);
}

function formatMonthLabel(monthIndex: number): string {
  return `${calendarYear}\ub144 ${monthIndex + 1}\uc6d4`;
}

function formatSelectedDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  const month = parsed.getMonth() + 1;
  const day = parsed.getDate();
  return `${labels.selectedDatePrefix} ${month}\uc6d4 ${day}\uc77c ${weekdayNames[parsed.getDay()]}`;
}

interface CalendarViewProps {
  tasks: Task[];
  showKoreanHolidays: boolean;
  onToggleKoreanHolidays: () => void;
  onAdd: (input: TaskInput) => void;
  onComplete: (id: string) => void;
}

export function CalendarView({
  tasks,
  showKoreanHolidays,
  onToggleKoreanHolidays,
  onAdd,
  onComplete,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [monthIndex, setMonthIndex] = useState(() => parseDateKey(initialSelectedDate()).monthIndex);
  const cells = buildMonthCells(calendarYear, monthIndex, showKoreanHolidays);
  const selectedTasks = tasks.filter((task) => task.date === selectedDate && task.status === "active");
  const selectedDateLabel = formatSelectedDate(selectedDate);
  const isFirstMonth = monthIndex === 0;
  const isLastMonth = monthIndex === 11;

  function changeMonth(delta: number) {
    const nextMonthIndex = Math.min(11, Math.max(0, monthIndex + delta));
    if (nextMonthIndex === monthIndex) {
      return;
    }

    setMonthIndex(nextMonthIndex);
    setSelectedDate((currentDate) => {
      const { day } = parseDateKey(currentDate);
      return dateKey(calendarYear, nextMonthIndex, Math.min(day, daysInMonth(calendarYear, nextMonthIndex)));
    });
  }

  return (
    <section className="panel">
      <div className="calendar-header">
        <div>
          <p className="eyebrow">{selectedDateLabel}</p>
          <h2>{formatMonthLabel(monthIndex)}</h2>
        </div>
        <div className="month-controls" aria-label="Calendar month controls">
          <button
            type="button"
            className="icon-action"
            onClick={() => changeMonth(-1)}
            disabled={isFirstMonth}
            aria-label={labels.previousMonth}
            title={labels.previousMonth}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-action"
            onClick={() => changeMonth(1)}
            disabled={isLastMonth}
            aria-label={labels.nextMonth}
            title={labels.nextMonth}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
        <span className="soft-pill">{labels.japanHolidayBase}</span>
        <button type="button" className="soft-pill blue" onClick={onToggleKoreanHolidays}>
          {labels.koreaHolidayToggle} {showKoreanHolidays ? "ON" : "OFF"}
        </button>
      </div>

      <div className="weekday-row" aria-hidden="true">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell, index) => {
          const dayTasks = tasks.filter((task) => task.date === cell.date && task.status === "active");
          const isSelected = cell.date === selectedDate;
          const cellContent = (
            <>
              {cell.day ? <strong>{cell.day}</strong> : null}
              {cell.badges.map((badge) => (
                <span key={`${cell.date}-${badge.country}`} className={`holiday-badge ${badge.country.toLowerCase()}`}>
                  {badge.country} {badge.name}
                </span>
              ))}
              {dayTasks.slice(0, 2).map((task) => (
                <small key={task.id}>{task.title}</small>
              ))}
            </>
          );

          if (!cell.date) {
            return (
              <div
                key={`blank-${index}`}
                className={`calendar-cell blank ${cell.isWeekend ? "weekend" : ""}`}
                aria-hidden="true"
              >
                {cellContent}
              </div>
            );
          }

          return (
            <button
              type="button"
              key={`${cell.date}-${index}`}
              className={`calendar-cell ${cell.isWeekend ? "weekend" : ""} ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedDate(cell.date!)}
              aria-pressed={isSelected}
              aria-label={formatSelectedDate(cell.date)}
            >
              {cellContent}
            </button>
          );
        })}
      </div>

      <div className="inline-editor">
        <div className="inline-header">
          <h3>{selectedDateLabel}</h3>
          <Plus size={18} aria-hidden="true" />
        </div>
        <TaskForm date={selectedDate} source="calendar" onAdd={onAdd} />
        <div className="inline-tasks">
          {selectedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={onComplete} />
          ))}
        </div>
      </div>
    </section>
  );
}
