import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { setDatabaseExecutorForTesting } from '../core/database/database';
import { runMigrations } from '../core/database/migrations';
import { useDashboardStore } from '../features/dashboard/viewmodels/useDashboardViewModel';
import { dailyGoalRepository } from '../repositories/sqlite/SQLiteDailyGoalRepository';
import { healthRecordRepository } from '../repositories/sqlite/SQLiteHealthRecordRepository';
import { userProfileRepository } from '../repositories/sqlite/SQLiteUserProfileRepository';
import { InMemorySQLiteExecutor } from './InMemorySQLiteExecutor';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Phase 4 — Dashboard Summaries, Goal Progress, Quick Water & Weekly Chart', () => {
  let executor: InMemorySQLiteExecutor;

  beforeEach(async () => {
    executor = new InMemorySQLiteExecutor();
    setDatabaseExecutorForTesting(executor);
    await runMigrations(executor);
  });

  afterEach(() => {
    setDatabaseExecutorForTesting(null);
  });

  test('Dashboard starts with empty todayRecord and 0% progress when database is empty', async () => {
    await useDashboardStore.getState().loadDashboard('2026-11-15');
    const state = useDashboardStore.getState();

    expect(state.todayRecord).toBeNull();
    expect(state.progress.steps.current).toBe(0);
    expect(state.progress.calories.current).toBe(0);
    expect(state.progress.water.current).toBe(0);
    expect(state.progress.overallCompletionPercentage).toBe(0);
    expect(state.weeklyPoints.length).toBe(7);
    expect(state.recentRecords.length).toBe(0);
  });

  test('Dashboard calculates real daily summaries, goal completion percentages, and weekly points from SQLite', async () => {
    await userProfileRepository.upsertProfile({
      full_name: 'Alex Morgan',
      date_of_birth: '1995-06-15',
      gender: 'female',
      height_cm: 168,
      weight_kg: 62,
    });

    await dailyGoalRepository.upsertGoals({
      steps_goal: 10000,
      water_goal_ml: 2000,
      calories_goal_kcal: 500,
    });

    await healthRecordRepository.create({
      date: '2026-11-13',
      steps: 6200,
      calories: 310,
      water: 1800,
    });

    await healthRecordRepository.create({
      date: '2026-11-15',
      steps: 7850,
      calories: 420,
      water: 2000,
    });

    await useDashboardStore.getState().loadDashboard('2026-11-15');
    const state = useDashboardStore.getState();

    expect(state.profile?.full_name).toBe('Alex Morgan');
    expect(state.todayRecord?.steps).toBe(7850);
    expect(state.todayRecord?.calories).toBe(420);
    expect(state.todayRecord?.water).toBe(2000);

    // 7850 / 10000 = 79%
    expect(state.progress.steps.percentage).toBe(79);
    expect(state.progress.steps.remaining).toBe(2150);

    // 420 / 500 = 84%
    expect(state.progress.calories.percentage).toBe(84);
    expect(state.progress.calories.remaining).toBe(80);

    // 2000 / 2000 = 100%
    expect(state.progress.water.percentage).toBe(100);
    expect(state.progress.water.remaining).toBe(0);
    expect(state.progress.water.isCompleted).toBe(true);

    // Overall = round((79 + 84 + 100) / 3) = 88%
    expect(state.progress.overallCompletionPercentage).toBe(88);

    // Weekly points: 7 days ending 2026-11-15
    expect(state.weeklyPoints[6].date).toBe('2026-11-15');
    expect(state.weeklyPoints[6].steps).toBe(7850);
    expect(state.weeklyPoints[4].date).toBe('2026-11-13');
    expect(state.weeklyPoints[4].steps).toBe(6200);
  });

  test('Quick-add water creates or updates today record in SQLite and refreshes dashboard immediately', async () => {
    await useDashboardStore.getState().loadDashboard('2026-11-15');
    expect(useDashboardStore.getState().todayRecord).toBeNull();

    // Quick add +250 ml when no record exists for today
    const ok1 = await useDashboardStore.getState().quickAddWater(250, '2026-11-15');
    expect(ok1).toBe(true);
    expect(useDashboardStore.getState().todayRecord?.water).toBe(250);
    expect(useDashboardStore.getState().todayRecord?.steps).toBe(0);

    // Quick add +500 ml to the existing record
    const ok2 = await useDashboardStore.getState().quickAddWater(500, '2026-11-15');
    expect(ok2).toBe(true);
    expect(useDashboardStore.getState().todayRecord?.water).toBe(750);
    expect(useDashboardStore.getState().progress.water.current).toBe(750);
  });
});
