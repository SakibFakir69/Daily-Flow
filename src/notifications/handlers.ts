import * as Notifications from 'expo-notifications';

import { tasksRepo } from '@/db';
import { resyncAllReminders } from './scheduler';
import { ACTION_MARK_DONE, ACTION_SNOOZE_1H } from './setup';

const SNOOZE_MS = 60 * 60 * 1000;

/**
 * Handles a notification action. Runs OUTSIDE the React tree (from the response
 * listener and from the cold-start `getLastNotificationResponseAsync`), which is
 * exactly why the DB is a module singleton — these mutations can't depend on a
 * mounted component. "Mark done" / "Snooze 1hr" are resolved locally without
 * bringing the app to the foreground.
 */
export async function handleNotificationResponse(
  response: Notifications.NotificationResponse
): Promise<void> {
  const data = response.notification.request.content.data as { taskId?: string };
  const taskId = data?.taskId;
  if (!taskId) return;

  switch (response.actionIdentifier) {
    case ACTION_MARK_DONE: {
      // Completes and regenerates the next instance if the task recurs.
      await tasksRepo.completeTaskAndRegenerate(taskId);
      await resyncAllReminders();
      break;
    }
    case ACTION_SNOOZE_1H: {
      const task = await tasksRepo.getTaskById(taskId);
      if (!task) return;
      const now = Date.now();
      // Keep any other still-future reminders, add one an hour out.
      const reminders = [...task.reminderAt.filter((r) => r > now), now + SNOOZE_MS];
      await tasksRepo.updateTask(taskId, { reminderAt: reminders });
      await resyncAllReminders();
      break;
    }
    // DEFAULT_ACTION_IDENTIFIER (tapping the body) just opens the app.
    default:
      break;
  }
}
