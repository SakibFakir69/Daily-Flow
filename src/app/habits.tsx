import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { habitsRepo, type Habit } from '@/db';
import { useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import { hapticComplete, hapticSelection } from '@/lib/haptics';
import { openStats } from '@/lib/navigation';

export default function HabitsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { habits, refresh } = useHabits();
  const [newHabit, setNewHabit] = useState('');

  const addHabit = async () => {
    const title = newHabit.trim();
    if (!title) return;
    setNewHabit('');
    await habitsRepo.createHabit({ title });
    await refresh();
  };

  const toggle = async (habit: Habit) => {
    const wasChecked = habitsRepo.isCheckedToday(habit);
    if (!wasChecked) hapticComplete();
    else hapticSelection();
    await habitsRepo.toggleHabitToday(habit);
    await refresh();
  };

  const confirmDelete = (habit: Habit) => {
    Alert.alert(t('habits.delete.title'), t('habits.delete.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await habitsRepo.deleteHabit(habit.id);
          await refresh();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title={t('habits.title')}
          rightAction={
            <Pressable onPress={openStats} hitSlop={8} accessibilityLabel={t('stats.title')}>
              <Ionicons name="stats-chart-outline" size={22} color={theme.text} />
            </Pressable>
          }
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + Spacing.three}>
        <ScrollView
          contentContainerStyle={habits.length === 0 ? styles.emptyContent : styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {habits.length === 0 ? (
            <EmptyState
              icon="flame-outline"
              title={t('habits.empty.title')}
              subtitle={t('habits.empty.subtitle')}
            />
          ) : (
            habits.map((habit) => {
              const checked = habitsRepo.isCheckedToday(habit);
              return (
                <Pressable
                  key={habit.id}
                  onPress={() => toggle(habit)}
                  onLongPress={() => confirmDelete(habit)}
                  style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: checked ? theme.tint : theme.border,
                        backgroundColor: checked ? theme.tint : 'transparent',
                      },
                    ]}>
                    {checked ? <Ionicons name="checkmark" size={16} color={theme.background} /> : null}
                  </View>
                  <ThemedText type="default" style={styles.title} numberOfLines={1}>
                    {habit.title}
                  </ThemedText>
                  <View style={styles.streak}>
                    <Ionicons
                      name="flame"
                      size={16}
                      color={habit.streakCount > 0 ? theme.tint : theme.tabInactive}
                    />
                    <ThemedText type="small" themeColor="textSecondary">
                      {habit.streakCount}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.addBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="add" size={22} color={theme.tabInactive} />
            <TextInput
              value={newHabit}
              onChangeText={setNewHabit}
              onSubmitEditing={addHabit}
              submitBehavior="submit"
              returnKeyType="done"
              placeholder={t('habits.add')}
              placeholderTextColor={theme.tabInactive}
              style={[styles.input, { color: theme.text }]}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.two,
  },
  emptyContent: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
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
  title: { flex: 1 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  addBar: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
});
