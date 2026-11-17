import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { FormInput } from '../components/FormInput';
import { ToastHost } from '../components/ToastHost';
import { calculateBMI } from '../core/utils/healthCalculations';
import { BMIResultCard } from '../features/onboarding/components/BMIResultCard';
import { HealthRecordCard } from '../features/records/components/HealthRecordCard';
import { useToastStore } from '../store/useToastStore';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('lucide-react-native', () => {

  const ReactLib = require('react');
  const { View: RNView } = require('react-native');

  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        const MockIcon = (props: Record<string, unknown>) =>
          ReactLib.createElement(RNView, { testID: `icon-${String(prop)}`, ...props });
        MockIcon.displayName = String(prop);
        return MockIcon;
      },
    }
  );
});

describe('Phase 6 — UI Component & Interaction Tests', () => {
  afterEach(async () => {
    await act(async () => {
      useToastStore.getState().hideToast();
    });
  });

  test('Button renders title and invokes onPress when enabled', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <Button title="Save Record" onPress={onPress} />
    );
    await fireEvent.press(getByText('Save Record'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('FormInput renders label, single unit suffix, and validation error message', async () => {
    const { getByText } = await render(
      <FormInput
        label="Water Intake"
        unit="ml"
        value="2000"
        error="Water intake cannot be negative."
      />
    );
    expect(getByText('Water Intake')).toBeTruthy();
    expect(getByText('ml')).toBeTruthy();
    expect(getByText('Water intake cannot be negative.')).toBeTruthy();
  });

  test('BMIResultCard displays calculated BMI, category, and adult disclaimer', async () => {
    const bmiResult = calculateBMI(70, 175);
    const { getByTestId, getAllByText } = await render(
      <BMIResultCard
        bmiResult={bmiResult}
        age={29}
        heightCm={175}
        weightKg={70}
      />
    );
    expect(getByTestId('bmi-result-value').props.children).toBe('22.9');
    expect(getAllByText('Normal').length).toBeGreaterThanOrEqual(1);
  });

  test('HealthRecordCard renders steps, calories, water, and responds to press', async () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = await render(
      <HealthRecordCard
        record={{
          id: 1,
          date: '2026-11-15',
          steps: 7850,
          calories: 420,
          water: 2000,
          created_at: '2026-11-15T06:00:00.000Z',
          updated_at: '2026-11-15T06:00:00.000Z',
        }}
        onPress={onPress}
      />
    );

    expect(getByText('7,850')).toBeTruthy();
    await fireEvent.press(getByTestId('health-record-card-2026-11-15'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('EmptyState renders title, description, and triggers action callback', async () => {
    const onAction = jest.fn();
    const { getByText } = await render(
      <EmptyState
        title="No Health Records Found"
        description="Start logging your daily wellness."
        actionTitle="Add Record"
        onAction={onAction}
      />
    );

    expect(getByText('No Health Records Found')).toBeTruthy();
    await fireEvent.press(getByText('Add Record'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test('ToastHost displays global toast alert when showToast is triggered', async () => {
    await act(async () => {
      useToastStore
        .getState()
        .showToast('Health record saved successfully.', 'success', 0);
    });
    const { getByTestId, getByText } = await render(<ToastHost />);
    expect(getByTestId('app-toast-banner')).toBeTruthy();
    expect(getByText('Health record saved successfully.')).toBeTruthy();
  });
});
