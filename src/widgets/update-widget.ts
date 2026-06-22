/**
 * Default no-op widget refresh. Metro picks the platform-specific
 * implementation at bundle time: `update-widget.android.ts` (Android home-screen
 * widget), `update-widget.ios.ts` (iOS WidgetKit), `update-widget.web.ts` (web).
 * This bare module is the fallback and the target `tsc` resolves for the
 * `./update-widget` import in `index.ts`.
 */
export async function refreshTodayWidget(): Promise<void> {
  // intentionally empty — see platform-specific files
}
