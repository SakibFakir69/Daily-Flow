import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { listsRepo, tasksRepo, type List, type Task } from '@/db';
import { startOfTomorrowMs } from '@/lib/dates';

export type TaskView = 'today' | 'upcoming' | 'all';

export interface TaskListState {
  tasks: Task[];
  /** Lists keyed by id, for resolving a task's list color/name in a row. */
  listsById: Record<string, List>;
  loading: boolean;
  /** Re-query the current view (also runs automatically on screen focus). */
  refresh: () => Promise<void>;
  /**
   * Optimistically remove a task from the visible list. It stays hidden across
   * focus-refetches until {@link unhide} or {@link forget} is called, so a
   * pending (not-yet-committed) delete/complete can't flicker back.
   */
  hide: (id: string) => void;
  /** Cancel an optimistic removal and re-show the task (used on Undo). */
  unhide: (id: string) => void;
  /** Drop the hidden marker without refetching (used once a commit lands). */
  forget: (id: string) => void;
}

async function queryTasks(view: TaskView): Promise<Task[]> {
  switch (view) {
    case 'today':
      return tasksRepo.getTodayTasks(startOfTomorrowMs());
    case 'upcoming':
      return tasksRepo.getUpcomingTasks(startOfTomorrowMs());
    case 'all':
      return tasksRepo.getAllTasks();
  }
}

/**
 * Loads tasks for a view and refetches whenever the screen regains focus.
 * The DB is already migrated + ready (gated in the root layout).
 */
export function useTaskList(view: TaskView): TaskListState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [listsById, setListsById] = useState<Record<string, List>>({});
  const [loading, setLoading] = useState(true);
  const hiddenRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const [nextTasks, lists] = await Promise.all([queryTasks(view), listsRepo.getLists()]);
    const byId: Record<string, List> = {};
    for (const list of lists) byId[list.id] = list;
    setTasks(nextTasks.filter((t) => !hiddenRef.current.has(t.id)));
    setListsById(byId);
    setLoading(false);
  }, [view]);

  const hide = useCallback((id: string) => {
    hiddenRef.current.add(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const unhide = useCallback(
    (id: string) => {
      hiddenRef.current.delete(id);
      refresh().catch((error) => console.error('[DailyFlow] Failed to restore task:', error));
    },
    [refresh]
  );

  const forget = useCallback((id: string) => {
    hiddenRef.current.delete(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      refresh().catch((error) => {
        if (active) console.error('[DailyFlow] Failed to load tasks:', error);
      });
      return () => {
        active = false;
      };
    }, [refresh])
  );

  return { tasks, listsById, loading, refresh, hide, unhide, forget };
}
