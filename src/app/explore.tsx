import { Redirect } from 'expo-router';

/**
 * Leftover route from the Expo template. Hidden from the tab bar (see
 * `_layout.tsx`) and redirected to Today so it can't be reached directly.
 * Safe to delete this file once the build tooling is available.
 */
export default function Explore() {
  return <Redirect href="/" />;
}
