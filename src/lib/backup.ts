import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { backupRepo, settingsRepo, type BackupData } from '@/db';

/** Tag + version stamped into every backup file so imports can be validated. */
const APP_TAG = 'DailyFlow';
const BACKUP_FORMAT = 1;

interface BackupFile {
  app: typeof APP_TAG;
  format: number;
  exportedAt: number;
  data: BackupData;
}

export type ExportResult = { ok: true } | { ok: false; reason: 'unsupported' | 'error' };
export type ImportResult =
  | { ok: true }
  | { ok: false; reason: 'canceled' | 'unsupported' | 'invalid' | 'error' };

function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.app !== APP_TAG) return false;
  if (typeof v.format !== 'number' || v.format > BACKUP_FORMAT) return false;
  const d = v.data as Record<string, unknown> | undefined;
  if (!d) return false;
  return (
    Array.isArray(d.lists) &&
    Array.isArray(d.tasks) &&
    Array.isArray(d.habits) &&
    Array.isArray(d.pomodoroSessions)
  );
}

/**
 * Serializes the whole database to a pretty JSON file in the cache directory
 * and opens the OS share sheet so the user can save it anywhere (Files, Drive,
 * email…). Records `lastBackupAt` on success. No-op on web.
 */
export async function exportBackup(): Promise<ExportResult> {
  if (Platform.OS === 'web') return { ok: false, reason: 'unsupported' };
  try {
    const data = await backupRepo.exportAllData();
    const payload: BackupFile = {
      app: APP_TAG,
      format: BACKUP_FORMAT,
      exportedAt: Date.now(),
      data,
    };

    const file = new File(Paths.cache, 'dailyflow-backup.json');
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(payload, null, 2));

    if (!(await Sharing.isAvailableAsync())) return { ok: false, reason: 'error' };
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'DailyFlow backup',
      UTI: 'public.json',
    });

    await settingsRepo.updateSettings({ lastBackupAt: Date.now() });
    return { ok: true };
  } catch (error) {
    console.warn('[DailyFlow] Backup export failed:', error);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Lets the user pick a previously-exported JSON file and restores it,
 * replacing all current content (see {@link backupRepo.importAllData}). The
 * caller should refresh in-memory state (settings context, reminders) on `ok`.
 * No-op on web.
 */
export async function importBackup(): Promise<ImportResult> {
  if (Platform.OS === 'web') return { ok: false, reason: 'unsupported' };
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return { ok: false, reason: 'canceled' };

    const asset = result.assets[0];
    if (!asset) return { ok: false, reason: 'canceled' };

    const text = await new File(asset.uri).text();
    const parsed: unknown = JSON.parse(text);
    if (!isBackupFile(parsed)) return { ok: false, reason: 'invalid' };

    await backupRepo.importAllData(parsed.data);
    return { ok: true };
  } catch (error) {
    console.warn('[DailyFlow] Backup import failed:', error);
    return { ok: false, reason: 'error' };
  }
}
