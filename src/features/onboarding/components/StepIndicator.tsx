import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../../core/theme';
import { OnboardingStep } from '../viewmodels/useOnboardingViewModel';

interface StepIndicatorProps {
  currentStep: OnboardingStep;
}

const STEP_LABELS: Record<OnboardingStep, string> = {
  1: 'Welcome',
  2: 'Personal Details',
  3: 'BMI Estimate',
  4: 'Daily Goals',
};

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps: OnboardingStep[] = [1, 2, 3, 4];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.stepTitle}>{STEP_LABELS[currentStep]}</Text>
        <Text style={styles.stepCounter}>Step {currentStep} of 4</Text>
      </View>
      <View style={styles.barsRow}>
        {steps.map((step) => {
          const isCompletedOrActive = step <= currentStep;
          return (
            <View
              key={step}
              style={[
                styles.barSegment,
                isCompletedOrActive ? styles.barActive : styles.barInactive,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepTitle: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stepCounter: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  barsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  barSegment: {
    flex: 1,
    height: 6,
    borderRadius: Radius.full,
  },
  barActive: {
    backgroundColor: Colors.primary,
  },
  barInactive: {
    backgroundColor: Colors.border,
  },
});
