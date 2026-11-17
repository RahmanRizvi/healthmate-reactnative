import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { setDatabaseExecutorForTesting } from '../core/database/database';
import { runMigrations } from '../core/database/migrations';
import { useProgressStore } from '../features/progress/viewmodels/useProgressViewModel';
import { useSettingsStore } from '../features/settings/viewmodels/useSettingsViewModel';
import { healthRecordRepository } from '../repositories/sqlite/SQLiteHealthRecordRepository';
import { buildHealthRecordsCSV } from '../services/csvExportService';
import { InMemorySQLiteExecutor } from './InMemorySQLiteExecutor';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  scheduleNotificationAsync: jest.fn(async () => 'notif-id-1'),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

describe('Phase 5 — Progress Analytics, Settings, Sample Demo Data & CSV Export', () => {
  let executor: InMemorySQLiteExecutor;

  beforeEach(async () => {
    executor = new InMemorySQLiteExecutor();
    setDatabaseExecutorForTesting(executor);
    await runMigrations(executor);
  });

  afterEach(() => {
    setDatabaseExecutorForTesting(null);
  });

  test('ProgressViewModel calculates daily, weekly, and monthly totals, averages, active days, and previous period comparison', async () => {
    // Current week (Mon 2026-11-09 to Sun 2026-11-15)
    await healthRecordRepository.create({
      date: '2026-11-10',
      steps: 8000,
      calories: 400,
      water: 2000,
    });
    await healthRecordRepository.create({
      date: '2026-11-15',
      steps: 10000,
      calories: 600,
      water: 2500,
    });

    // Previous week (Mon 2026-11-02 to Sun 2026-11-08)
    await healthRecordRepository.create({
      date: '2026-11-04',
      steps: 9000,
      calories: 450,
      water: 2250,
    });

    await useProgressStore.getState().setPeriodType('weekly', '2026-11-15');
    const weekly = useProgressStore.getState();

    expect(weekly.summary.totalSteps).toBe(18000);
    expect(weekly.summary.totalCalories).toBe(1000);
    expect(weekly.summary.totalWater).toBe(4500);
    expect(weekly.summary.activeDays).toBe(2);
    expect(weekly.summary.totalDaysInPeriod).toBe(7);
    expect(weekly.summary.averageDailySteps).toBe(9000);
    expect(weekly.summary.averageDailyWater).toBe(2250);

    // Comparison against previous week (18000 vs 9000 = +9000 steps, +100%)
    expect(weekly.summary.comparison.stepsDiff).toBe(9000);
    expect(weekly.summary.comparison.stepsPercentChange).toBe(100);

    // Navigate to previous period (week of 2026-11-02 to 2026-11-08)
    await useProgressStore.getState().navigatePeriod('prev');
    const prevWeek = useProgressStore.getState();
    expect(prevWeek.summary.totalSteps).toBe(9000);
    expect(prevWeek.summary.activeDays).toBe(1);

    // Daily view on 2026-11-15
    await useProgressStore.getState().setPeriodType('daily', '2026-11-15');
    const daily = useProgressStore.getState();
    expect(daily.summary.totalSteps).toBe(10000);
    expect(daily.summary.goalCompletionPercentage).toBe(100);

    // Monthly view for Nov 2026 (all 3 records are in November)
    await useProgressStore.getState().setPeriodType('monthly', '2026-11-15');
    const monthly = useProgressStore.getState();
    expect(monthly.summary.totalSteps).toBe(27000);
    expect(monthly.summary.activeDays).toBe(3);
  });

  test('CSV builder formats headers and rows accurately', async () => {
    const rec = await healthRecordRepository.create({
      date: '2026-11-15',
      steps: 7850,
      calories: 420,
      water: 2000,
    });

    const csv = buildHealthRecordsCSV([rec]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'Date,Steps,Calories,Water,Created timestamp,Updated timestamp'
    );
    expect(lines[1]).toContain('2026-11-15,7850,420,2000,');
  });

  test('SettingsViewModel inserts sample data without overwriting existing records, updates preferences, and resets app data', async () => {
    // Pre-existing user record on 2026-11-15
    await healthRecordRepository.create({
      date: '2026-11-15',
      steps: 12345,
      calories: 678,
      water: 3100,
    });

    // Load 14 days of sample data ending 2026-11-15
    const insertedCount = await useSettingsStore
      .getState()
      .loadSampleData('2026-11-15');

    // Should insert 13 new records and NOT overwrite 2026-11-15
    expect(insertedCount).toBe(13);
    const preservedToday = await healthRecordRepository.getByDate('2026-11-15');
    expect(preservedToday?.steps).toBe(12345);

    // Update measurement unit preference
    await useSettingsStore.getState().updateUnitSystem('imperial');
    expect(useSettingsStore.getState().settings?.unit_system).toBe('imperial');

    // Toggle notifications on and off
    await useSettingsStore.getState().toggleNotifications(true);
    expect(useSettingsStore.getState().settings?.notifications_enabled).toBe(
      true
    );

    // Reset all application data
    const resetOk = await useSettingsStore.getState().resetApplicationData();
    expect(resetOk).toBe(true);
    expect(useSettingsStore.getState().totalRecordCount).toBe(0);
    const allAfterReset = await healthRecordRepository.getAll();
    expect(allAfterReset.length).toBe(0);
  });
});
