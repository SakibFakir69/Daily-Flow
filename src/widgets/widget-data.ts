import { format } from 'date-fns';

import { tasksRepo, type Task } from '@/db';
import { formatHeaderDate, hasTimeComponent, isOverdue, startOfTomorrowMs } from '@/lib/dates';

/**
 * Platform-agnostic widget data. Deliberately imports NO native widget library
 * (neither react-native-android-widget nor expo-widgets) so it can be shared by
 * both the Android (`build-today-widget`) and iOS (`today-ios-widget`) renderers
 * and safely loaded on any platform.
 *
 * Everything here is plain, serializable data — the iOS path passes it straight
 * to `updateSnapshot`, which must receive JSON-serializable props.
 */

/** Max task rows that fit a medium widget. */
const MAX_ROWS = 5;

export interface WidgetTaskData {
  id: string;
  title: string;
  /** "9:30 AM" etc., or null when the task has no clock time. */
  timeLabel: string | null;
  /** Priority enum value (0 none / 1 medium / 2 high) — colored by each renderer. */
  priority: number;
  /** True when overdue (rolled over from a previous day). */
  overdue: boolean;
}

export interface TodayWidgetData {
  dateLabel: string;
  /** Total pending tasks for today (may exceed `tasks.length`). */
  count: number;
  tasks: WidgetTaskData[];
  /** How many tasks are hidden beyond what fits (count - tasks.length). */
  overflow: number;
}

function toData(task: Task, now: number): WidgetTaskData {
  const hasTime = task.dueAt !== null && hasTimeComponent(task.dueAt);
  return {
    id: task.id,
    title: task.title,
    timeLabel: hasTime ? format(task.dueAt as number, 'h:mm a') : null,
    priority: task.priority,
    overdue: task.dueAt !== null && isOverdue(task.dueAt, now),
  };
}

/**
 * Reads today's pending tasks from the local DB into the flat shape both widget
 * renderers consume. Runs outside React (headless task / app code alike), so it
 * talks to the DB singleton directly — same pattern as the notification handlers.
 */
export async function loadTodayWidgetData(now: number = Date.now()): Promise<TodayWidgetData> {
  const tasks = await tasksRepo.getTodayTasks(startOfTomorrowMs(now));
  const visible = tasks.slice(0, MAX_ROWS);
  return {
    dateLabel: formatHeaderDate(now),
    count: tasks.length,
    tasks: visible.map((task) => toData(task, now)),
    overflow: Math.max(0, tasks.length - visible.length),
  };
}
