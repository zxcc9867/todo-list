import { Plus } from "lucide-react";
import { buildMonthCells } from "../domain/holidays";
import type { Task, TaskInput } from "../domain/task";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

const selectedDate = "2026-05-21";
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

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
  const cells = buildMonthCells(2026, 4, showKoreanHolidays);
  const selectedTasks = tasks.filter((task) => task.date === selectedDate && task.status === "active");

  return (
    <section className="panel">
      <div className="calendar-header">
        <div>
          <p className="eyebrow">선택한 날짜: 5월 21일 목요일</p>
          <h2>2026년 5월</h2>
        </div>
        <span className="soft-pill">일본 공휴일 기본</span>
        <button type="button" className="soft-pill blue" onClick={onToggleKoreanHolidays}>
          대한민국 공휴일 표시 {showKoreanHolidays ? "ON" : "OFF"}
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
          return (
            <div
              key={`${cell.date ?? "blank"}-${index}`}
              className={`calendar-cell ${cell.isWeekend ? "weekend" : ""} ${
                cell.date === selectedDate ? "selected" : ""
              }`}
            >
              {cell.day ? <strong>{cell.day}</strong> : null}
              {cell.badges.map((badge) => (
                <span key={`${cell.date}-${badge.country}`} className={`holiday-badge ${badge.country.toLowerCase()}`}>
                  {badge.country} {badge.name}
                </span>
              ))}
              {dayTasks.slice(0, 2).map((task) => (
                <small key={task.id}>{task.title}</small>
              ))}
            </div>
          );
        })}
      </div>

      <div className="inline-editor">
        <div className="inline-header">
          <h3>선택한 날짜: 5월 21일 목요일</h3>
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
