import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { listsRepo, tasksRepo, type List } from '@/db';

export interface ListsState {
  lists: List[];
  /** Incomplete task counts per list id. */
  counts: Record<string, number>;
  loading: boolean;
  refresh: () => Promise<void>;
}

/** Loads all lists plus their incomplete task counts, refetching on focus. */
export function useLists(): ListsState {
  const [lists, setLists] = useState<List[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [nextLists, nextCounts] = await Promise.all([
      listsRepo.getLists(),
      tasksRepo.getIncompleteCountsByList(),
    ]);
    setLists(nextLists);
    setCounts(nextCounts);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      refresh().catch((error) => {
        if (active) console.error('[DailyFlow] Failed to load lists:', error);
      });
      return () => {
        active = false;
      };
    }, [refresh])
  );

  return { lists, counts, loading, refresh };
}
