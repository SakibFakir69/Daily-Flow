// Custom app entry — based on `expo-router/entry-classic`, with the Android
// home-screen widget task handler registered alongside the app root.
//
// `@expo/metro-runtime` MUST be the first import so Fast Refresh works on web.
import '@expo/metro-runtime';

import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { Platform } from 'react-native';

renderRootComponent(App);

// Register the headless widget task handler (Android only — the native module
// isn't present on iOS/web). Lazily required so non-Android bundles never load
// `react-native-android-widget`.
if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widgets/widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
