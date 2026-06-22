import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { PriorityDot } from '@/components/priority-dot';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Task } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { formatDueLabel } from '@/lib/dates';

export const DRAG_ROW_HEIGHT = 64;

/** Moves an element within a copy of `arr` (worklet-safe, no splice). */
function moveItem(arr: string[], from: number, to: number): string[] {
  'worklet';
  const copy = arr.slice();
  const item = copy[from];
  if (from < to) {
    for (let i = from; i < to; i++) copy[i] = copy[i + 1];
  } else {
    for (let i = from; i > to; i--) copy[i] = copy[i - 1];
  }
  copy[to] = item;
  return copy;
}

interface Props {
  tasks: Task[];
  onReorder: (orderedIds: string[]) => void;
  onToggleComplete: (task: Task) => void;
  onPressTask?: (task: Task) => void;
}

/**
 * A reorderable, non-virtualized list. Rows are absolutely positioned by their
 * index in a shared `order` array; dragging a row's handle rewrites that order
 * each frame and animates the others into place. Intended for the modest
 * per-list task counts in a list detail view (host inside a ScrollView).
 *
 * NOTE: this is gesture/animation-heavy and could not be runtime-tested in this
 * session — it's the piece most worth exercising on a device.
 */
export function DraggableTaskList({ tasks, onReorder, onToggleComplete, onPressTask }: Props) {
  const order = useSharedValue<string[]>(tasks.map((t) => t.id));
  const activeId = useSharedValue<string | null>(null);
  const activeY = useSharedValue(0);

  // Keep the shared order in sync when the task set changes (add/delete/refetch).
  useEffect(() => {
    order.value = tasks.map((t) => t.id);
  }, [tasks, order]);

  return (
    <View style={{ height: tasks.length * DRAG_ROW_HEIGHT }}>
      {tasks.map((task) => (
        <DraggableRow
          key={task.id}
          task={task}
          count={tasks.length}
          order={order}
          activeId={activeId}
          activeY={activeY}
          onReorder={onReorder}
          onToggleComplete={onToggleComplete}
          onPressTask={onPressTask}
        />
      ))}
    </View>
  );
}

interface RowProps {
  task: Task;
  count: number;
  order: SharedValue<string[]>;
  activeId: SharedValue<string | null>;
  activeY: SharedValue<number>;
  onReorder: (orderedIds: string[]) => void;
  onToggleComplete: (task: Task) => void;
  onPressTask?: (task: Task) => void;
}

function DraggableRow({
  task,
  count,
  order,
  activeId,
  activeY,
  onReorder,
  onToggleComplete,
  onPressTask,
}: RowProps) {
  const theme = useTheme();
  const id = task.id;
  const completed = task.completedAt !== null;

  const panGesture = Gesture.Pan()
    .onStart(() => {
      activeId.value = id;
      const index = order.value.indexOf(id);
      activeY.value = index * DRAG_ROW_HEIGHT;
    })
    .onUpdate((event) => {
      const index = order.value.indexOf(id);
      activeY.value = index * DRAG_ROW_HEIGHT + event.translationY;
      let target = Math.round(activeY.value / DRAG_ROW_HEIGHT);
      if (target < 0) target = 0;
      if (target > count - 1) target = count - 1;
      if (target !== index) {
        order.value = moveItem(order.value, index, target);
      }
    })
    .onEnd(() => {
      runOnJS(onReorder)(order.value.slice());
    })
    .onFinalize(() => {
      activeId.value = null;
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeId.value === id;
    const index = order.value.indexOf(id);
    return {
      top: isActive
        ? activeY.value
        : withSpring(index * DRAG_ROW_HEIGHT, { damping: 20, stiffness: 200 }),
      zIndex: isActive ? 10 : 0,
      transform: [{ scale: withSpring(isActive ? 1.03 : 1) }],
    };
  });

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      <View
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Pressable
          onPress={() => onToggleComplete(task)}
          hitSlop={8}
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

        <Pressable
          style={styles.body}
          onPress={() => onPressTask?.(task)}
          accessibilityRole="button"
          accessibilityLabel={task.title}>
          <ThemedText
            type="default"
            numberOfLines={1}
            themeColor={completed ? 'textSecondary' : 'text'}
            style={completed ? styles.completed : undefined}>
            {task.title}
          </ThemedText>
          {(task.dueAt !== null || task.priority !== 0) && (
            <View style={styles.meta}>
              <PriorityDot priority={task.priority} />
              {task.dueAt !== null ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {formatDueLabel(task.dueAt)}
                </ThemedText>
              ) : null}
            </View>
          )}
        </Pressable>

        <GestureDetector gesture={panGesture}>
          <View style={styles.handle} accessibilityLabel="Drag to reorder">
            <Ionicons name="reorder-three" size={24} color={theme.tabInactive} />
          </View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: DRAG_ROW_HEIGHT,
    paddingVertical: Spacing.one,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
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
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  completed: {
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  handle: {
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.two,
  },
});
