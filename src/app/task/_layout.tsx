import { Stack } from 'expo-router';

/** Stack for the task detail route (pushed over the tabs). */
export default function TaskStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
