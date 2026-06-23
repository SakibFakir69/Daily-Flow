import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { pomodoroRepo, tasksRepo } from '@/db';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import { hapticComplete, hapticSelection } from '@/lib/haptics';

const DURATIONS = [25, 15, 5];

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function PomodoroScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();

  const [taskTitle, setTaskTitle] = useState<string | null>(null);
  const [durationMin, setDurationMin] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (taskId) {
      tasksRepo.getTaskById(taskId).then((task) => setTaskTitle(task?.title ?? null)).catch(() => {});
    }
  }, [taskId]);

  // Reset the clock when the duration changes while idle.
  useEffect(() => {
    if (!running) setSecondsLeft(durationMin * 60);
  }, [durationMin, running]);

  // Tick once per second while running.
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  // Natural completion.
  useEffect(() => {
    if (running && secondsLeft <= 0) {
      setRunning(false);
      hapticComplete();
      pomodoroRepo
        .recordSession({ taskId: taskId ?? null, duration: durationMin * 60 })
        .catch(() => {});
      setSecondsLeft(durationMin * 60);
    }
  }, [running, secondsLeft, durationMin, taskId]);

  const toggleRun = () => {
    hapticSelection();
    setRunning((r) => !r);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(durationMin * 60);
  };

  const finish = async () => {
    const elapsed = durationMin * 60 - Math.max(0, secondsLeft);
    setRunning(false);
    if (elapsed > 0) {
      await pomodoroRepo.recordSession({ taskId: taskId ?? null, duration: elapsed });
    }
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel={t('common.done')}>
          <Ionicons name="chevron-down" size={26} color={theme.text} />
        </Pressable>
        <ThemedText type="default">{t('pomodoro.title')}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        {taskTitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.taskTitle}>
            {taskTitle}
          </ThemedText>
        ) : null}

        <ThemedText style={[styles.clock, { color: theme.text }]}>{formatTime(secondsLeft)}</ThemedText>
        

        <View style={styles.durations}>
          {DURATIONS.map((min) => {
            const active = durationMin === min;
            return (
              <Pressable
                key={min}
                onPress={() => setDurationMin(min)}
                disabled={running}
                style={[
                  styles.durationChip,
                  {
                    backgroundColor: active ? theme.tint : theme.backgroundElement,
                    opacity: running && !active ? 0.4 : 1,
                  },
                ]}>
                <ThemedText type="small" style={{ color: active ? theme.background : theme.text }}>
                  {min}m
                  
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={reset}
            style={[styles.secondaryButton, { borderColor: theme.border }]}
            accessibilityLabel={t('pomodoro.reset')}>
            <Ionicons name="refresh" size={22} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={toggleRun}
            style={[styles.primaryButton, { backgroundColor: theme.tint }]}
            accessibilityLabel={running ? t('pomodoro.pause') : t('pomodoro.start')}>
            <Ionicons name={running ? 'pause' : 'play'} size={32} color={theme.background} />
          </Pressable>

          <Pressable
            onPress={finish}
            style={[styles.secondaryButton, { borderColor: theme.border }]}
            accessibilityLabel={t('pomodoro.finish')}>
            <Ionicons name="checkmark" size={22} color={theme.text} />
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerSpacer: { width: 26 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  taskTitle: {
    textAlign: 'center',
  },
  clock: {
    fontSize: 33,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
  },
  durations: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  durationChip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  primaryButton: {
    width: 72,
    height: 72,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
