import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ListEditorModal } from '@/components/list-editor-modal';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import type { List } from '@/db';
import { useLists } from '@/hooks/use-lists';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import { openList } from '@/lib/navigation';

export default function ListsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { lists, counts, refresh } = useLists();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<List | null>(null);

  const openCreate = () => {
    setEditing(null);
    setEditorVisible(true);
  };
  const openEdit = (list: List) => {
    setEditing(list);
    setEditorVisible(true);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView >
        <View style={[styles.headerRow, { paddingTop: insets.top }]}>


          <View style={{ flex: 1 }}>
            <ScreenHeader title={t('lists.title')} />
          </View>
          <Pressable
            onPress={openCreate}
            hitSlop={8}
            style={[styles.addButton, { backgroundColor: theme.tint }]}
            accessibilityRole="button"
            accessibilityLabel="New list">
            <Ionicons name="add" size={22} color={theme.background} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {lists.length === 0 ? (
            <EmptyState
              icon="folder-open-outline"
              title={t('lists.empty.title')}
              subtitle={t('lists.empty.subtitle')}
            />
          ) : (
            lists.map((list) => (
              <Pressable
                key={list.id}
                onPress={() => openList(list.id)}
                onLongPress={() => openEdit(list)}
                style={[styles.listRow, { backgroundColor: theme.card, borderColor: theme.border }]}
                accessibilityRole="button"
                accessibilityLabel={list.name}>
                <View style={[styles.iconWrap, { backgroundColor: list.color ?? theme.tabInactive }]}>
                  <Ionicons
                    name={(list.icon as keyof typeof Ionicons.glyphMap) ?? 'list'}
                    size={18}
                    color={theme.background}
                  />
                </View>
                <ThemedText type="default" style={styles.listName} numberOfLines={1}>
                  {list.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {counts[list.id] ?? 0}
                </ThemedText>
                <Pressable
                  onPress={() => openEdit(list)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${list.name}`}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={theme.tabInactive} />
                </Pressable>
              </Pressable>
            ))
          )}
        </ScrollView>

        <ListEditorModal
          visible={editorVisible}
          list={editing}
          onClose={() => setEditorVisible(false)}
          onSaved={refresh}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
    flexGrow: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listName: {
    flex: 1,
  },
});