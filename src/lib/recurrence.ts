import { addDays, addMonths, addWeeks, getDaysInMonth, getDay, setDate } from 'date-fns';

/**
 * Client-side recurrence math. Rules are the compact strings produced by the
 * quick-add parser and stored on `tasks.recurrence_rule`:
 *   "DAILY" | "WEEKLY" | "WEEKLY:MON,WED,FRI" | "MONTHLY" | "MONTHLY:15"
 * Everything is computed on-device with date-fns — no server, works offline.
 */

export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ParsedRecurrence {
  freq: RecurrenceFreq;
  /** Weekdays (0=Sun … 6=Sat) for a WEEKLY rule with specific days. */
  weekdays?: number[];
  /** Day-of-month (1–31) for a MONTHLY rule pinned to a date. */
  dayOfMonth?: number;
}

const WEEKDAY_CODES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

export function parseRecurrence(rule: string | null): ParsedRecurrence | null {
  if (!rule) return null;
  const [head, rest] = rule.split(':');

  switch (head) {
    case 'DAILY':
      return { freq: 'DAILY' };
    case 'WEEKLY': {
      if (!rest) return { freq: 'WEEKLY' };
      const weekdays = rest
        .split(',')
        .map((code) => WEEKDAY_CODES[code.trim().toUpperCase()])
        .filter((n): n is number => n !== undefined);
      return weekdays.length > 0 ? { freq: 'WEEKLY', weekdays } : { freq: 'WEEKLY' };
    }
    case 'MONTHLY': {
      if (!rest) return { freq: 'MONTHLY' };
      const dom = parseInt(rest, 10);
      return Number.isFinite(dom) && dom >= 1 && dom <= 31
        ? { freq: 'MONTHLY', dayOfMonth: dom }
        : { freq: 'MONTHLY' };
    }
    default:
      return null;
  }
}

/** Sets the day-of-month, clamped to the month's length, preserving time-of-day. */
function withDayOfMonth(date: Date, dayOfMonth: number): Date {
  return setDate(date, Math.min(dayOfMonth, getDaysInMonth(date)));
}

/**
 * The first occurrence strictly after `fromMs`, preserving the time-of-day of
 * `fromMs`. Returns null if the rule is unrecognized.
 */
export function nextOccurrence(rule: string | null, fromMs: number): number | null {
  const parsed = parseRecurrence(rule);
  if (!parsed) return null;
  const from = new Date(fromMs);

  switch (parsed.freq) {
    case 'DAILY':
      return addDays(from, 1).getTime();

    case 'WEEKLY': {
      if (!parsed.weekdays || parsed.weekdays.length === 0) {
        return addWeeks(from, 1).getTime();
      }
      for (let i = 1; i <= 7; i++) {
        const candidate = addDays(from, i);
        if (parsed.weekdays.includes(getDay(candidate))) return candidate.getTime();
      }
      return addWeeks(from, 1).getTime(); // unreachable, but keeps the type total
    }

    case 'MONTHLY': {
      if (parsed.dayOfMonth === undefined) {
        return addMonths(from, 1).getTime();
      }
      const thisMonth = withDayOfMonth(from, parsed.dayOfMonth);
      if (thisMonth.getTime() > fromMs) return thisMonth.getTime();
      return withDayOfMonth(addMonths(from, 1), parsed.dayOfMonth).getTime();
    }
  }
}

/**
 * The next occurrence strictly after `fromMs` that is also after `nowMs`. If a
 * recurring task was completed long after its due date, this rolls forward past
 * any missed occurrences instead of generating one already in the past.
 */
export function nextFutureOccurrence(
  rule: string | null,
  fromMs: number,
  nowMs: number
): number | null {
  let next = nextOccurrence(rule, fromMs);
  if (next === null) return null;
  let guard = 0;
  while (next <= nowMs && guard < 500) {
    const following = nextOccurrence(rule, next);
    if (following === null || following === next) break;
    next = following;
    guard += 1;
  }
  return next;
}
