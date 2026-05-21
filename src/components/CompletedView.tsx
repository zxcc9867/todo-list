import type { Task } from "../domain/task";
import { TaskCard } from "./TaskCard";

export function CompletedView({ tasks }: { tasks: Task[] }) {
  const completed = tasks.filter((task) => task.status === "completed");

  return (
    <section className="panel">
      <div className="view-header">
        <div>
          <p className="eyebrow">완료 기록</p>
          <h2>완료</h2>
        </div>
      </div>
      {completed.length > 0 ? (
        <div className="task-list">
          {completed.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <p className="empty-state">끝낸 일이 없습니다.</p>
      )}
    </section>
  );
}
