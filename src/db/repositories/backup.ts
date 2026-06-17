import { type SQLiteBindValue } from 'expo-sqlite';

import { getDatabase } from '../database';
import type {
  HabitRow,
  ListRow,
  PomodoroSessionRow,
  SettingsRow,
  TaskRow,
} from '../types';

/**
 * A full snapshot of every user-owned table, as raw rows. Settings is the
 * single id=1 row (or null if somehow missing). Used by the backup/export and
 * restore/import flows in {@link file://src/lib/backup.ts}.
 */
export interface BackupData {
  lists: ListRow[];
  tasks: TaskRow[];
  habits: HabitRow[];
  pomodoroSessions: PomodoroSessionRow[];
  settings: SettingsRow | null;
}

// Column order for positional INSERTs (matches the v1 schema in migrations.ts).
const LIST_COLUMNS = ['id', 'name', 'color', 'icon', 'sort_order'] as const;
const TASK_COLUMNS = [
  'id',
  'list_id',
  'title',
  'notes',
  'due_at',
  'reminder_at',
  'priority',
  'recurrence_rule',
  'completed_at',
  'parent_task_id',
  'created_at',
  'sort_order',
] as const;
const HABIT_COLUMNS = [
  'id',
  'title',
  'frequency_rule',
  'streak_count',
  'last_checked_at',
] as const;
const POMODORO_COLUMNS = ['id', 'task_id', 'duration', 'completed_at'] as const;

/** Reads every table into a single in-memory snapshot. */
export async function exportAllData(): Promise<BackupData> {
  const db = await getDatabase();
  const [lists, tasks, habits, pomodoroSessions, settings] = await Promise.all([
    db.getAllAsync<ListRow>('SELECT * FROM lists'),
    db.getAllAsync<TaskRow>('SELECT * FROM tasks'),
    db.getAllAsync<HabitRow>('SELECT * FROM habits'),
    db.getAllAsync<PomodoroSessionRow>('SELECT * FROM pomodoro_sessions'),
    db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1'),
  ]);
  return { lists, tasks, habits, pomodoroSessions, settings: settings ?? null };
}

function insertStatement(table: string, columns: readonly string[]): string {
  const placeholders = columns.map(() => '?').join(', ');
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
}

function values(row: Record<string, SQLiteBindValue>, columns: readonly string[]): SQLiteBindValue[] {
  return columns.map((c) => row[c] ?? null);
}

/**
 * Destructive restore: wipes lists/tasks/habits/pomodoro_sessions and reinserts
 * the snapshot, then patches the settings row. Foreign keys are toggled OFF
 * around the transaction (the PRAGMA is a no-op *inside* one) so the self-
 * referential task rows and list/task references can be inserted in any order;
 * the snapshot came from a valid DB, so integrity holds once FKs are back on.
 *
 * `purchase_state` is deliberately NOT restored — entitlement is owned by the
 * store (see Milestone 11), not by a portable JSON file.
 */
export async function importAllData(data: BackupData): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('PRAGMA foreign_keys = OFF');
  try {
    await db.withTransactionAsync(async () => {
      await db.execAsync(
        'DELETE FROM pomodoro_sessions; DELETE FROM tasks; DELETE FROM habits; DELETE FROM lists;'
      );

      const lists = insertStatement('lists', LIST_COLUMNS);
      for (const row of data.lists) {
        await db.runAsync(lists, values(row as unknown as Record<string, SQLiteBindValue>, LIST_COLUMNS));
      }
      const tasks = insertStatement('tasks', TASK_COLUMNS);
      for (const row of data.tasks) {
        await db.runAsync(tasks, values(row as unknown as Record<string, SQLiteBindValue>, TASK_COLUMNS));
      }
      const habits = insertStatement('habits', HABIT_COLUMNS);
      for (const row of data.habits) {
        await db.runAsync(habits, values(row as unknown as Record<string, SQLiteBindValue>, HABIT_COLUMNS));
      }
      const pomodoro = insertStatement('pomodoro_sessions', POMODORO_COLUMNS);
      for (const row of data.pomodoroSessions) {
        await db.runAsync(pomodoro, values(row as unknown as Record<string, SQLiteBindValue>, POMODORO_COLUMNS));
      }

      if (data.settings) {
        await db.runAsync(
          `UPDATE settings
             SET theme = ?, language = ?, last_backup_at = ?,
                 quiet_hours_start = ?, quiet_hours_end = ?
           WHERE id = 1`,
          [
            data.settings.theme,
            data.settings.language,
            data.settings.last_backup_at,
            data.settings.quiet_hours_start,
            data.settings.quiet_hours_end,
          ]
        );
      }
    });
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON');
  }
}
