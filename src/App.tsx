import { useEffect, useMemo, useState } from "react";
import { requestNotificationPermission } from "./alarms/alarmScheduler";
import { AlarmsView } from "./components/AlarmsView";
import { CalendarView } from "./components/CalendarView";
import { CompletedView } from "./components/CompletedView";
import { Layout, type ViewName } from "./components/Layout";
import { SettingsView } from "./components/SettingsView";
import { TodayView } from "./components/TodayView";
import { completeTask, type AppData, type TaskInput, type ThemePreference } from "./domain/task";
import { addTaskToStore, loadStore, saveStore } from "./storage/taskStore";

function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [view, setView] = useState<ViewName>("today");
  const [data, setData] = useState<AppData>(() => loadStore());

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.dataset.theme = resolveTheme(data.settings.theme);
    };

    applyTheme();

    if (data.settings.theme !== "system") {
      return undefined;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [data.settings.theme]);

  const tasks = useMemo(() => data.tasks, [data.tasks]);

  function refresh(next: AppData) {
    setData(saveStore(next));
  }

  function addTask(input: TaskInput) {
    setData(addTaskToStore(input));
  }

  function markComplete(id: string) {
    refresh({
      ...data,
      tasks: data.tasks.map((task) => (task.id === id ? completeTask(task) : task)),
    });
  }

  function setTheme(theme: ThemePreference) {
    refresh({ ...data, settings: { ...data.settings, theme } });
  }

  function toggleKoreanHolidays() {
    refresh({
      ...data,
      settings: {
        ...data.settings,
        showKoreanHolidays: !data.settings.showKoreanHolidays,
      },
    });
  }

  function handleRequestNotifications() {
    void requestNotificationPermission().then((permission) => {
      refresh({
        ...data,
        settings: {
          ...data.settings,
          notificationsEnabled: permission === "granted",
        },
      });
    });
  }

  return (
    <Layout view={view} onViewChange={setView}>
      {view === "today" ? (
        <TodayView tasks={tasks} onAdd={addTask} onComplete={markComplete} />
      ) : null}
      {view === "calendar" ? (
        <CalendarView
          tasks={tasks}
          showKoreanHolidays={data.settings.showKoreanHolidays}
          onToggleKoreanHolidays={toggleKoreanHolidays}
          onAdd={addTask}
          onComplete={markComplete}
        />
      ) : null}
      {view === "completed" ? <CompletedView tasks={tasks} /> : null}
      {view === "alarms" ? <AlarmsView tasks={tasks} onComplete={markComplete} /> : null}
      {view === "settings" ? (
        <SettingsView
          settings={data.settings}
          onThemeChange={setTheme}
          onRequestNotifications={handleRequestNotifications}
        />
      ) : null}
    </Layout>
  );
}
