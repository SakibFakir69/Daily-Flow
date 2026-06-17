import { differenceInCalendarDays, isToday } from 'date-fns';

import { getDatabase } from '../database';
import { newId } from '../id';
import type { Habit, HabitRow } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

function mapRow(row: HabitRow): Habit {
  return {
    id: row.id,
    title: row.title,
    frequencyRule: row.frequency_rule,
    streakCount: row.streak_count,
    lastCheckedAt: row.last_checked_at,
  };
}

export interface CreateHabitInput {
  title: string;
  frequencyRule?: string | null;
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const db = await getDatabase();
  const habit: Habit = {
    id: newId(),
    title: input.title,
    frequencyRule: input.frequencyRule ?? 'DAILY',
    streakCount: 0,
    lastCheckedAt: null,
  };
  await db.runAsync(
    `INSERT INTO habits (id, title, frequency_rule, streak_count, last_checked_at)
     VALUES ($id, $title, $rule, $streak, $last)`,
    {
      $id: habit.id,
      $title: habit.title,
      $rule: habit.frequencyRule,
      $streak: habit.streakCount,
      $last: habit.lastCheckedAt,
    }
  );
  return habit;
}

export async function getHabits(): Promise<Habit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY rowid ASC');
  return rows.map(mapRow);
}

export async function renameHabit(id: string, title: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE habits SET title = $title WHERE id = $id', { $title: title, $id: id });
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM habits WHERE id = $id', { $id: id });
}

/** Whether the habit's last check-in was today (i.e. already done). */
export function isCheckedToday(habit: Habit): boolean {
  return habit.lastCheckedAt !== null && isToday(habit.lastCheckedAt);
}

/**
 * Toggles today's check-in and updates the streak:
 *  - checking when yesterday was the last check → streak + 1
 *  - checking after a gap (or first ever) → streak resets to 1
 *  - un-checking today → streak − 1 (last check rolled back a day so the chain
 *    can resume; cleared entirely once the streak hits zero)
 *
 * History isn't stored (single `last_checked_at`), so un-check is a best-effort
 * rollback — fine for a personal streak counter.
 */
export async function toggleHabitToday(habit: Habit, now: number = Date.now()): Promise<void> {
  const db = await getDatabase();
  let streak: number;
  let last: number | null;

  if (isCheckedToday(habit)) {
    streak = Math.max(0, habit.streakCount - 1);
    last = streak > 0 ? now - DAY_MS : null;
  } else if (
    habit.lastCheckedAt !== null &&
    differenceInCalendarDays(now, habit.lastCheckedAt) === 1
  ) {
    streak = habit.streakCount + 1;
    last = now;
  } else {
    streak = 1;
    last = now;
  }

  await db.runAsync('UPDATE habits SET streak_count = $streak, last_checked_at = $last WHERE id = $id', {
    $streak: streak,
    $last: last,
    $id: habit.id,
  });
}

/** Number of habits checked in today (for the stats screen, Milestone 9). */
export async function getCheckedTodayCount(): Promise<number> {
  const habits = await getHabits();
  return habits.filter(isCheckedToday).length;
}
