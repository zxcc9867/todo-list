import type { Task, TaskInput } from "../domain/task";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

const labels = {
  selectedDatePrefix: "\uc120\ud0dd\ud55c \ub0a0\uc9dc:",
  todayTasks: "\uc624\ub298 \ud560 \uc77c",
  todaySummary: "\uc624\ub298 \uc694\uc57d",
  activeTasks: "\uc624\ub298 \ud574\uc57c \ud560 \uc77c",
  completedTasks: "\ub05d\ub0b8 \uc77c",
  alarms: "\uc54c\ub78c",
  noActiveTasks: "\ub4f1\ub85d\ub41c \ud560 \uc77c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
  noCompletedTasks: "\uc544\uc9c1 \uc644\ub8cc\ud55c \uc77c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
};
const weekdayNames = [
  "\uc77c\uc694\uc77c",
  "\uc6d4\uc694\uc77c",
  "\ud654\uc694\uc77c",
  "\uc218\uc694\uc77c",
  "\ubaa9\uc694\uc77c",
  "\uae08\uc694\uc77c",
  "\ud1a0\uc694\uc77c",
];

function toLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSelectedDate(date: Date): string {
  return `${labels.selectedDatePrefix} ${date.getMonth() + 1}\uc6d4 ${date.getDate()}\uc77c ${
    weekdayNames[date.getDay()]
  }`;
}

interface TodayViewProps {
  tasks: Task[];
  onAdd: (input: TaskInput) => void;
  onComplete: (id: string) => void;
}

export function TodayView({ tasks, onAdd, onComplete }: TodayViewProps) {
  const now = new Date();
  const today = toLocalDateKey(now);
  const todayLabel = formatSelectedDate(now);
  const active = tasks.filter((task) => task.date === today && task.status === "active");
  const done = tasks.filter((task) => task.date === today && task.status === "completed");
  const alarms = tasks.filter((task) => task.status === "active" && task.alarm.enabled);

  return (
    <section className="panel">
      <div className="view-header">
        <div>
          <p className="eyebrow">{todayLabel}</p>
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
