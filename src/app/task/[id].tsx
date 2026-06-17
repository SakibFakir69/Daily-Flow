import Ionicons from '@expo/vector-icons/Ionicons';
import { addDays, isSameDay, startOfDay } from 'date-fns';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { Priority, tasksRepo, type Task } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import { startOfTodayMs, startOfTomorrowMs } from '@/lib/dates';
import { openPomodoro } from '@/lib/navigation';
import { parseRecurrence } from '@/lib/recurrence';
import { resyncAllReminders } from '@/notifications';

const PRIORITIES: Priority[] = [Priority.None, Priority.Medium, Priority.High];

function describeRecurrence(rule: string): string {
  const parsed = parseRecurrence(rule);
  if (!parsed) return rule;
  if (parsed.freq === 'DAILY') return 'Daily';
  if (parsed.freq === 'WEEKLY') return 'Weekly';
  return 'Monthly';
}

export default function TaskDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const [loaded, subs] = await Promise.all([
      tasksRepo.getTaskById(id),
      tasksRepo.getSubtasks(id),
    ]);
    setTask(loaded);
    setSubtasks(subs);
    if (loaded) {
      setTitle(loaded.title);
      setNotes(loaded.notes ?? '');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => console.error('[DailyFlow] Failed to load task:', error));
    }, [load])
  );

  const patch = useCallback(
    async (changes: Parameters<typeof tasksRepo.updateTask>[1], resync = false) => {
      if (!id) return;
      await tasksRepo.updateTask(id, changes);
      if (resync) resyncAllReminders().catch(() => {});
      await load();
    },
    [id, load]
  );

  const handleDueChip = (value: number | null) => {
    patch({ dueAt: value }, true).catch(() => {});
  };

  const addSubtask = async () => {
    const text = newSubtask.trim();
    if (!text || !id) return;
    setNewSubtask('');
    await tasksRepo.createTask({ title: text, parentTaskId: id });
    await load();
  };

  const toggleSubtask = async (sub: Task) => {
    await tasksRepo.setTaskCompleted(sub.id, sub.completedAt === null);
    await load();
  };

  const deleteSubtask = async (sub: Task) => {
    await tasksRepo.deleteTask(sub.id);
    await load();
  };

  const deleteTask = async () => {
    if (!id) return;
    await tasksRepo.deleteTask(id);
    resyncAllReminders().catch(() => {});
    router.back();
  };

  if (!task) {
    return <ThemedView style={styles.container} />;
  }

  const dueChips: { key: string; label: string; value: number | null }[] = [
    { key: 'today', label: t('due.today'), value: startOfTodayMs() },
    { key: 'tomorrow', label: t('due.tomorrow'), value: startOfTomorrowMs() },
    {
      key: 'nextweek',
      label: t('due.nextweek'),
      value: startOfDay(addDays(new Date(), 7)).getTime(),
    },
    { key: 'none', label: t('due.none'), value: null },
  ];

  const isChipActive = (value: number | null) => {
    if (value === null) return task.dueAt === null;
    return task.dueAt !== null && isSameDay(task.dueAt, value);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('common.done')}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Pressable onPress={deleteTask} hitSlop={8} accessibilityLabel={t('common.delete')}>
          <Ionicons name="trash-outline" size={22} color={theme.danger} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            onBlur={() => title.trim() && patch({ title: title.trim() })}
            style={[styles.titleInput, { color: theme.text }]}
            multiline
            placeholder={t('all.quickadd')}
            placeholderTextColor={theme.tabInactive}
          />

          {task.recurrenceRule ? (
            <View style={styles.repeatRow}>
              <Ionicons name="repeat" size={16} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                {t('task.repeats')}: {describeRecurrence(task.recurrenceRule)}
              </ThemedText>
            </View>
          ) : null}

          <Pressable
            onPress={() => openPomodoro(task.id)}
            style={[styles.focusButton, { backgroundColor: theme.backgroundElement }]}
            accessibilityRole="button">
            <Ionicons name="timer-outline" size={18} color={theme.tint} />
            <ThemedText type="smallBold" style={{ color: theme.tint }}>
              {t('task.focus')}
            </ThemedText>
          </Pressable>

          {/* Due date */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            {t('task.due')}
          </ThemedText>
          <View style={styles.chips}>
            {dueChips.map((chip) => {
              const active = isChipActive(chip.value);
              return (
                <Pressable
                  key={chip.key}
                  onPress={() => handleDueChip(chip.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? theme.tint : theme.backgroundElement,
                      borderColor: active ? theme.tint : theme.border,
                    },
                  ]}>
                  <ThemedText type="small" style={{ color: active ? theme.background : theme.text }}>
                    {chip.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Priority */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            {t('task.priority')}
          </ThemedText>
          <View style={styles.chips}>
            {PRIORITIES.map((p) => {
              const active = task.priority === p;
              const label =
                p === Priority.None
                  ? t('priority.none')
                  : p === Priority.Medium
                    ? t('priority.medium')
                    : t('priority.high');
              return (
                <Pressable
                  key={p}
                  onPress={() => patch({ priority: p })}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? theme.tint : theme.backgroundElement,
                      borderColor: active ? theme.tint : theme.border,
                    },
                  ]}>
                  <ThemedText type="small" style={{ color: active ? theme.background : theme.text }}>
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Notes */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            {t('task.notes')}
          </ThemedText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onBlur={() => patch({ notes: notes.trim() || null })}
            style={[styles.notesInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            multiline
            placeholder={t('task.notes.placeholder')}
            placeholderTextColor={theme.tabInactive}
          />

          {/* Subtasks */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            {t('task.subtasks')}
          </ThemedText>
          {subtasks.map((sub) => {
            const done = sub.completedAt !== null;
            return (
              <View key={sub.id} style={styles.subtaskRow}>
                <Pressable
                  onPress={() => toggleSubtask(sub)}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  style={[
                    styles.checkbox,
                    {
                      borderColor: done ? theme.tint : theme.border,
                      backgroundColor: done ? theme.tint : 'transparent',
                    },
                  ]}>
                  {done ? <Ionicons name="checkmark" size={14} color={theme.background} /> : null}
                </Pressable>
                <ThemedText
                  type="default"
                  style={[styles.subtaskTitle, done && styles.subtaskDone]}
                  themeColor={done ? 'textSecondary' : 'text'}>
                  {sub.title}
                </ThemedText>
                <Pressable onPress={() => deleteSubtask(sub)} hitSlop={8} accessibilityLabel={t('common.delete')}>
                  <Ionicons name="close" size={18} color={theme.tabInactive} />
                </Pressable>
              </View>
            );
          })}

          <View style={[styles.addSubtask, { borderColor: theme.border }]}>
            <Ionicons name="add" size={20} color={theme.tabInactive} />
            <TextInput
              value={newSubtask}
              onChangeText={setNewSubtask}
              onSubmitEditing={addSubtask}
              submitBehavior="submit"
              returnKeyType="done"
              placeholder={t('task.subtask.add')}
              placeholderTextColor={theme.tabInactive}
              style={[styles.subtaskInput, { color: theme.text }]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.two,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    paddingVertical: Spacing.two,
  },
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  focusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    marginTop: Spacing.one,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notesInput: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskTitle: {
    flex: 1,
  },
  subtaskDone: {
    textDecorationLine: 'line-through',
  },
  addSubtask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    marginTop: Spacing.one,
  },
  subtaskInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
});
