import { useCallback, type ReactElement } from 'react';
import { FlatList, type ListRenderItem, StyleSheet } from 'react-native';

import { SwipeableTaskRow } from '@/components/swipeable-task-row';
import { BottomTabInset, Spacing } from '@/constants/theme';
import type { List, Task } from '@/db';

interface Props {
  tasks: Task[];
  listsById: Record<string, List>;
  onToggleComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
  onReschedule: (task: Task) => void;
  onPressTask?: (task: Task) => void;
  /** Shown when there are no tasks. */
  empty: ReactElement;
}

/** Scrollable list of swipeable task rows with an encouraging empty state. */
export function TaskList({
  tasks,
  listsById,
  onToggleComplete,
  onDelete,
  onReschedule,
  onPressTask,
  empty,
}: Props) {
  const renderItem = useCallback<ListRenderItem<Task>>(
    ({ item }) => (
      <SwipeableTaskRow
        task={item}
        list={item.listId ? listsById[item.listId] : undefined}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        onReschedule={onReschedule}
        onPress={onPressTask}
      />
    ),
    [listsById, onToggleComplete, onDelete, onReschedule, onPressTask]
  );

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={empty}
      // Row spacing is handled by `gap` in the content container.
      contentContainerStyle={tasks.length === 0 ? styles.emptyContent : styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.two,
  },
  emptyContent: {
    flexGrow: 1,
    paddingBottom: BottomTabInset,
  },
});
