import {
  addDays,
  format,
  isThisYear,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
} from 'date-fns';

/**
 * Date helpers. All boundaries are computed on-device (offline) and returned as
 * epoch-ms so they can feed directly into the SQLite repositories, which store
 * timestamps as INTEGER epoch-ms (UTC).
 */

/** Start of today (local midnight) as epoch ms. */
export function startOfTodayMs(now: number = Date.now()): number {
  return startOfDay(now).getTime();
}

/**
 * Start of tomorrow (local) as epoch ms. This is the exclusive upper bound for
 * the Today view and the inclusive lower bound for the Upcoming view.
 */
export function startOfTomorrowMs(now: number = Date.now()): number {
  return startOfDay(addDays(now, 1)).getTime();
}

/** True when `ms` is strictly before the start of today (i.e. overdue). */
export function isOverdue(ms: number, now: number = Date.now()): boolean {
  return ms < startOfTodayMs(now);
}

/** True when the task has a clock time (not pinned to local midnight). */
export function hasTimeComponent(ms: number): boolean {
  return ms !== startOfDay(ms).getTime();
}

/**
 * Human due label for a task row: "Today", "Tomorrow", "Yesterday", a weekday
 * for the coming week, otherwise a short date. Appends the time when present.
 */
export function formatDueLabel(ms: number, now: number = Date.now()): string {
  let base: string;
  if (isToday(ms)) base = 'Today';
  else if (isTomorrow(ms)) base = 'Tomorrow';
  else if (isYesterday(ms)) base = 'Yesterday';
  else if (isThisYear(ms)) base = format(ms, 'EEE, d MMM');
  else base = format(ms, 'd MMM yyyy');

  if (hasTimeComponent(ms)) {
    return `${base}, ${format(ms, 'h:mm a')}`;
  }
  return base;
}

/** Long header date, e.g. "Tuesday, 17 June". */
export function formatHeaderDate(now: number = Date.now()): string {
  return format(now, 'EEEE, d MMMM');
}
