import * as Haptics from 'expo-haptics';

/**
 * Thin haptics helpers. All calls are fire-and-forget and swallow errors so an
 * unsupported platform (or a device with haptics disabled) never breaks a flow.
 */

/** Light tap — task completed via checkbox/swipe. */
export function hapticComplete(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Medium tap — destructive reveal/commit (delete). */
export function hapticDelete(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Selection tick — lighter feedback for reschedule/snooze. */
export function hapticSelection(): void {
  Haptics.selectionAsync().catch(() => {});
}
