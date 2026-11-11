import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { ErrorBanner, ScreenContainer } from '../components';
import { Colors } from '../core/theme';
import { useAppBootstrapStore } from '../store/useAppBootstrapStore';

export default function IndexGateScreen() {
  const isLoading = useAppBootstrapStore((state) => state.isLoading);
  const isReady = useAppBootstrapStore((state) => state.isReady);
  const error = useAppBootstrapStore((state) => state.error);
  const onboardingCompleted = useAppBootstrapStore((state) => state.onboardingCompleted);
  const bootstrap = useAppBootstrapStore((state) => state.bootstrap);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  if (error || !isReady) {
    return (
      <ScreenContainer scrollable={false}>
        <ErrorBanner
          message={error ?? 'Unable to load your health data.'}
          actionLabel="Retry"
          onAction={bootstrap}
        />
      </ScreenContainer>
    );
  }

  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
