import type { WidgetRepresentation } from 'react-native-android-widget';

import { Colors, PriorityColors } from '@/constants/theme';
import {
  TodayTasksWidget,
  type HexColor,
  type WidgetColors,
  type WidgetTaskItem,
} from './today-tasks-widget';
import { loadTodayWidgetData, type WidgetTaskData } from './widget-data';

/** Maps the app theme palette to the flat color set the widget primitives need. */
function widgetColors(scheme: 'light' | 'dark'): WidgetColors {
  const c = Colors[scheme];
  return {
    background: c.background,
    card: c.card,
    text: c.text,
    textSecondary: c.textSecondary,
    tint: c.tint,
    border: c.border,
    danger: c.danger,
  };
}

function priorityColor(priority: number, scheme: 'light' | 'dark'): HexColor | null {
  if (priority === 1) return PriorityColors[scheme][1];
  if (priority === 2) return PriorityColors[scheme][2];
  return null;
}

function toItem(task: WidgetTaskData, scheme: 'light' | 'dark'): WidgetTaskItem {
  return {
    id: task.id,
    title: task.title,
    timeLabel: task.timeLabel,
    priorityColor: priorityColor(task.priority, scheme),
    overdue: task.overdue,
  };
}

/**
 * Builds the Android light/dark widget representation from the shared task data.
 * Runs in the headless widget task (no React context).
 */
export async function buildTodayWidget(
  now: number = Date.now()
): Promise<WidgetRepresentation> {
  const data = await loadTodayWidgetData(now);

  const render = (scheme: 'light' | 'dark') => (
    <TodayTasksWidget
      colors={widgetColors(scheme)}
      dateLabel={data.dateLabel}
      count={data.count}
      items={data.tasks.map((task) => toItem(task, scheme))}
      overflow={data.overflow}
    />
  );

  return { light: render('light'), dark: render('dark') };
}
