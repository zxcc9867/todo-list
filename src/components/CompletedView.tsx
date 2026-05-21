import type { Task } from "../domain/task";
import { TaskCard } from "./TaskCard";

const labels = {
  completedHistory: "\uc644\ub8cc \uae30\ub85d",
  completed: "\uc644\ub8cc",
  empty: "\ub05d\ub0b8 \uc77c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
};

export function CompletedView({ tasks }: { tasks: Task[] }) {
  const completed = tasks.filter((task) => task.status === "completed");

  return (
    <section className="panel">
      <div className="view-header">
        <div>
          <p className="eyebrow">{labels.completedHistory}</p>
          <h2>{labels.completed}</h2>
        </div>
      </div>
      {completed.length > 0 ? (
        <div className="task-list">
          {completed.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <p className="empty-state">{labels.empty}</p>
      )}
    </section>
  );
}
