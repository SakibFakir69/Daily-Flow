import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { tasksRepo } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { parseQuickAdd } from '@/lib/quick-parse';
import { resyncAllReminders } from '@/notifications';

interface Props {
  /** Called after a task is created so the screen can refetch. */
  onAdded: () => void;
  /** Due date applied when the text contains no date (e.g. Today screen → today). */
  defaultDueAt?: number | null;
  /** List the new task belongs to (e.g. when adding from a list detail screen). */
  defaultListId?: string | null;
  placeholder?: string;
}

/**
 * Always-visible capture bar. Type → Enter creates the task and keeps the
 * keyboard open (`submitBehavior="submit"`) so several tasks can be added in a
 * row — the core "capture in under 3 seconds" interaction.
 */
export function QuickAddBar({
  onAdded,
  defaultDueAt = null,
  defaultListId = null,
  placeholder = 'Add a task…',
}: Props) {
  const theme = useTheme();
  const [value, setValue] = useState('');

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const parsed = parseQuickAdd(trimmed);
    setValue(''); // clear immediately so the next task can be typed without lag

    try {
      await tasksRepo.createTask({
        title: parsed.title,
        listId: defaultListId,
        dueAt: parsed.dueAt ?? defaultDueAt,
        recurrenceRule: parsed.recurrenceRule,
        priority: parsed.priority,
      });
      onAdded();
      // Schedule any reminder the new task implies (fire-and-forget).
      resyncAllReminders().catch(() => {});
    } catch (error) {
      console.error('[DailyFlow] Failed to create task:', error);
    }
  };

  const canSubmit = value.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
      <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="add" size={22} color={theme.tabInactive} />
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={submit}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={theme.tabInactive}
          style={[styles.input, { color: theme.text }]}
          accessibilityLabel="Add a task"
        />
        {canSubmit ? (
          <Pressable
            onPress={submit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Save task"
            style={[styles.sendButton, { backgroundColor: theme.tint }]}>
            <Ionicons name="arrow-up" size={18} color={theme.background} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
