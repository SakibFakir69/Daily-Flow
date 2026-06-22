# DailyFlow

A fully **offline, zero-backend** todo & productivity app for Android and iOS. No login, no account, no server — every task, list, and habit lives entirely on your device.

Built with [Expo](https://expo.dev) (SDK 56) and React Native.

## Features

- **Tasks** — due dates, multiple reminders, priorities, notes, and subtasks/checklists
- **Smart views** — Today, Upcoming, and All, plus full-text search
- **Custom lists** — organize tasks into color- and icon-tagged lists (Inbox by default)
- **Recurring tasks** — daily / weekly / monthly rules, computed entirely on-device
- **Habits** — track recurring habits with streak counts
- **Pomodoro** — built-in focus timer with session history
- **Stats** — completion and productivity insights
- **Quick add** — natural-language parsing for fast task entry
- **Gestures** — swipe actions and drag-to-reorder
- **Notifications** — local reminders with quiet-hours support
- **Home-screen widgets** — "Today" widget on both Android and iOS (WidgetKit)
- **First-run onboarding** — animated overview shown once on first launch
- **Themes** — light / dark / system
- **Localization** — English and Bangla (বাংলা)
- **Backup & restore** — export/import all data as JSON; share via the system sheet
- **Offline-first** — works with zero connectivity, no sign-in required

## Tech stack

| Area          | Technology                                          |
| ------------- | --------------------------------------------------- |
| Framework     | Expo SDK 56, React Native 0.85, React 19            |
| Language      | TypeScript                                          |
| Routing       | Expo Router (file-based, bottom-tab navigation)     |
| Storage       | expo-sqlite (local, on-device)                      |
| Animation     | React Native Reanimated 4 + Worklets                |
| Notifications | expo-notifications                                  |
| Widgets       | react-native-android-widget + expo-widgets (iOS)    |
| Monetization  | AdMob (free tier) + expo-iap (remove-ads purchase)  |

## Navigation

Five bottom tabs — **Today**, **Upcoming**, **All**, **Lists**, **Habits**. Secondary
screens (task editor, search, settings, pomodoro, stats) are reachable by navigation
but are not surfaced as tabs.

## Project structure

```
src/
├── app/                 Screens & routes (Expo Router)
│   ├── index            Today (tab)
│   ├── upcoming         Upcoming (tab)
│   ├── all              All tasks (tab)
│   ├── lists/           Custom lists (tab) + lists/[id]
│   ├── habits           Habit tracking (tab)
│   ├── task/[id]        Task detail/editor
│   └── search, settings, pomodoro, stats
├── db/                  SQLite singleton, schema, migrations, id
│   └── repositories/    tasks, lists, habits, pomodoro, settings, backup
├── components/          Task rows, swipeable/draggable lists, quick-add, modals,
│                        onboarding overlay, themed primitives
├── hooks/               use-database, use-task-list, use-habits, use-stats,
│                        use-lists, use-notifications, use-theme, …
├── notifications/       scheduler, permissions, quiet-hours, handlers, setup
├── widgets/             Android + iOS "Today" widget builders & data
├── ads/  iap/           Monetization (with .web fallbacks)
├── i18n/                Translations (en / bn) + useTranslation
├── lib/                 dates, recurrence, quick-parse, haptics, navigation, runtime
├── constants/           theme palette, list presets
└── settings/            Settings context provider
```

Many modules ship a platform-specific variant (`*.web.ts`, `*.android.ts`, `*.ios.ts`)
so native features (ads, widgets, color scheme) degrade gracefully on web.

### Data model

Domain types are camelCase; raw SQLite rows are snake_case `*Row` types. All timestamps
are epoch milliseconds (UTC, stored as `INTEGER`). IDs are string UUIDs. `sortOrder` is a
`REAL` so fractional values can be inserted between rows for drag-reorder.

- **Task** — `listId` (null = Inbox), `title`, `notes`, `dueAt`, `reminderAt[]`,
  `priority` (none/medium/high), `recurrenceRule`, `completedAt`, `parentTaskId`,
  `createdAt`, `sortOrder`
- **List** — `name`, `color`, `icon`, `sortOrder`
- **Habit** — `title`, `frequencyRule`, `streakCount`, `lastCheckedAt`
- **PomodoroSession** — `taskId`, `duration` (seconds), `completedAt`
- **Settings** — `theme`, `language`, `purchaseState`, `lastBackupAt`,
  quiet-hours window, `onboardingCompletedAt`

Recurrence rules are encoded as a compact on-device string: `"DAILY"`,
`"WEEKLY:MON,WED,FRI"`, or `"MONTHLY:15"` (`null` = one-off).

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the development server

   ```bash
   npx expo start
   ```

This project uses several native modules (SQLite, notifications, widgets, ads), so most
features require a [development build](https://docs.expo.dev/develop/development-builds/introduction/)
rather than Expo Go. The app guards native modules so it won't crash inside Expo Go, but
real testing needs a dev build.

### Run on a device/emulator

```bash
npm run android   # Android
npm run ios       # iOS
```

## Scripts

| Command           | Description                |
| ----------------- | ------------------------- |
| `npm start`       | Start the Expo dev server |
| `npm run android` | Build & run on Android    |
| `npm run ios`     | Build & run on iOS        |
| `npm run lint`    | Lint the project          |

> **Note:** `expo export -p web` is currently broken due to the expo-sqlite wasm
> dependency. The canonical verification path is `tsc` + Android/iOS export. Device and
> widget QA require a development build.

## License

See [LICENSE](./LICENSE).
