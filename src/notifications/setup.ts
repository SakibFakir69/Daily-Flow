import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notification category + action identifiers. Per the SDK 56 docs, category
 * identifiers must not contain ':' or '-'.
 */
export const TASK_REMINDER_CATEGORY = 'taskReminder';
export const ACTION_MARK_DONE = 'markDone';
export const ACTION_SNOOZE_1H = 'snooze1h';
export const ANDROID_CHANNEL_ID = 'reminders';

let configured = false;

/**
 * Idempotently configures the foreground presentation handler, the reminder
 * category (with "Mark done" / "Snooze 1hr" buttons that are handled WITHOUT
 * opening the app), and the Android notification channel.
 */
export async function configureNotifications(): Promise<void> {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  await Notifications.setNotificationCategoryAsync(TASK_REMINDER_CATEGORY, [
    {
      identifier: ACTION_MARK_DONE,
      buttonTitle: 'Mark done',
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_SNOOZE_1H,
      buttonTitle: 'Snooze 1hr',
      options: { opensAppToForeground: false },
    },
  ]);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Task reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}
