/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    backgroundElement: '#F4F5F7',
    backgroundSelected: '#E9EBEF',
    textSecondary: '#60646C',
    /** Warm coral accent — energetic, non-corporate. */
    tint: '#FF6B4A',
    /** Subtle hairline border / dividers. */
    border: '#E4E6EB',
    /** Card surface (task rows, native ad cards). */
    card: '#FFFFFF',
    /** Destructive actions (delete). */
    danger: '#FF3B30',
    /** Inactive tab/icon tint. */
    tabInactive: '#9BA1A6',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0E0F11',
    backgroundElement: '#1B1D1F',
    backgroundSelected: '#26292C',
    textSecondary: '#9BA1A6',
    tint: '#FF7A5C',
    border: '#2A2D30',
    card: '#17191B',
    danger: '#FF453A',
    tabInactive: '#6B7075',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Priority dot colors (priority 0 = none renders no dot).
 * Index by `Priority` enum value.
 */
export const PriorityColors = {
  light: { 1: '#F5A623', 2: '#FF3B30' },
  dark: { 1: '#FFB340', 2: '#FF453A' },
} as const;

/** Corner radii — soft, rounded (12–16px) per the design direction. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
