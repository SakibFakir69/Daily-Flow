import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { habitsRepo, pomodoroRepo, tasksRepo, type Habit } from '@/db';
import { startOfTodayMs, startOfWeekMs } from '@/lib/dates';

export interface Stats {
  completedToday: number;
  completedWeek: number;
  focusToday: number;
  focusWeek: number;
  /** Habits with a streak > 0, sorted by streak descending. */
  streaks: Habit[];
}

const EMPTY: Stats = {
  completedToday: 0,
  completedWeek: 0,
  focusToday: 0,
  focusWeek: 0,
  streaks: [],
};

/** Aggregates personal-progress numbers, refetching on focus. All computed on-device. */
export function useStats(): { stats: Stats; loading: boolean; refresh: () => Promise<void> } {
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const today = startOfTodayMs();
    const week = startOfWeekMs();
    const [completedToday, completedWeek, focusToday, focusWeek, habits] = await Promise.all([
      tasksRepo.getCompletedCountSince(today),
      tasksRepo.getCompletedCountSince(week),
      pomodoroRepo.getSessionCountSince(today),
      pomodoroRepo.getSessionCountSince(week),
      habitsRepo.getHabits(),
    ]);
    setStats({
      completedToday,
      completedWeek,
      focusToday,
      focusWeek,
      streaks: habits.filter((h) => h.streakCount > 0).sort((a, b) => b.streakCount - a.streakCount),
    });
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      refresh().catch((error) => {
        if (active) console.error('[DailyFlow] Failed to load stats:', error);
      });
      return () => {
        active = false;
      };
    }, [refresh])
  );

  return { stats, loading, refresh };
}
