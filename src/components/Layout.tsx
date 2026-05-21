import { AlarmClock, CalendarDays, CheckCircle2, ListTodo, Settings } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export type ViewName = "today" | "calendar" | "completed" | "alarms" | "settings";

const labels = {
  today: "\uc624\ub298",
  calendar: "\uce98\ub9b0\ub354",
  completed: "\uc644\ub8cc",
  alarms: "\uc54c\ub78c",
  settings: "\uc124\uc815",
  mainMenu: "\uc8fc\uc694 \uba54\ub274",
};

const navItems: Array<{ id: ViewName; label: string; Icon: ComponentType<{ size?: number }> }> = [
  { id: "today", label: labels.today, Icon: ListTodo },
  { id: "calendar", label: labels.calendar, Icon: CalendarDays },
  { id: "completed", label: labels.completed, Icon: CheckCircle2 },
  { id: "alarms", label: labels.alarms, Icon: AlarmClock },
  { id: "settings", label: labels.settings, Icon: Settings },
];

interface LayoutProps {
  view: ViewName;
  onViewChange: (view: ViewName) => void;
  children: ReactNode;
}

export function Layout({ view, onViewChange, children }: LayoutProps) {
  return (
    <main className="app-frame">
      <aside className="sidebar" aria-label={labels.mainMenu}>
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
