/**
 * Domain + row types for the local SQLite store.
 *
 * Conventions (see plan / data-layer memory):
 * - Domain types are camelCase; raw DB rows are `*Row` and snake_case.
 * - All timestamps are epoch milliseconds (UTC) stored as INTEGER.
 * - `reminderAt` is an array of epoch-ms in the domain; stored as a JSON TEXT column.
 * - `sortOrder` is REAL so fractional values can be inserted between rows (drag-reorder).
 * - IDs are string UUIDs.
 */

/** Priority: 0 = none, 1 = medium, 2 = high. Rendered as a colored dot only. */
export enum Priority {
  None = 0,
  Medium = 1,
  High = 2,
}

/**
 * Recurrence rule, computed entirely on-device. Encoded as a compact string:
 *   "DAILY" | "WEEKLY:MON,WED,FRI" | "MONTHLY:15"
 * `null` means a one-off task. Parsing/next-occurrence math lands in Milestone 5.
 */
export type RecurrenceRule = string;

/** Settings.theme — drives dark mode + system auto-detect. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** Settings.language — English / Bangla toggle. */
export type LanguagePreference = 'en' | 'bn';

/** Settings.purchaseState — 'free' shows ads; 'purchased' skips AdMob init entirely. */
export type PurchaseState = 'free' | 'purchased';

// ── Domain types ────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  /** null = Inbox (no list). */
  listId: string | null;
  title: string;
  notes: string | null;
  /** Epoch ms, or null if no due date. */
  dueAt: number | null;
  /** Array of epoch-ms reminder times (possibly empty). */
  reminderAt: number[];
  priority: Priority;
  recurrenceRule: RecurrenceRule | null;
  /** Epoch ms of completion, or null if not completed. */
  completedAt: number | null;
  /** Parent task id for subtasks/checklist items, else null. */
  parentTaskId: string | null;
  createdAt: number;
  sortOrder: number;
}

export interface List {
  id: string;
  name: string;
  /** Hex color string, or null. */
  color: string | null;
  /** Icon identifier (e.g. Ionicons name), or null. */
  icon: string | null;
  sortOrder: number;
}

export interface Habit {
  id: string;
  title: string;
  frequencyRule: string | null;
  streakCount: number;
  lastCheckedAt: number | null;
}

export interface PomodoroSession {
  id: string;
  /** Attached task, or null for a standalone session. */
  taskId: string | null;
  /** Duration in seconds. */
  duration: number;
  completedAt: number | null;
}

export interface Settings {
  theme: ThemePreference;
  language: LanguagePreference;
  purchaseState: PurchaseState;
  lastBackupAt: number | null;
  /** Quiet-hours window as minutes-from-midnight (0–1439), or null if disabled. */
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

// ── Raw row types (snake_case, as returned by SQLite) ────────────────────────

export interface TaskRow {
  id: string;
  list_id: string | null;
  title: string;
  notes: string | null;
  due_at: number | null;
  reminder_at: string | null;
  priority: number;
  recurrence_rule: string | null;
  completed_at: number | null;
  parent_task_id: string | null;
  created_at: number;
  sort_order: number;
}

export interface ListRow {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  sort_order: number;
}

export interface HabitRow {
  id: string;
  title: string;
  frequency_rule: string | null;
  streak_count: number;
  last_checked_at: number | null;
}

export interface PomodoroSessionRow {
  id: string;
  task_id: string | null;
  duration: number;
  completed_at: number | null;
}

export interface SettingsRow {
  id: number;
  theme: string;
  language: string;
  purchase_state: string;
  last_backup_at: number | null;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
}
