import { useEffect, useMemo, useState } from "react";
import { requestNotificationPermission } from "./alarms/alarmScheduler";
import { AlarmsView } from "./components/AlarmsView";
import { CalendarView } from "./components/CalendarView";
import { CompletedView } from "./components/CompletedView";
import { Layout, type ViewName } from "./components/Layout";
import { SettingsView } from "./components/SettingsView";
import { TodayView } from "./components/TodayView";
import { completeTask, createTask, type AppData, type TaskInput, type ThemePreference } from "./domain/task";
import { loadStore, saveStore } from "./storage/taskStore";

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

  function updateData(updater: (current: AppData) => AppData) {
    setData((current) => saveStore(updater(current)));
  }

  function addTask(input: TaskInput) {
    const task = createTask(input);
    updateData((current) => ({
      ...current,
      tasks: [task, ...current.tasks],
    }));
  }

  function markComplete(id: string) {
    const completedAt = new Date();
    updateData((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? completeTask(task, completedAt) : task)),
    }));
  }

  function setTheme(theme: ThemePreference) {
    updateData((current) => ({ ...current, settings: { ...current.settings, theme } }));
  }

  function toggleKoreanHolidays() {
    updateData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        showKoreanHolidays: !current.settings.showKoreanHolidays,
      },
    }));
  }

  function handleRequestNotifications() {
    void requestNotificationPermission().then((permission) => {
      updateData((current) => ({
        ...current,
        settings: {
          ...current.settings,
          notificationsEnabled: permission === "granted",
        },
      }));
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
