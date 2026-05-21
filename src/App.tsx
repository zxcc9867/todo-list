import { useEffect, useMemo, useRef, useState } from "react";
import {
  findDueAlarms,
  markAlarmsFired,
  requestNotificationPermission,
  showTaskNotification,
} from "./alarms/alarmScheduler";
import { AlarmsView } from "./components/AlarmsView";
import { CalendarView } from "./components/CalendarView";
import { CompletedView } from "./components/CompletedView";
import { Layout, type ViewName } from "./components/Layout";
import { SettingsView } from "./components/SettingsView";
import { TodayView } from "./components/TodayView";
import { completeTask, createTask, type AppData, type TaskInput, type ThemePreference } from "./domain/task";
import { loadServerStore, loadStore, mergeAppData, saveStoreAndSync } from "./storage/taskStore";

function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function isSameData(left: AppData, right: AppData): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export default function App() {
  const [view, setView] = useState<ViewName>("today");
  const [data, setData] = useState<AppData>(() => loadStore());
  const firingAlarmIds = useRef(new Set<string>());

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

  useEffect(() => {
    let isMounted = true;

    async function importServerData() {
      const serverData = await loadServerStore();
      if (!serverData || !isMounted) {
        return;
      }

      setData((current) => {
        const mergedData = mergeAppData(current, serverData);
        if (isSameData(current, mergedData)) {
          return current;
        }
        return saveStoreAndSync(mergedData);
      });
    }

    void importServerData();
    const intervalId = window.setInterval(() => {
      void importServerData();
    }, 5_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!data.settings.notificationsEnabled) {
      return undefined;
    }

    function checkAlarms() {
      const now = new Date();
      const dueTasks = findDueAlarms(data.tasks, now).filter((task) => !firingAlarmIds.current.has(task.id));
      if (dueTasks.length === 0) {
        return;
      }

      const dueIds = new Set(dueTasks.map((task) => task.id));
      for (const task of dueTasks) {
        firingAlarmIds.current.add(task.id);
        void showTaskNotification(task);
      }

      setData((current) => {
        if (!current.settings.notificationsEnabled) {
          return current;
        }

        const currentDueTasks = findDueAlarms(current.tasks, now).filter((task) => dueIds.has(task.id));
        if (currentDueTasks.length === 0) {
          return current;
        }

        return saveStoreAndSync({
          ...current,
          tasks: markAlarmsFired(current.tasks, currentDueTasks, now),
        });
      });

      window.setTimeout(() => {
        for (const task of dueTasks) {
          firingAlarmIds.current.delete(task.id);
        }
      }, 60_000);
    }

    checkAlarms();
    const intervalId = window.setInterval(checkAlarms, 20_000);
    return () => window.clearInterval(intervalId);
  }, [data.settings.notificationsEnabled, data.tasks]);

  const tasks = useMemo(() => data.tasks, [data.tasks]);

  function updateData(updater: (current: AppData) => AppData) {
    setData((current) => saveStoreAndSync(updater(current)));
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
