import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { buildTodayWidget } from './build-today-widget';
import { TODAY_WIDGET_NAME } from './config';

/**
 * Headless task handler invoked by the OS for every widget lifecycle event
 * (added / periodic update / resized / clicked). It runs outside the React tree,
 * so it builds the widget tree from the DB on demand via {@link buildTodayWidget}.
 *
 * Registered once in the app entry (index.js) through `registerWidgetTaskHandler`.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  if (props.widgetInfo.widgetName !== TODAY_WIDGET_NAME) return;

  switch (props.widgetAction) {
    // Render on add, periodic OS update, and resize. WIDGET_CLICK with an
    // OPEN_URI/OPEN_APP action is handled natively (deep link), so there is
    // nothing to redraw; WIDGET_DELETED needs no work.
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(await buildTodayWidget());
      break;
    case 'WIDGET_CLICK':
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
