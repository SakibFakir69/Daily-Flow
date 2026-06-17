import { Stack } from 'expo-router';

/** Stack for the Lists tab: the list browser (index) → a list's detail ([id]). */
export default function ListsStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
