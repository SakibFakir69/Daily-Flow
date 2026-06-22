import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdCard, maybeShowInterstitial, useAdsEnabled } from '@/ads';
import { EmptyState } from '@/components/empty-state';
import { QuickAddBar } from '@/components/quick-add-bar';
import { ScreenHeader } from '@/components/screen-header';
import { TaskList } from '@/components/task-list';
import { ThemedView } from '@/components/themed-view';
import { useUndo } from '@/components/undo-snackbar';
import { Spacing } from '@/constants/theme';
import { tasksRepo, type Task } from '@/db';
import { useTaskList, type TaskView } from '@/hooks/use-task-list';
import { startOfTomorrowMs } from '@/lib/dates';
import { hapticComplete } from '@/lib/haptics';
import { openTask } from '@/lib/navigation';
import { resyncAllReminders } from '@/notifications';
import { refreshTodayWidget } from '@/widgets';

interface Props {
  view: TaskView;
  title: string;
  subtitle?: string;
  /** Due date applied to quick-added tasks with no parsed date. */
  defaultDueAt?: number | null;
  quickAddPlaceholder?: string;
  emptyIcon: keyof typeof Ionicons.glyphMap;
  emptyTitle: string;
  emptySubtitle?: string;
  /** Optional trailing header controls (search / settings). */
  headerRight?: ReactNode;
}

/**
 * Shared scaffold for Today / Upcoming / All: header, swipeable task list with
 * empty state, and the always-visible quick-add bar. Destructive actions are
 * optimistic — the row hides immediately and the DB write is deferred behind a
 * 4s undo window (see {@link useUndo}).
 */
export function TaskViewScreen({
  view,
  title,
  subtitle,
  defaultDueAt = null,
  quickAddPlaceholder,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
  headerRight,
}: Props) {
  const insets = useSafeAreaInsets();
  const { tasks, listsById, refresh, hide, unhide, forget } = useTaskList(view);
  const { run } = useUndo();
  const adsEnabled = useAdsEnabled();

  const handleToggleComplete = useCallback(
    (task: Task) => {
      if (task.completedAt === null) {
        // Completing is destructive-ish (row leaves the view) → undoable.
        hapticComplete();
        hide(task.id);
        run({
          message: 'Task completed',
          onCommit: async () => {
            // Completes and, for recurring tasks, inserts the next instance.
            await tasksRepo.completeTaskAndRegenerate(task.id);
            forget(task.id);
            await refresh();
            await resyncAllReminders();
            await refreshTodayWidget();
            // Completing a task is the natural break point for a capped
            // interstitial — the manager enforces the frequency caps.
            maybeShowInterstitial(adsEnabled);
          },
          onUndo: () => unhide(task.id),
        });
      } else {
        // Un-completing is non-destructive — apply immediately.
        tasksRepo
          .setTaskCompleted(task.id, false)
          .then(refresh)
          .catch((error) => console.error('[DailyFlow] Failed to update task:', error));
      }
    },
    [hide, unhide, forget, run, refresh, adsEnabled]
  );

  const handleDelete = useCallback(
    (task: Task) => {
      hide(task.id);
      run({
        message: 'Task deleted',
        onCommit: async () => {
          await tasksRepo.deleteTask(task.id);
          forget(task.id);
          await resyncAllReminders();
          await refreshTodayWidget();
        },
        onUndo: () => unhide(task.id),
      });
    },
    [hide, unhide, forget, run]
  );

  const handleReschedule = useCallback(
    (task: Task) => {
      const dueAt = startOfTomorrowMs();
      hide(task.id);
      run({
        message: 'Rescheduled to tomorrow',
        onCommit: async () => {
          await tasksRepo.updateTask(task.id, { dueAt });
          forget(task.id);
          await resyncAllReminders();
          await refreshTodayWidget();
        },
        onUndo: () => unhide(task.id),
      });
    },
    [hide, unhide, forget, run]
  );

  return (
    <ThemedView style={styles.container}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={title} subtitle={subtitle} rightAction={headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}  
        keyboardVerticalOffset={insets.top}  
      >

        <TaskList
          tasks={tasks}
          listsById={listsById}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDelete}
          onReschedule={handleReschedule}
          onPressTask={(task) => openTask(task.id)}
          empty={<EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptySubtitle} />}
        />
        {adsEnabled ? <AdCard /> : null}
        <QuickAddBar
          onAdded={refresh}
          defaultDueAt={defaultDueAt}
          placeholder={quickAddPlaceholder}
        />
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
