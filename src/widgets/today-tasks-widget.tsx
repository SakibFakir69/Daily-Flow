import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { Radius } from '@/constants/theme';

/** Widget primitives accept only hex colors (`#rrggbb`), not arbitrary strings. */
export type HexColor = `#${string}`;

/**
 * Pure, presentational Android home-screen widget for the "Today" list.
 *
 * Everything it renders is computed by {@link buildTodayWidget} and passed in as
 * plain props — this component runs in the headless widget task (no React tree,
 * no hooks, no DB access here). It is intentionally built only from the
 * `react-native-android-widget` primitives (FlexWidget/TextWidget); standard RN
 * components do not render on the home screen.
 */

/** A single task as the widget needs it — already formatted, no domain types. */
export interface WidgetTaskItem {
  id: string;
  title: string;
  /** "9:30 AM" etc., or null when the task has no clock time. */
  timeLabel: string | null;
  /** Priority dot color, or null for priority none. */
  priorityColor: HexColor | null;
  /** True when overdue (rolled over from a previous day). */
  overdue: boolean;
}

/** The resolved palette for one appearance (light or dark). */
export interface WidgetColors {
  background: HexColor;
  card: HexColor;
  text: HexColor;
  textSecondary: HexColor;
  tint: HexColor;
  border: HexColor;
  danger: HexColor;
}

export interface TodayTasksWidgetProps {
  colors: WidgetColors;
  dateLabel: string;
  /** Total pending tasks for today (may exceed `items.length`). */
  count: number;
  items: WidgetTaskItem[];
  /** How many tasks are hidden beyond what fits (count - items.length). */
  overflow: number;
}

/** Deep link that opens a specific task detail screen (expo-router). */
function taskUri(id: string): string {
  return `dailyflow://task/${id}`;
}

function TaskRow({ item, colors }: { item: WidgetTaskItem; colors: WidgetColors }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: taskUri(item.id) }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        paddingVertical: 6,
      }}>
      <FlexWidget
        style={{
          height: 8,
          width: 8,
          borderRadius: 4,
          marginRight: 10,
          backgroundColor: item.priorityColor ?? colors.border,
        }}
      />
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget
          text={item.title}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 14, color: colors.text }}
        />
      </FlexWidget>
      {item.timeLabel ? (
        <TextWidget
          text={item.timeLabel}
          style={{
            fontSize: 12,
            marginLeft: 8,
            color: item.overdue ? colors.danger : colors.textSecondary,
          }}
        />
      ) : null}
    </FlexWidget>
  );
}

export function TodayTasksWidget({
  colors,
  dateLabel,
  count,
  items,
  overflow,
}: TodayTasksWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        padding: 14,
        borderRadius: Radius.lg,
        backgroundColor: colors.background,
      }}>
      {/* Header: date + pending count */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
          marginBottom: 8,
        }}>
        <FlexWidget style={{ flex: 1 }}>
          <TextWidget
            text={dateLabel}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 13, fontWeight: '700', color: colors.text }}
          />
        </FlexWidget>
        <TextWidget
          text={count === 0 ? 'All done' : String(count)}
          style={{ fontSize: 13, fontWeight: '700', color: colors.tint }}
        />
      </FlexWidget>

      {count === 0 ? (
        <FlexWidget
          style={{
            flex: 1,
            width: 'match_parent',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TextWidget
            text="Nothing due today 🎉"
            style={{ fontSize: 13, color: colors.textSecondary }}
          />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
          {items.map((item) => (
            <TaskRow key={item.id} item={item} colors={colors} />
          ))}
          {overflow > 0 ? (
            <TextWidget
              text={`+${overflow} more`}
              style={{ fontSize: 12, marginTop: 4, color: colors.textSecondary }}
            />
          ) : null}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
