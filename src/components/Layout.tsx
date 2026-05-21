import { AlarmClock, CalendarDays, CheckCircle2, ListTodo, Settings } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export type ViewName = "today" | "calendar" | "completed" | "alarms" | "settings";

const navItems: Array<{ id: ViewName; label: string; Icon: ComponentType<{ size?: number }> }> = [
  { id: "today", label: "오늘", Icon: ListTodo },
  { id: "calendar", label: "캘린더", Icon: CalendarDays },
  { id: "completed", label: "완료", Icon: CheckCircle2 },
  { id: "alarms", label: "알람", Icon: AlarmClock },
  { id: "settings", label: "설정", Icon: Settings },
];

interface LayoutProps {
  view: ViewName;
  onViewChange: (view: ViewName) => void;
  children: ReactNode;
}

export function Layout({ view, onViewChange, children }: LayoutProps) {
  return (
    <main className="app-frame">
      <aside className="sidebar" aria-label="주요 메뉴">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            J
          </span>
          <h1>Jini Tasks</h1>
        </div>
        <nav className="side-nav">
          {navItems.map(({ id, label, Icon }) => (
            <button
              type="button"
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => onViewChange(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}
