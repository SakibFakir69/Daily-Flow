import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { TaskRow } from '@/components/task-row';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { listsRepo, tasksRepo, type List, type Task } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import { openTask } from '@/lib/navigation';

export default function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);

  useEffect(() => {
    listsRepo.getLists().then(setLists).catch(() => {});
  }, []);

  // Debounce the query so we don't hit the DB on every keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      tasksRepo
        .searchTasks(trimmed)
        .then(setResults)
        .catch((error) => console.error('[DailyFlow] Search failed:', error));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  const listsById = useMemo(() => {
    const map: Record<string, List> = {};
    for (const l of lists) map[l.id] = l;
    return map;
  }, [lists]);

  const hasQuery = query.trim().length > 0;
  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchBar, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('common.cancel')}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="search" size={18} color={theme.tabInactive} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={theme.tabInactive}
            style={[styles.input, { color: theme.text }]}
            autoFocus
            returnKeyType="search"
            accessibilityLabel={t('search.placeholder')}
          />
          {hasQuery ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel={t('common.cancel')}>
              <Ionicons name="close-circle" size={18} color={theme.tabInactive} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            list={item.listId ? listsById[item.listId] : undefined}
            onToggleComplete={() => {}}
            onPress={() => openTask(item.id)}
          />
        )}
        contentContainerStyle={results.length === 0 ? styles.emptyContent : styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          hasQuery ? (
            <EmptyState
              icon="sad-outline"
              title={t('search.empty.title')}
              subtitle={t('search.empty.subtitle')}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title={t('search.prompt.title')}
              subtitle={t('search.prompt.subtitle')}
            />
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  emptyContent: {
    flexGrow: 1,
  },
});
