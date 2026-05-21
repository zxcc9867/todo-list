import type { Task, TaskInput } from "../domain/task";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

const today = "2026-05-21";
const labels = {
  selectedDate: "\uc120\ud0dd\ud55c \ub0a0\uc9dc: 5\uc6d4 21\uc77c \ubaa9\uc694\uc77c",
  todayTasks: "\uc624\ub298 \ud560 \uc77c",
  todaySummary: "\uc624\ub298 \uc694\uc57d",
  activeTasks: "\uc624\ub298 \ud574\uc57c \ud560 \uc77c",
  completedTasks: "\ub05d\ub0b8 \uc77c",
  alarms: "\uc54c\ub78c",
  noActiveTasks: "\ub4f1\ub85d\ub41c \ud560 \uc77c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
  noCompletedTasks: "\uc544\uc9c1 \uc644\ub8cc\ud55c \uc77c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
};

interface TodayViewProps {
  tasks: Task[];
  onAdd: (input: TaskInput) => void;
  onComplete: (id: string) => void;
}

export function TodayView({ tasks, onAdd, onComplete }: TodayViewProps) {
  const active = tasks.filter((task) => task.date === today && task.status === "active");
  const done = tasks.filter((task) => task.date === today && task.status === "completed");
  const alarms = tasks.filter((task) => task.status === "active" && task.alarm.enabled);

  return (
    <section className="panel">
      <div className="view-header">
        <div>
          <p className="eyebrow">{labels.selectedDate}</p>
          <h2>{labels.todayTasks}</h2>
        </div>
      </div>

      <div className="metrics" aria-label={labels.todaySummary}>
        <div>
          <strong>{active.length}</strong>
          <span>{labels.activeTasks}</span>
        </div>
        <div>
          <strong>{done.length}</strong>
          <span>{labels.completedTasks}</span>
        </div>
        <div>
          <strong>{alarms.length}</strong>
          <span>{labels.alarms}</span>
        </div>
      </div>

      <div className="lanes">
        <section className="lane" aria-labelledby="active-tasks">
          <h3 id="active-tasks">{labels.activeTasks}</h3>
          {active.length > 0 ? (
            active.map((task) => <TaskCard key={task.id} task={task} onComplete={onComplete} />)
          ) : (
            <p className="empty-state">{labels.noActiveTasks}</p>
          )}
        </section>
        <section className="lane" aria-labelledby="completed-tasks">
          <h3 id="completed-tasks">{labels.completedTasks}</h3>
          {done.length > 0 ? (
            done.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <p className="empty-state">{labels.noCompletedTasks}</p>
          )}
        </section>
      </div>

      <TaskForm date={today} source="manual" onAdd={onAdd} />
    </section>
  );
}
