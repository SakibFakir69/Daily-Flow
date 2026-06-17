import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { TaskViewScreen } from '@/components/task-view-screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import { formatHeaderDate, startOfTodayMs } from '@/lib/dates';
import { openSearch, openSettings } from '@/lib/navigation';

/**
 * Today: overdue + due-today tasks aggregated across all lists. Quick-added
 * tasks with no parsed date default to today so they appear here.
 */
export default function TodayScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <TaskViewScreen
      view="today"
      title={t('today.title')}
      subtitle={formatHeaderDate()}
      defaultDueAt={startOfTodayMs()}
      quickAddPlaceholder={t('today.quickadd')}
      emptyIcon="sunny-outline"
      emptyTitle={t('today.empty.title')}
      emptySubtitle={t('today.empty.subtitle')}
      headerRight={
        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
          <Pressable onPress={openSearch} hitSlop={8} accessibilityLabel="Search">
            <Ionicons name="search" size={22} color={theme.text} />
          </Pressable>
          <Pressable onPress={openSettings} hitSlop={8} accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={22} color={theme.text} />
          </Pressable>
        </View>
      }
    />
  );
}
