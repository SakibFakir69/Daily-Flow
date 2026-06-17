import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { habitsRepo, type Habit } from '@/db';

export interface HabitsState {
  habits: Habit[];
  loading: boolean;
  refresh: () => Promise<void>;
}

/** Loads habits, refetching on focus. */
export function useHabits(): HabitsState {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await habitsRepo.getHabits();
    setHabits(next);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      refresh().catch((error) => {
        if (active) console.error('[DailyFlow] Failed to load habits:', error);
      });
      return () => {
        active = false;
      };
    }, [refresh])
  );

  return { habits, loading, refresh };
}
