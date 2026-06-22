import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { settingsRepo, tasksRepo, type Task } from '@/db';
import { hasTimeComponent } from '@/lib/dates';
import { isExpoGo } from '@/lib/runtime';
import { ensureNotificationPermissions } from './permissions';
import { applyQuietHours } from './quiet-hours';
import { ANDROID_CHANNEL_ID, TASK_REMINDER_CATEGORY, configureNotifications } from './setup';

/** Data attached to every scheduled reminder so the action handler can resolve it. */
export interface ReminderData {
  taskId: string;
}

/**
 * The reminder times a task should fire at:
 *  - explicit `reminderAt` entries if present, otherwise
 *  - the due date *only when it carries a clock time* (so an all-day "tomorrow"
 *    task doesn't buzz at midnight).
 * A dedicated reminder-editing UI (Milestone 7) will populate `reminderAt`.
 */
function effectiveReminders(task: Task): number[] {
  if (task.reminderAt.length > 0) return task.reminderAt;
  if (task.dueAt !== null && hasTimeComponent(task.dueAt)) return [task.dueAt];
  return [];
}

async function scheduleOne(taskId: string, title: string, whenMs: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reminder',
      body: title,
      categoryIdentifier: TASK_REMINDER_CATEGORY,
      data: { taskId } satisfies ReminderData,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: whenMs,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  });
}

/**
 * Cancels every scheduled reminder and reschedules from the current DB state.
 *
 * This is intentionally a full cancel+rebuild rather than incremental: it's the
 * resync run on every app foreground/launch, and it's the defense against
 * aggressive Android OEM battery managers (Xiaomi/Oppo/etc.) that silently drop
 * scheduled notifications — re-asserting the full set is the only reliable fix.
 *
 * No-ops (after cancelling) when there's nothing to schedule, so users with no
 * reminders are never prompted for permission.
 *
 * Serialized via an in-flight latch with a trailing re-run: rapid
 * background↔foreground toggling (or a mutation landing mid-resync) can fire
 * several resyncs at once, and two overlapping cancel+rebuild passes could
 * briefly leave fewer notifications scheduled. While a pass is running, further
 * calls don't start their own — they flag a single trailing run that executes
 * once the current pass finishes. The trailing run guarantees a fresh pass
 * reads post-mutation DB state (a caller awaiting a just-committed change can't
 * be coalesced into a pass that already queried the DB before the commit).
 */
let inFlight: Promise<void> | null = null;
let rerunQueued = false;

export async function resyncAllReminders(): Promise<void> {
  // No notification engine in Expo Go — skip the whole cancel+rebuild pass.
  if (isExpoGo) return;
  if (inFlight) {
    // A pass is already running; ensure exactly one fresh pass follows it.
    rerunQueued = true;
    return inFlight;
  }
  inFlight = (async () => {
    try {
      await doResync();
      // Drain any resync requested while we were running, until none remain.
      while (rerunQueued) {
        rerunQueued = false;
        await doResync();
      }
    } finally {
      inFlight = null;
      rerunQueued = false;
    }
  })();
  return inFlight;
}

async function doResync(): Promise<void> {
  await configureNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  const [settings, tasks] = await Promise.all([
    settingsRepo.getSettings(),
    tasksRepo.getActiveReminderTasks(),
  ]);

  // Resolve concrete future fire-times (quiet-hours adjusted) before prompting.
  const jobs: { taskId: string; title: string; when: number }[] = [];
  for (const task of tasks) {
    for (const raw of effectiveReminders(task)) {
      if (raw <= now) continue;
      const when = applyQuietHours(raw, settings);
      if (when > now) jobs.push({ taskId: task.id, title: task.title, when });
    }
  }

  if (jobs.length === 0) return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  for (const job of jobs) {
    await scheduleOne(job.taskId, job.title, job.when);
  }
}
