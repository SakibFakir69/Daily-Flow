import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';

import { configureNotifications, handleNotificationResponse, resyncAllReminders } from '@/notifications';

/**
 * Wires up local notifications for the app's lifetime:
 *  - configures the handler/category/channel once,
 *  - resyncs all reminders on launch and on every return to foreground
 *    (the OEM battery-manager defense),
 *  - routes "Mark done" / "Snooze 1hr" actions (including a cold-start tap)
 *    through {@link handleNotificationResponse}.
 *
 * Mounted once from the root layout, after the DB is ready.
 */
export function useNotifications(): void {
  useEffect(() => {
    configureNotifications().catch((error) =>
      console.error('[DailyFlow] Failed to configure notifications:', error)
    );
    resyncAllReminders().catch((error) =>
      console.error('[DailyFlow] Initial reminder resync failed:', error)
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response).catch((error) =>
        console.error('[DailyFlow] Notification action failed:', error)
      );
    });

    // Handle the case where a notification action launched the app from cold.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) return handleNotificationResponse(response);
      })
      .catch(() => {});

    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        resyncAllReminders().catch((error) =>
          console.error('[DailyFlow] Foreground reminder resync failed:', error)
        );
      }
    });

    return () => {
      responseSub.remove();
      appStateSub.remove();
    };
  }, []);
}
