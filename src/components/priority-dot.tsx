import { View } from 'react-native';

import { PriorityColors, Radius } from '@/constants/theme';
import { Priority } from '@/db';
import { useThemeMode } from '@/hooks/use-theme';

interface Props {
  priority: Priority;
  size?: number;
}

/** A single colored dot for medium/high priority. Renders nothing for `None`. */
export function PriorityDot({ priority, size = 8 }: Props) {
  const mode = useThemeMode();
  if (priority === Priority.None) return null;
  const color = PriorityColors[mode][priority as Priority.Medium | Priority.High];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Radius.pill,
        backgroundColor: color,
      }}
    />
  );
}
