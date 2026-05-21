import { Check } from "lucide-react";
import type { RepeatRule, Task } from "../domain/task";

const repeatLabels: Record<RepeatRule, string> = {
  once: "1회",
  daily: "매일",
  weekdays: "평일",
  weekly: "매주",
  monthly: "매월",
  "until-completed": "완료까지 반복",
};

interface TaskCardProps {
  task: Task;
  onComplete?: (id: string) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const alarmLabel = task.alarm.enabled ? repeatLabels[task.alarm.repeat] : "알람 없음";
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
          aria-label={`${task.title} 완료`}
          title="완료"
        >
          <Check size={17} />
          <span className="sr-only">완료</span>
        </button>
      ) : null}
    </article>
  );
}
