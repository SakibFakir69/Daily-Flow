import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Current schema version. Bump this and add an `if (version < N)` block in
 * `migrate()` for every forward-only schema change. Never edit a past block.
 */
export const DATABASE_VERSION = 2;

/**
 * Forward-only migration runner keyed on `PRAGMA user_version`.
 * Idempotent: if the DB is already at `DATABASE_VERSION`, this is a no-op.
 */
export async function migrate(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let version = result?.user_version ?? 0;

  if (version >= DATABASE_VERSION) {
    return;
  }

  if (version < 1) {
    await migrateToV1(db);
    version = 1;
  }

  if (version < 2) {
    await migrateToV2(db);
    version = 2;
  }

  // `user_version` doesn't accept bound parameters; DATABASE_VERSION is a constant.
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

/** Initial schema: all v1 tables, indexes, and the single settings row. */
async function migrateToV1(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE lists (
        id         TEXT PRIMARY KEY NOT NULL,
        name       TEXT NOT NULL,
        color      TEXT,
        icon       TEXT,
        sort_order REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE tasks (
        id              TEXT PRIMARY KEY NOT NULL,
        list_id         TEXT REFERENCES lists(id) ON DELETE SET NULL,
        title           TEXT NOT NULL,
        notes           TEXT,
        due_at          INTEGER,
        reminder_at     TEXT,
        priority        INTEGER NOT NULL DEFAULT 0,
        recurrence_rule TEXT,
        completed_at    INTEGER,
        parent_task_id  TEXT REFERENCES tasks(id) ON DELETE CASCADE,
        created_at      INTEGER NOT NULL,
        sort_order      REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE habits (
        id              TEXT PRIMARY KEY NOT NULL,
        title           TEXT NOT NULL,
        frequency_rule  TEXT,
        streak_count    INTEGER NOT NULL DEFAULT 0,
        last_checked_at INTEGER
      );

      CREATE TABLE pomodoro_sessions (
        id           TEXT PRIMARY KEY NOT NULL,
        task_id      TEXT REFERENCES tasks(id) ON DELETE SET NULL,
        duration     INTEGER NOT NULL,
        completed_at INTEGER
      );

      CREATE TABLE settings (
        id                INTEGER PRIMARY KEY CHECK (id = 1),
        theme             TEXT NOT NULL DEFAULT 'system',
        language          TEXT NOT NULL DEFAULT 'en',
        purchase_state    TEXT NOT NULL DEFAULT 'free',
        last_backup_at    INTEGER,
        quiet_hours_start INTEGER,
        quiet_hours_end   INTEGER
      );

      CREATE INDEX idx_tasks_due_at         ON tasks(due_at);
      CREATE INDEX idx_tasks_list_id        ON tasks(list_id);
      CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
      CREATE INDEX idx_tasks_completed_at   ON tasks(completed_at);
    `);

    // Seed the single settings row with defaults.
    await db.runAsync(
      `INSERT INTO settings (id, theme, language, purchase_state)
       VALUES (1, 'system', 'en', 'free')`
    );
  });
}

/**
 * v2: track when the first-run onboarding overview was completed/dismissed.
 * Epoch ms, or NULL while it has never been seen (the trigger for showing it).
 */
async function migrateToV2(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(
    'ALTER TABLE settings ADD COLUMN onboarding_completed_at INTEGER'
  );
}
