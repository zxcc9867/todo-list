import { Bell } from "lucide-react";
import type { AppSettings, ThemePreference } from "../domain/task";

const labels = {
  settings: "\uc124\uc815",
  theme: "\ud14c\ub9c8",
  system: "\uc2dc\uc2a4\ud15c",
  light: "\ub77c\uc774\ud2b8",
  dark: "\ub2e4\ud06c",
  requestNotifications: "\uc54c\ub9bc \uad8c\ud55c \uc694\uccad",
  startupPrefix: "\uc790\ub3d9\uc2e4\ud589\uc740 ",
  startupMiddle: "\ub85c \ucf1c\uace0 ",
  startupSuffix: "\ub85c \ub044\ub2c8\ub2e4.",
};

const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: labels.system },
  { value: "light", label: labels.light },
  { value: "dark", label: labels.dark },
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
          <p className="eyebrow">{labels.theme}</p>
          <h2>{labels.settings}</h2>
        </div>
      </div>

      <fieldset className="segmented-control">
        <legend>{labels.theme}</legend>
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
        <span>{labels.requestNotifications}</span>
      </button>

      <p className="startup-note">
        {labels.startupPrefix}
        <code>npm run startup:enable</code>
        {labels.startupMiddle}
        <code>npm run startup:disable</code>
        {labels.startupSuffix}
      </p>
    </section>
  );
}
