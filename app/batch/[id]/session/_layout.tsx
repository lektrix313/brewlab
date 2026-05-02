import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'fullScreenModal' }}>
      <Stack.Screen name="mash" />
      <Stack.Screen name="boil" />
      <Stack.Screen name="cool" />
      <Stack.Screen name="pitch" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
