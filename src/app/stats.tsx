import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useStats } from '@/hooks/use-stats';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import type { TranslationKey } from '@/i18n/translations';

export default function StatsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { stats } = useStats();

  const cards: { key: string; labelKey: TranslationKey; value: number; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'ct', labelKey: 'stats.completedToday', value: stats.completedToday, icon: 'checkmark-circle-outline' },
    { key: 'cw', labelKey: 'stats.completedWeek', value: stats.completedWeek, icon: 'calendar-outline' },
    { key: 'ft', labelKey: 'stats.focusToday', value: stats.focusToday, icon: 'timer-outline' },
    { key: 'fw', labelKey: 'stats.focusWeek', value: stats.focusWeek, icon: 'time-outline' },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('common.done')}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <ScreenHeader title={t('stats.title')} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {cards.map((card) => (
            <View
              key={card.key}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name={card.icon} size={22} color={theme.tint} />
              <ThemedText style={styles.cardValue}>{card.value}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                {t(card.labelKey)}
              </ThemedText>
            </View>
          ))}
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          {t('stats.streaks')}
        </ThemedText>

        {stats.streaks.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyStreaks}>
            {t('stats.streaks.empty')}
          </ThemedText>
        ) : (
          stats.streaks.map((habit) => (
            <View
              key={habit.id}
              style={[styles.streakRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="flame" size={18} color={theme.tint} />
              <ThemedText type="default" style={styles.streakTitle} numberOfLines={1}>
                {habit.title}
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: theme.tint }}>
                {habit.streakCount}
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.two,
    marginLeft: Spacing.one,
  },
  emptyStreaks: {
    marginLeft: Spacing.one,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  streakTitle: { flex: 1 },
});
