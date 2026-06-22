/**
 * Public entry point for app code that needs to refresh the Android home-screen
 * widget (Milestone 13). Web-safe: resolves to a no-op on web via the
 * `update-widget.web.ts` platform split.
 *
 * The OS-facing task handler (`widget-task-handler`) is imported directly by the
 * app entry (index.js) for native registration — it is intentionally NOT
 * re-exported here so it never reaches the web bundle.
 */
export { refreshTodayWidget } from './update-widget';
export { TODAY_WIDGET_NAME, widgetSupportedPlatform } from './config';
