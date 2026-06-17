import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from 'react-native';

import { TaskViewScreen } from '@/components/task-view-screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import { openSearch } from '@/lib/navigation';

/** All: every top-level task regardless of date or list. No default due date. */
export default function AllScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <TaskViewScreen
      view="all"
      title={t('all.title')}
      quickAddPlaceholder={t('all.quickadd')}
      emptyIcon="checkmark-done-outline"
      emptyTitle={t('all.empty.title')}
      emptySubtitle={t('all.empty.subtitle')}
      headerRight={
        <Pressable onPress={openSearch} hitSlop={8} accessibilityLabel="Search">
          <Ionicons name="search" size={22} color={theme.text} />
        </Pressable>
      }
    />
  );
}
