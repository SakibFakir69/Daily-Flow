import { todayWidget } from './today-ios-widget';
import { loadTodayWidgetData } from './widget-data';

/**
 * iOS: pushes today's task data to the WidgetKit "Today" widget via a snapshot.
 * Called after any mutation that can change today's task list, plus on launch /
 * foreground. `updateSnapshot` is a no-op if the widget isn't on a home screen,
 * and we never throw into the caller. (This file is only bundled on iOS.)
 *
 * A snapshot (single timeline entry) is sufficient because the app already
 * re-pushes on every foreground and mutation; we don't schedule a timeline.
 */
export async function refreshTodayWidget(): Promise<void> {
  try {
    const data = await loadTodayWidgetData();
    todayWidget.updateSnapshot(data);
  } catch (error) {
    console.error('[DailyFlow] Failed to refresh iOS widget:', error);
  }
}
