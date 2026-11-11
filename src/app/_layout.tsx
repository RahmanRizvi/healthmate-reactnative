import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors, Typography } from '../core/theme';
import { ToastHost } from '../components';
import { useAppBootstrapStore } from '../store/useAppBootstrapStore';

try {
  SplashScreen.setOptions({ duration: 0, fade: false });
} catch {
  // Ignore on web or unsupported environments
}

export default function RootLayout() {
  const bootstrap = useAppBootstrapStore((state) => state.bootstrap);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    bootstrap();
  }, [bootstrap]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: {
            ...Typography.h3,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="records/add"
          options={{
            title: 'Add Health Record',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="records/edit/[id]"
          options={{
            title: 'Edit Health Record',
          }}
        />
        <Stack.Screen
          name="records/details/[id]"
          options={{
            title: 'Record Details',
          }}
        />
        <Stack.Screen
          name="profile/index"
          options={{
            title: 'Edit Profile',
          }}
        />
        <Stack.Screen
          name="profile/goals"
          options={{
            title: 'Daily Goals',
          }}
        />
        <Stack.Screen
          name="profile/bmi"
          options={{
            title: 'BMI Information',
          }}
        />
      </Stack>
      <ToastHost />
    </SafeAreaProvider>
  );
}
