import type { RepeatRule, Task } from "../domain/task";

const labels = {
  noAlarm: "\uc54c\ub78c \uc5c6\uc74c",
  complete: "\uc644\ub8cc",
  completed: "\uc644\ub8cc\ub428",
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
  const detailLabel = task.time ? `${task.time} / ${alarmLabel}` : alarmLabel;
  const isCompleted = task.status === "completed";
  const checkboxLabel = `${task.title} ${isCompleted ? labels.completed : labels.complete}`;

  return (
    <article className={`task-card ${isCompleted ? "is-done" : ""}`}>
      <label className="task-check">
        <input
          type="checkbox"
          checked={isCompleted}
          disabled={isCompleted || !onComplete}
          aria-label={checkboxLabel}
          onChange={(event) => {
            if (event.currentTarget.checked && onComplete) {
              onComplete(task.id);
            }
          }}
        />
        <span aria-hidden="true" />
      </label>
      <div className="task-copy">
        <strong>{task.title}</strong>
        <p>{detailLabel}</p>
      </div>
    </article>
  );
}
