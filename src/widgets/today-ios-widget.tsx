import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { TODAY_WIDGET_NAME } from './config';
import type { TodayWidgetData } from './widget-data';

/**
 * iOS WidgetKit "Today" widget, built with Expo UI SwiftUI components (SDK 56).
 *
 * The component runs inside the widget extension (the `'widget'` directive marks
 * it), so it cannot touch the DB — it only renders the serializable
 * {@link TodayWidgetData} pushed from the app via `todayWidget.updateSnapshot`
 * (see `update-widget.ios.ts`). This file is imported ONLY on iOS (through the
 * `.ios` platform split), so its `@expo/ui` / `expo-widgets` imports never reach
 * the Android or web bundles.
 *
 * The string passed to `createWidget` must match the `name` in the `expo-widgets`
 * config-plugin entry in app.json.
 */

interface WidgetPalette {
  text: string;
  textSecondary: string;
  tint: string;
  border: string;
  danger: string;
  priority1: string;
  priority2: string;
}

/** Flat hex palette mirroring `constants/theme`, resolved per color scheme. */
const PALETTE: Record<'light' | 'dark', WidgetPalette> = {
  light: {
    text: '#11181C',
    textSecondary: '#60646C',
    tint: '#FF6B4A',
    border: '#E4E6EB',
    danger: '#FF3B30',
    priority1: '#F5A623',
    priority2: '#FF3B30',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    tint: '#FF7A5C',
    border: '#2A2D30',
    danger: '#FF453A',
    priority1: '#FFB340',
    priority2: '#FF453A',
  },
};

function priorityColor(priority: number, c: WidgetPalette): string {
  if (priority === 1) return c.priority1;
  if (priority === 2) return c.priority2;
  return c.border;
}

function TodayWidgetLayout(props: TodayWidgetData, environment: WidgetEnvironment) {
  'widget';
  const c = environment.colorScheme === 'dark' ? PALETTE.dark : PALETTE.light;

  return (
    <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 14 })]}>
      {/* Header: date + pending count */}
      <HStack alignment="center">
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(c.text)]}>
          {props.dateLabel}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(c.tint)]}>
          {props.count === 0 ? 'All done' : String(props.count)}
        </Text>
      </HStack>

      {props.count === 0 ? (
        <Text modifiers={[font({ size: 13 }), foregroundStyle(c.textSecondary)]}>
          Nothing due today 🎉
        </Text>
      ) : (
        props.tasks.map((task) => (
          <HStack key={task.id} spacing={8} alignment="center">
            <Text modifiers={[font({ size: 10 }), foregroundStyle(priorityColor(task.priority, c))]}>
              ●
            </Text>
            <Text modifiers={[font({ size: 14 }), foregroundStyle(c.text)]}>{task.title}</Text>
            <Spacer />
            {task.timeLabel ? (
              <Text
                modifiers={[
                  font({ size: 12 }),
                  foregroundStyle(task.overdue ? c.danger : c.textSecondary),
                ]}>
                {task.timeLabel}
              </Text>
            ) : null}
          </HStack>
        ))
      )}

      {props.overflow > 0 ? (
        <Text modifiers={[font({ size: 12 }), foregroundStyle(c.textSecondary)]}>
          +{props.overflow} more
        </Text>
      ) : null}
    </VStack>
  );
}

export const todayWidget = createWidget<TodayWidgetData>(TODAY_WIDGET_NAME, TodayWidgetLayout);
