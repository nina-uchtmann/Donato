import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';

import { colors } from '@/constants/categories';

// Harmless dev-only warning from React Native's touch tracking when a gesture is
// handled partly by a native view (the map's pan/long-press/pin drag, or the
// slider). It doesn't affect behavior and never shows in production builds.
LogBox.ignoreLogs(['Ended a touch event which was not counted in `trackedTouchCount`']);

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#EAF6EF' },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }} />
        <Stack.Screen name="results" options={{ title: 'Nearby drop-offs' }} />
      </Stack>
    </>
  );
}
