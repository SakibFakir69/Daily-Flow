import { TaskViewScreen } from '@/components/task-view-screen';
import { useTranslation } from '@/i18n/use-translation';
import { startOfTomorrowMs } from '@/lib/dates';

/** Upcoming: incomplete tasks due tomorrow onward. New tasks default to tomorrow. */
export default function UpcomingScreen() {
  const { t } = useTranslation();
  return (
    <TaskViewScreen
      view="upcoming"
      title={t('upcoming.title')}
      defaultDueAt={startOfTomorrowMs()}
      quickAddPlaceholder={t('upcoming.quickadd')}
      emptyIcon="calendar-outline"
      emptyTitle={t('upcoming.empty.title')}
      emptySubtitle={t('upcoming.empty.subtitle')}
    />
  );
}
