import type { Task } from "../domain/task";
import { TaskCard } from "./TaskCard";

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
          <p className="eyebrow">반복 알람</p>
          <h2>알람</h2>
        </div>
      </div>
      {alarms.length > 0 ? (
        <div className="task-list">
          {alarms.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={onComplete} />
          ))}
        </div>
      ) : (
        <p className="empty-state">활성화된 알람이 없습니다.</p>
      )}
    </section>
  );
}
