import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { TaskRow } from '@/components/task-row';
import { Radius, Spacing } from '@/constants/theme';
import type { List, Task } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { hapticDelete, hapticSelection } from '@/lib/haptics';

interface Props {
  task: Task;
  list?: List;
  /** Checkbox tap and full swipe-right both route here. */
  onToggleComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
  onReschedule: (task: Task) => void;
  onPress?: (task: Task) => void;
}

/**
 * Wraps a {@link TaskRow} with gesture actions:
 *  - swipe right → complete (green check + light haptic)
 *  - swipe left  → reveal Reschedule + Delete buttons
 * The whole row fades/relayouts out via Reanimated when it leaves the list.
 */
export function SwipeableTaskRow({
  task,
  list,
  onToggleComplete,
  onDelete,
  onReschedule,
  onPress,
}: Props) {
  const theme = useTheme();
  const swipeRef = useRef<SwipeableMethods>(null);

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    // Swiping the row to the right opens the LEFT action panel.
    // The haptic for completion fires in the screen's toggle handler (shared
    // with the checkbox tap), so we don't double-buzz here.
    if (direction === 'left' && task.completedAt === null) {
      swipeRef.current?.close();
      onToggleComplete(task);
    }
  };

  const handleDelete = () => {
    hapticDelete();
    swipeRef.current?.close();
    onDelete(task);
  };

  const handleReschedule = () => {
    hapticSelection();
    swipeRef.current?.close();
    onReschedule(task);
  };

  const renderLeftActions = () => (
    <View style={[styles.leftAction, { backgroundColor: theme.tint }]}>
      <Ionicons name="checkmark" size={26} color={theme.background} />
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <Pressable
        onPress={handleReschedule}
        style={[styles.actionButton, { backgroundColor: theme.tabInactive }]}
        accessibilityRole="button"
        accessibilityLabel="Reschedule to tomorrow">
        <Ionicons name="time-outline" size={22} color={theme.background} />
      </Pressable>
      <Pressable
        onPress={handleDelete}
        style={[styles.actionButton, { backgroundColor: theme.danger }]}
        accessibilityRole="button"
        accessibilityLabel="Delete task">
        <Ionicons name="trash-outline" size={22} color={theme.background} />
      </Pressable>
    </View>
  );

  return (
    <Animated.View exiting={FadeOut.duration(220)} layout={LinearTransition.springify().damping(18)}>
      <ReanimatedSwipeable
        ref={swipeRef}
        friction={2}
        leftThreshold={48}
        rightThreshold={40}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={handleSwipeComplete}>
        <TaskRow task={task} list={list} onToggleComplete={onToggleComplete} onPress={onPress} />
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  leftAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.four,
    borderRadius: Radius.md,
    marginRight: Spacing.two,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.two,
    marginLeft: Spacing.two,
  },
  actionButton: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
});
