import { Check } from "lucide-react";
import type { RepeatRule, Task } from "../domain/task";

const labels = {
  noAlarm: "\uc54c\ub78c \uc5c6\uc74c",
  complete: "\uc644\ub8cc",
};

const repeatLabels: Record<RepeatRule, string> = {
  once: "\u0031\ud68c",
  daily: "\ub9e4\uc77c",
  weekdays: "\ud3c9\uc77c",
  weekly: "\ub9e4\uc8fc",
  monthly: "\ub9e4\uc6d4",
  "until-completed": "\uc644\ub8cc\uae4c\uc9c0 \ubc18\ubcf5",
};

interface TaskCardProps {
  task: Task;
  onComplete?: (id: string) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const alarmLabel = task.alarm.enabled ? repeatLabels[task.alarm.repeat] : labels.noAlarm;
  const detailLabel = task.time ? `${task.time} · ${alarmLabel}` : alarmLabel;

  return (
    <article className={`task-card ${task.status === "completed" ? "is-done" : ""}`}>
      <div className="task-copy">
        <strong>{task.title}</strong>
        <p>{detailLabel}</p>
      </div>
      {task.status === "active" && onComplete ? (
        <button
          type="button"
          className="icon-action"
          onClick={() => onComplete(task.id)}
          aria-label={`${task.title} ${labels.complete}`}
          title={labels.complete}
        >
          <Check size={17} />
          <span className="sr-only">{labels.complete}</span>
        </button>
      ) : null}
    </article>
  );
}
