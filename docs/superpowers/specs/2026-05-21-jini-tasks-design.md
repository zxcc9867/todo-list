# Jini Tasks Design

Date: 2026-05-21
Status: Draft for review

## Goal

Build a task application in `todo-list` that makes today's work, completed work, calendar dates, holidays, and alarms easy to understand on desktop and phone-sized screens. The app should support direct task insertion by Codex through a local data interface, without requiring a visible "Codex add" button in the UI.

## Recommended Approach

Use a responsive local-first web app with installable PWA behavior.

Other considered approaches:

- Calendar-first app: strong for date navigation, but slower for checking today's priorities.
- Notification-first app: strong for alarm handling, but weak for planning and completed-work review.
- Recommended hybrid: keep the today workboard as the primary screen, add a full calendar tab, and keep alarm controls attached to each task.

The hybrid approach best matches the requested workflow: today and done states are obvious, calendar entry is still first-class, and alarm settings stay near the task they affect.

## Product Structure

The primary navigation contains:

- Today: today's tasks, progress, overdue risk, and completed-today list.
- Calendar: monthly calendar, Japanese holidays by default, Korean holiday overlay toggle, and inline schedule creation.
- Completed: searchable completed task history.
- Alarms: tasks with active or repeating alarms.
- Settings: theme, holiday overlay defaults, notification permission, startup behavior, and data location.

The UI does not include a "Codex add" navigation item or button. Codex integration happens through the app's local data layer or CLI helper.

## Calendar Behavior

The calendar uses Japan as the base holiday locale.

Calendar rules:

- Japanese public holidays and weekends are shown by default.
- A calendar header button toggles Korean public holidays as an overlay.
- Korean holidays are displayed as secondary badges on the same date cells.
- If Japan and Korea have a holiday on the same date, the cell shows a merged `JP+KR` state.
- Holiday data is read-only calendar metadata; user-created tasks and schedules are editable.
- Clicking a date or pressing `+ Schedule` opens the inline schedule form for that date.

The initial implementation can ship with bundled holiday data for the current and next year, then expand to an updateable holiday provider later.

## Task And Alarm Model

Each task contains:

- Title
- Notes
- Status: active, completed, archived
- Date
- Optional time
- Priority
- Source: manual, calendar, codex
- Created and updated timestamps
- Completed timestamp
- Alarm settings

Alarm settings contain:

- Enabled flag
- Alarm time
- Repeat rule: once, daily, weekdays, weekly, monthly, until-completed
- Optional advance reminder in minutes
- Last fired timestamp
- Snooze timestamp

The default repeat options are:

- Once
- Daily
- Weekdays
- Weekly
- Monthly
- Repeat until completed

The UI lets the user set task time and repeat rule during task creation and from each task's detail panel.

## Notifications

Desktop notifications use the browser notification API when available. Phone notifications use PWA push-capable behavior where supported by the installed browser and OS.

Notification behavior:

- The app asks for notification permission from Settings or the first alarm setup flow.
- Each due alarm creates a notification with task title and due time.
- Repeating alarms reschedule according to the repeat rule after firing.
- Until-completed alarms continue to fire on the configured cadence until the task is completed.
- Completing a task cancels remaining active alarms for that task unless the user explicitly keeps them.

If full mobile push is not available in a local-only build, the app still stores alarms and surfaces them while the app is open. A later service-worker-backed push integration can upgrade this.

## Codex Integration

Codex should be able to add tasks without using the app UI.

Supported local interfaces:

- A JSON task store that the app reads and writes.
- A CLI command such as `npm run task:add -- --title "..." --date today --time 15:30 --repeat weekly`.
- A small import function that validates task payloads before writing them.

When the user asks Codex to add a task, Codex will call the local CLI helper or update the task store through the validation path. The task source is stored as `codex`, so the app can show provenance in task detail if useful without adding a dedicated UI section.

## Desktop Startup

The app should support launching when the computer starts.

Windows behavior:

- Provide an app setting or script that creates a Startup folder shortcut to the app launcher.
- The shortcut should open the app in the user's default browser or installed PWA window.
- The app must not silently change startup settings without explicit user action.

The implementation should include a documented script for enabling or disabling startup.

## Theme

The app supports light and dark mode.

Theme behavior:

- Default follows system preference.
- User can override to light or dark in Settings.
- Theme preference persists locally.
- Calendar holiday colors must remain distinguishable in both themes.

## Data Flow

Core flow:

1. UI reads tasks, settings, and holiday data through a local data service.
2. Task creation validates title, date, optional time, and alarm settings.
3. Calendar renders Japan holiday base data and optional Korea overlay data.
4. Alarm scheduler reads active tasks with alarm settings.
5. Codex and CLI writes go through the same validation service as UI writes.

The data boundary should be small and explicit so the UI, alarm scheduler, and Codex helper do not duplicate parsing or validation.

## Error Handling

The app should handle:

- Missing notification permission: show a clear disabled state and a Settings action.
- Invalid repeat rule: reject the save and keep the form open.
- Holiday data missing for a year: show weekends and user tasks, plus a non-blocking warning.
- Corrupt task store: preserve the bad file as a backup and start with an empty safe store after user confirmation.
- Startup shortcut failure: show the failed path and the command the user can run manually.

## Testing

Focus tests on shared behavior rather than layout snapshots.

Required tests:

- Task creation with and without alarm settings.
- Repeat rule scheduling for once, daily, weekdays, weekly, monthly, and until-completed.
- Calendar rendering with Japan-only holidays.
- Calendar rendering with Korea overlay enabled.
- Merged JP+KR date behavior.
- Codex/CLI task insertion through the validation path.
- Theme preference persistence.

Manual verification:

- Desktop responsive layout.
- Mobile responsive layout.
- Dark mode contrast.
- Notification permission flow.
- Startup enable and disable script on Windows.

## Open Constraints

- Full push notifications on phones may require a deployed HTTPS endpoint or browser-specific PWA support. The first version should implement the local/PWA-ready notification path and document mobile limitations clearly.
- This workspace currently has no git repository at `C:\jini-dev\project`, so this design document cannot be committed until a repository is initialized or the project is moved into one.
