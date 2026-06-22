import * as Notifications from 'expo-notifications';

/**
 * Ensures notification permission, prompting once if it hasn't been decided.
 * Returns whether notifications may be shown. Safe to call repeatedly — it only
 * prompts when the OS still allows asking.
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
  
  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}
