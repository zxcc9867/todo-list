import type { Task } from "../domain/task";
import { TaskCard } from "./TaskCard";

const labels = {
  repeatAlarm: "\ubc18\ubcf5 \uc54c\ub78c",
  alarms: "\uc54c\ub78c",
  empty: "\ud65c\uc131\ud654\ub41c \uc54c\ub78c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
};

interface AlarmsViewProps {
  tasks: Task[];
  onComplete: (id: string) => void;
}

export function AlarmsView({ tasks, onComplete }: AlarmsViewProps) {
  const alarms = tasks.filter((task) => task.status === "active" && task.alarm.enabled);

  return (
    <section className="panel">
      <div className="view-header">
        <div>
          <p className="eyebrow">{labels.repeatAlarm}</p>
          <h2>{labels.alarms}</h2>
        </div>
      </div>
      {alarms.length > 0 ? (
        <div className="task-list">
          {alarms.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={onComplete} />
          ))}
        </div>
      ) : (
        <p className="empty-state">{labels.empty}</p>
      )}
    </section>
  );
}
