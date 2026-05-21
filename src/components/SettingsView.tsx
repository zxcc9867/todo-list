import { Bell } from "lucide-react";
import type { AppSettings, ThemePreference } from "../domain/task";

const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "시스템" },
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
];

interface SettingsViewProps {
  settings: AppSettings;
  onThemeChange: (theme: ThemePreference) => void;
  onRequestNotifications: () => void;
}

export function SettingsView({ settings, onThemeChange, onRequestNotifications }: SettingsViewProps) {
  return (
    <section className="panel settings-panel">
      <div className="view-header">
        <div>
          <p className="eyebrow">테마</p>
          <h2>설정</h2>
        </div>
      </div>

      <fieldset className="segmented-control">
        <legend>테마</legend>
        {themeOptions.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={settings.theme === option.value}
              onChange={() => onThemeChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      <button type="button" className="primary-action" onClick={onRequestNotifications}>
        <Bell size={17} />
        <span>알림 권한 요청</span>
      </button>

      <p className="startup-note">
        자동실행은 <code>npm run startup:enable</code>로 켜고 <code>npm run startup:disable</code>로 끕니다.
      </p>
    </section>
  );
}
