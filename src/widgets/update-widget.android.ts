import { requestWidgetUpdate } from 'react-native-android-widget';

import { buildTodayWidget } from './build-today-widget';
import { TODAY_WIDGET_NAME } from './config';

/**
 * Android: pushes a fresh render to every "Today" widget the user has placed on
 * their home screen. Call after any mutation that can change today's task list
 * (create / complete / delete / reschedule). No-ops when no widget is added, and
 * never throws into the caller. (This file is only bundled on Android.)
 */
export async function refreshTodayWidget(): Promise<void> {
  try {
    await requestWidgetUpdate({
      widgetName: TODAY_WIDGET_NAME,
      renderWidget: () => buildTodayWidget(),
      widgetNotFound: () => {
        // No widget on the home screen — nothing to update.
      },
    });
  } catch (error) {
    console.error('[DailyFlow] Failed to refresh widget:', error);
  }
}
