import { Platform } from 'react-native';

/**
 * Widget name — must match the `name` declared in the `react-native-android-widget`
 * config-plugin entry in app.json. Referenced by the task handler and update calls.
 */
export const TODAY_WIDGET_NAME = 'Today';

/** Home-screen widgets exist on Android (react-native-android-widget) and iOS (expo-widgets). */
export const widgetSupportedPlatform = Platform.OS === 'android' || Platform.OS === 'ios';
