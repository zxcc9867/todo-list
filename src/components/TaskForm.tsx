import { useState } from "react";
import type { RepeatRule, TaskInput, TaskSource } from "../domain/task";

const repeatOptions: Array<{ value: RepeatRule; label: string }> = [
  { value: "once", label: "1회" },
  { value: "daily", label: "매일" },
  { value: "weekdays", label: "평일" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
  { value: "until-completed", label: "완료까지 반복" },
];

interface TaskFormProps {
  date: string;
  source: TaskSource;
  onAdd: (input: TaskInput) => void;
}

export function TaskForm({ date, source, onAdd }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [repeat, setRepeat] = useState<RepeatRule>("once");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }

    onAdd({
      title: nextTitle,
      date,
      time,
      priority: "normal",
      source,
      alarm: {
        enabled: Boolean(time),
        time,
        repeat,
      },
    });
    setTitle("");
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label>
        <span>오늘 할 일</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="예: 주간 회고 초안 정리"
          aria-label="오늘 할 일"
        />
      </label>
      <label>
        <span>알람 시간</span>
        <input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          aria-label="알람 시간"
        />
      </label>
      <label>
        <span>반복 알람</span>
        <select
          value={repeat}
          onChange={(event) => setRepeat(event.target.value as RepeatRule)}
          aria-label="반복 알람"
        >
          {repeatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">등록</button>
    </form>
  );
}
