import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, Tabs, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initializeAds, useAdsEnabled } from '@/ads';
import { OnboardingOverlay } from '@/components/onboarding/onboarding-overlay';
import { UndoProvider } from '@/components/undo-snackbar';
import { useDatabaseReady } from '@/hooks/use-database';
import { useNotifications } from '@/hooks/use-notifications';
import { useTheme, useThemeMode } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n/use-translation';
import { SettingsProvider, useSettings } from '@/settings/settings-context';

/** Runs the notification lifecycle (resync + action handling) once the DB is ready. */
function NotificationsBridge() {
  useNotifications();
  return null;
}

/**
 * Shows the first-run motion overview until it's completed. Gated on `loaded`
 * so the persisted flag — not the optimistic defaults — decides, avoiding a
 * one-frame flash of onboarding for returning users.
 */
function OnboardingGate() {
  const { settings, loaded, update } = useSettings();
  if (!loaded || settings.onboardingCompletedAt !== null) return null;
  return <OnboardingOverlay onDone={() => update({ onboardingCompletedAt: Date.now() })} />;
}
/** Initializes the ads SDK once, only for the free tier (no-op once purchased). */
function AdsBridge() {
  const adsEnabled = useAdsEnabled();
  useEffect(() => {
    if (adsEnabled) initializeAds();
  }, [adsEnabled]);
  return null;
}

/** The themed navigator. Lives under SettingsProvider so theme + language apply. */
function AppShell() {
  const mode = useThemeMode();
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <UndoProvider>
        <NotificationsBridge />
        <AdsBridge />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.tint,
            tabBarInactiveTintColor: colors.tabInactive,
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: t('tab.today'),
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="today-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="upcoming"
            options={{
              title: t('tab.upcoming'),
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="calendar-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="all"
            options={{
              title: t('tab.all'),
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="list-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="lists"
            options={{
              title: t('tab.lists'),
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="folder-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="habits"
            options={{
              title: t('tab.habits'),
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="flame-outline" color={color} size={size} />
              ),
            }}
          />
          {/* Routes reachable via navigation, not shown as tabs. */}
          <Tabs.Screen name="search" options={{ href: null }} />
          <Tabs.Screen name="settings" options={{ href: null }} />
          <Tabs.Screen name="task" options={{ href: null }} />
          <Tabs.Screen name="pomodoro" options={{ href: null }} />
          <Tabs.Screen name="stats" options={{ href: null }} />
          <Tabs.Screen name="explore" options={{ href: null }} />
        </Tabs>
        <OnboardingGate />
      </UndoProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const dbStatus = useDatabaseReady();

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Gate everything on DB readiness so no screen (or settings load) runs
          before migrations. The native splash covers this brief window. */}
      {dbStatus === 'ready' ? (
        <SettingsProvider>
          <AppShell />
        </SettingsProvider>
      ) : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
