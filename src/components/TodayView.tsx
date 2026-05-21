import type { Task, TaskInput } from "../domain/task";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

const today = "2026-05-21";

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
          <p className="eyebrow">선택한 날짜: 5월 21일 목요일</p>
          <h2>오늘 할 일</h2>
        </div>
      </div>

      <div className="metrics" aria-label="오늘 요약">
        <div>
          <strong>{active.length}</strong>
          <span>오늘 해야 할 일</span>
        </div>
        <div>
          <strong>{done.length}</strong>
          <span>끝낸 일</span>
        </div>
        <div>
          <strong>{alarms.length}</strong>
          <span>알람</span>
        </div>
      </div>

      <div className="lanes">
        <section className="lane" aria-labelledby="active-tasks">
          <h3 id="active-tasks">오늘 해야 할 일</h3>
          {active.length > 0 ? (
            active.map((task) => <TaskCard key={task.id} task={task} onComplete={onComplete} />)
          ) : (
            <p className="empty-state">등록된 할 일이 없습니다.</p>
          )}
        </section>
        <section className="lane" aria-labelledby="completed-tasks">
          <h3 id="completed-tasks">끝낸 일</h3>
          {done.length > 0 ? (
            done.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <p className="empty-state">아직 완료한 일이 없습니다.</p>
          )}
        </section>
      </div>

      <TaskForm date={today} source="manual" onAdd={onAdd} />
    </section>
  );
}
