/**
 * Theme resolution. Combines the user's saved preference (system/light/dark)
 * with the device color scheme so the in-app Dark Mode toggle can override
 * the OS. Learn more: https://docs.expo.dev/guides/color-schemes/
 */
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useSettings } from '@/settings/settings-context';

export type ThemeMode = 'light' | 'dark';

/** Resolves the active light/dark mode from preference + device scheme. */
export function useThemeMode(): ThemeMode {
  const { settings } = useSettings();
  const device = useColorScheme();
  const deviceMode: ThemeMode = device === 'dark' ? 'dark' : 'light';

  if (settings.theme === 'light') return 'light';
  if (settings.theme === 'dark') return 'dark';
  return deviceMode; // 'system'
}

/** The color palette for the active theme mode. */
export function useTheme() {
  return Colors[useThemeMode()];
}
