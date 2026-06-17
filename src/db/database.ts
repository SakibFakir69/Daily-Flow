import * as SQLite from 'expo-sqlite';

import { migrate } from './migrations';

const DATABASE_NAME = 'dailyflow.db';

/**
 * Cached open+migrate promise. Deliberately a module singleton rather than
 * relying only on `<SQLiteProvider>`: notification handlers, foreground resync,
 * the recurrence engine, and export/import all run *outside* the React tree and
 * need DB access without a hook. The first caller opens and migrates; everyone
 * else awaits the same promise.
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  // WAL improves concurrent read/write throughput; foreign_keys must be enabled
  // per-connection (off by default in SQLite) for our ON DELETE rules to fire.
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
  await migrate(db);
  return db;
}

/** Returns the shared, migrated database connection (opening it on first call). */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    // If opening fails, clear the cache so a later call can retry instead of
    // permanently resolving to a rejected promise.
    dbPromise = openAndMigrate().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}
