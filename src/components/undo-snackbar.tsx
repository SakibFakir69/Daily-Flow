import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** How long the undo window stays open before the action is committed. */
const UNDO_DURATION_MS = 4000;

export interface UndoableAction {
  /** Short message shown in the snackbar, e.g. "Task deleted". */
  message: string;
  /** Performs the real (destructive) effect — runs only if not undone. */
  onCommit: () => void | Promise<void>;
  /** Reverts the optimistic UI change when the user taps Undo. */
  onUndo: () => void;
}

interface UndoContextValue {
  /**
   * Optimistically run an undoable action: the caller has already updated the
   * UI; we hold the commit for {@link UNDO_DURATION_MS}. Calling again first
   * flushes (commits) any still-pending action.
   */
  run: (action: UndoableAction) => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

export function useUndo(): UndoContextValue {
  const ctx = useContext(UndoContext);
  if (!ctx) throw new Error('useUndo must be used within <UndoProvider>');
  return ctx;
}

export function UndoProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState<UndoableAction | null>(null);
  const pendingRef = useRef<UndoableAction | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Commit the pending action's real effect (if any) and forget it. */
  const commit = useCallback(() => {
    const action = pendingRef.current;
    pendingRef.current = null;
    if (action) {
      Promise.resolve(action.onCommit()).catch((error) =>
        console.error('[DailyFlow] Undoable action failed to commit:', error)
      );
    }
  }, []);

  const run = useCallback(
    (action: UndoableAction) => {
      // A new action arriving means the previous one is no longer undoable.
      clearTimer();
      commit();
      pendingRef.current = action;
      setVisible(action);
      timerRef.current = setTimeout(() => {
        commit();
        setVisible(null);
      }, UNDO_DURATION_MS);
    },
    [clearTimer, commit]
  );

  const handleUndo = useCallback(() => {
    clearTimer();
    const action = pendingRef.current;
    pendingRef.current = null;
    setVisible(null);
    action?.onUndo();
  }, [clearTimer]);

  // On unmount, flush any pending commit so an in-flight action isn't lost.
  useEffect(() => () => {
    clearTimer();
    commit();
  }, [clearTimer, commit]);

  return (
    <UndoContext.Provider value={{ run }}>
      {children}
      {visible ? <Snackbar action={visible} onUndo={handleUndo} /> : null}
    </UndoContext.Provider>
  );
}

function Snackbar({ action, onUndo }: { action: UndoableAction; onUndo: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18)}
      exiting={SlideOutDown}
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { bottom: BottomTabInset + insets.bottom + Spacing.two },
      ]}>
      <View style={[styles.snackbar, { backgroundColor: theme.text }]}>
        <ThemedText type="small" style={[styles.message, { color: theme.background }]}>
          {action.message}
        </ThemedText>
        <Pressable
          onPress={onUndo}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Undo">
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            UNDO
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    gap: Spacing.three,
  },
  message: {
    flex: 1,
  },
});
