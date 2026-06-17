import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PriorityDot } from '@/components/priority-dot';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { List, Task } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { formatDueLabel, isOverdue } from '@/lib/dates';

interface Props {
  task: Task;
  list?: List;
  onToggleComplete: (task: Task) => void;
  onPress?: (task: Task) => void;
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

/**
 * A single task card. The checkbox toggles completion (animations + swipe land
 * in Milestone 3); the row body is pressable for the future detail screen.
 */
function TaskRowComponent({ task, list, onToggleComplete, onPress }: Props) {
  const theme = useTheme();
  const completed = task.completedAt !== null;
  const overdue = task.dueAt !== null && !completed && isOverdue(task.dueAt);

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
      accessibilityRole="button"
      accessibilityLabel={task.title}>
      <Pressable
        onPress={() => onToggleComplete(task)}
        hitSlop={HIT_SLOP}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={completed ? 'Mark task incomplete' : 'Mark task complete'}
        style={[
          styles.checkbox,
          {
            borderColor: completed ? theme.tint : theme.border,
            backgroundColor: completed ? theme.tint : 'transparent',
          },
        ]}>
        {completed ? <Ionicons name="checkmark" size={16} color={theme.background} /> : null}
      </Pressable>

      <View style={styles.body}>
        <ThemedText
          type="default"
          numberOfLines={2}
          themeColor={completed ? 'textSecondary' : 'text'}
          style={completed ? styles.completedTitle : undefined}>
          {task.title}
        </ThemedText>

        {(task.dueAt !== null || task.recurrenceRule || task.priority !== 0 || list) && (
          <View style={styles.meta}>
            <PriorityDot priority={task.priority} />
            {task.dueAt !== null ? (
              <ThemedText
                type="small"
                themeColor={overdue ? undefined : 'textSecondary'}
                style={overdue ? { color: theme.danger } : undefined}>
                {formatDueLabel(task.dueAt)}
              </ThemedText>
            ) : null}
            {task.recurrenceRule ? (
              <Ionicons name="repeat" size={14} color={theme.textSecondary} />
            ) : null}
            {list ? (
              <View style={styles.listTag}>
                <View
                  style={[
                    styles.listDot,
                    { backgroundColor: list.color ?? theme.tabInactive },
                  ]}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  {list.name}
                </ThemedText>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export const TaskRow = memo(TaskRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.half,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  listTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
});
