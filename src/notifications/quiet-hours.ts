import type { Settings } from '@/db';

/**
 * If `whenMs` lands inside the user's quiet-hours window, push it forward to the
 * end of that window so a reminder never fires during do-not-disturb. The window
 * is stored as minutes-from-midnight and may wrap past midnight
 * (e.g. start 22:00 → end 07:00). Returns `whenMs` unchanged when quiet hours
 * are disabled or the time is outside the window.
 */
export function applyQuietHours(whenMs: number, settings: Settings): number {
  const { quietHoursStart, quietHoursEnd } = settings;
  if (
    quietHoursStart === null ||
    quietHoursEnd === null ||
    quietHoursStart === quietHoursEnd
  ) {
    return whenMs;
  }

  const when = new Date(whenMs);
  const minutes = when.getHours() * 60 + when.getMinutes();
  const wraps = quietHoursStart > quietHoursEnd;

  const inWindow = wraps
    ? minutes >= quietHoursStart || minutes < quietHoursEnd
    : minutes >= quietHoursStart && minutes < quietHoursEnd;
  if (!inWindow) return whenMs;

  const end = new Date(whenMs);
  end.setHours(Math.floor(quietHoursEnd / 60), quietHoursEnd % 60, 0, 0);
  // When the window wraps midnight and we're in its evening half, the end time
  // belongs to the following day.
  if (wraps && minutes >= quietHoursStart) {
    end.setDate(end.getDate() + 1);
  }
  return end.getTime();
}
