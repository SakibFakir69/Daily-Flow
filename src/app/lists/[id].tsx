import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DraggableTaskList } from '@/components/draggable-task-list';
import { EmptyState } from '@/components/empty-state';
import { ListEditorModal } from '@/components/list-editor-modal';
import { QuickAddBar } from '@/components/quick-add-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listsRepo, tasksRepo, type List, type Task } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { openTask } from '@/lib/navigation';
import { resyncAllReminders } from '@/notifications';
import { refreshTodayWidget } from '@/widgets';

export default function ListDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [list, setList] = useState<List | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    const [nextList, nextTasks] = await Promise.all([
      listsRepo.getListById(id),
      tasksRepo.getTasksByList(id),
    ]);
    setList(nextList);
    setTasks(nextTasks);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      refresh().catch((error) => console.error('[DailyFlow] Failed to load list:', error));
    }, [refresh])
  );

  const handleToggleComplete = useCallback(
    async (task: Task) => {
      if (task.completedAt === null) {
        await tasksRepo.completeTaskAndRegenerate(task.id);
      } else {
        await tasksRepo.setTaskCompleted(task.id, false);
      }
      await refresh();
      resyncAllReminders().catch(() => {});
      refreshTodayWidget();
    },
    [refresh]
  );

  const handleReorder = useCallback((orderedIds: string[]) => {
    // The draggable list already reflects the new order visually; just persist.
    tasksRepo.applyTaskOrder(orderedIds).catch((error) =>
      console.error('[DailyFlow] Failed to persist order:', error)
    );
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <View style={styles.titleWrap}>
          {list?.color ? <View style={[styles.dot, { backgroundColor: list.color }]} /> : null}
          <ThemedText type="subtitle" numberOfLines={1}>
            {list?.name ?? 'List'}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => setEditorVisible(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit list"
          accessibilityState={{ disabled: !list }}
          disabled={!list}>
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.tabInactive} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height' }
        keyboardVerticalOffset={insets.top}>
        {tasks.length === 0 ? (
          <EmptyState
            icon="add-circle-outline"
            title="This list is empty."
            subtitle="Add your first task below."
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <DraggableTaskList
              tasks={tasks}
              onReorder={handleReorder}
              onToggleComplete={handleToggleComplete}
              onPressTask={(task) => openTask(task.id)}
            />
          </ScrollView>
        )}

        <QuickAddBar onAdded={refresh} defaultListId={id ?? null} placeholder="Add to this list…" />
      </KeyboardAvoidingView>

      <ListEditorModal
        visible={editorVisible}
        list={list}
        onClose={() => setEditorVisible(false)}
        onSaved={() => {
          refresh();
          // If the list was deleted, return to the browser.
          listsRepo.getListById(id ?? '').then((l) => {
            if (!l) router.back();
          });
        }}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: BottomTabInset + Spacing.four,
  },
});
