import { useState } from "react";
import type { RepeatRule, TaskInput, TaskSource } from "../domain/task";

const labels = {
  title: "\uc624\ub298 \ud560 \uc77c",
  alarmTime: "\uc54c\ub78c \uc2dc\uac04",
  repeatAlarm: "\ubc18\ubcf5 \uc54c\ub78c",
  placeholder: "\uc608: \uc8fc\uac04 \ud68c\uace0 \ucd08\uc548 \uc815\ub9ac",
  submit: "\ub4f1\ub85d",
};

const repeatOptions: Array<{ value: RepeatRule; label: string }> = [
  { value: "once", label: "\u0031\ud68c" },
  { value: "daily", label: "\ub9e4\uc77c" },
  { value: "weekdays", label: "\ud3c9\uc77c" },
  { value: "weekly", label: "\ub9e4\uc8fc" },
  { value: "monthly", label: "\ub9e4\uc6d4" },
  { value: "until-completed", label: "\uc644\ub8cc\uae4c\uc9c0 \ubc18\ubcf5" },
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
        <span>{labels.title}</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={labels.placeholder}
          aria-label={labels.title}
        />
      </label>
      <label>
        <span>{labels.alarmTime}</span>
        <input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          aria-label={labels.alarmTime}
        />
      </label>
      <label>
        <span>{labels.repeatAlarm}</span>
        <select
          value={repeat}
          onChange={(event) => setRepeat(event.target.value as RepeatRule)}
          aria-label={labels.repeatAlarm}
        >
          {repeatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">{labels.submit}</button>
    </form>
  );
}
