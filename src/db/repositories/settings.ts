import { type SQLiteBindValue } from 'expo-sqlite';

import { getDatabase } from '../database';
import type {
  LanguagePreference,
  PurchaseState,
  Settings,
  SettingsRow,
  ThemePreference,
} from '../types';

function mapRow(row: SettingsRow): Settings {
  return {
    theme: row.theme as ThemePreference,
    language: row.language as LanguagePreference,
    purchaseState: row.purchase_state as PurchaseState,
    lastBackupAt: row.last_backup_at,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
  };
}

/**
 * Reads the single settings row (id = 1). The row is seeded by the v1 migration,
 * so this should always find it; defaults are returned defensively otherwise.
 */
export async function getSettings(): Promise<Settings> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SettingsRow>(
    'SELECT * FROM settings WHERE id = 1'
  );
  if (row) return mapRow(row);
  return {
    theme: 'system',
    language: 'en',
    purchaseState: 'free',
    lastBackupAt: null,
    quietHoursStart: null,
    quietHoursEnd: null,
  };
}

export type UpdateSettingsInput = Partial<Settings>;

const UPDATE_COLUMNS: Record<keyof Settings, string> = {
  theme: 'theme',
  language: 'language',
  purchaseState: 'purchase_state',
  lastBackupAt: 'last_backup_at',
  quietHoursStart: 'quiet_hours_start',
  quietHoursEnd: 'quiet_hours_end',
};

/** Patches the single settings row. Omitted keys are left unchanged. */
export async function updateSettings(patch: UpdateSettingsInput): Promise<void> {
  const entries = Object.entries(patch) as [keyof Settings, unknown][];
  if (entries.length === 0) return;

  const assignments: string[] = [];
  const params: Record<string, SQLiteBindValue> = {};
  for (const [key, value] of entries) {
    assignments.push(`${UPDATE_COLUMNS[key]} = $${key}`);
    params[`$${key}`] = value as SQLiteBindValue;
  }

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE settings SET ${assignments.join(', ')} WHERE id = 1`,
    params
  );
}
