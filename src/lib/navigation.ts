import { router } from 'expo-router';

/**
 * Centralized navigation helpers. We don't rely on expo-router's generated
 * typed-routes (they only regenerate at build time, which fights a
 * typecheck-first workflow), so paths are plain strings cast to the router's
 * expected href type in this one place.
 */
type Href = Parameters<typeof router.push>[0];
const asHref = (path: string): Href => path as unknown as Href;

export function openSearch(): void {
  router.push(asHref('/search'));
}

export function openSettings(): void {
  router.push(asHref('/settings'));
}

export function openTask(id: string): void {
  router.push(asHref(`/task/${id}`));
}

export function openList(id: string): void {
  router.push(asHref(`/lists/${id}`));
}

export function openPomodoro(taskId?: string): void {
  router.push(asHref(taskId ? `/pomodoro?taskId=${taskId}` : '/pomodoro'));
}

export function openStats(): void {
  router.push(asHref('/stats'));
}
