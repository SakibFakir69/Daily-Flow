import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  /** Optional trailing controls (e.g. search / settings icons). */
  rightAction?: ReactNode;
}

/** Large display title for a screen, with an optional secondary line + actions. */
export function ScreenHeader({ title, subtitle, rightAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.titleBlock}>
        <ThemedText type="subtitle">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {rightAction ? <View style={styles.actions}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  titleBlock: {
    flex: 1,
  },
  subtitle: {
    marginTop: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
