import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { setDatabaseExecutorForTesting, resetAllDatabaseData } from '../core/database/database';
import { runMigrations } from '../core/database/migrations';
import { DuplicateDateError } from '../core/errors/AppError';
import { calculateAgeFromDOB, calculateBMI, calculateGoalProgress } from '../core/utils/healthCalculations';
import { healthRecordSchema } from '../core/validation/schemas';
import { dailyGoalRepository } from '../repositories/sqlite/SQLiteDailyGoalRepository';
import { healthRecordRepository } from '../repositories/sqlite/SQLiteHealthRecordRepository';
import { userProfileRepository } from '../repositories/sqlite/SQLiteUserProfileRepository';
import { InMemorySQLiteExecutor } from './InMemorySQLiteExecutor';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Phase 1 — Foundation, Database Migrations & Repositories', () => {
  let executor: InMemorySQLiteExecutor;

  beforeEach(async () => {
    executor = new InMemorySQLiteExecutor();
    setDatabaseExecutorForTesting(executor);
    await runMigrations(executor);
  });

  afterEach(() => {
    setDatabaseExecutorForTesting(null);
  });

  test('Database initialization runs schema statements and seeds default goals', async () => {
    expect(executor.userVersion).toBe(1);
    const goals = await dailyGoalRepository.getGoals();
    expect(goals.steps_goal).toBe(10000);
    expect(goals.water_goal_ml).toBe(2500);
    expect(goals.calories_goal_kcal).toBe(500);
  });

  test('Creates, reads, updates, and deletes a health record while preserving created_at', async () => {
    const created = await healthRecordRepository.create({
      date: '2026-11-15',
      steps: 7850,
      calories: 420,
      water: 2000,
    });

    expect(created.id).toBe(1);
    expect(created.steps).toBe(7850);

    const fetched = await healthRecordRepository.getByDate('2026-11-15');
    expect(fetched).not.toBeNull();
    expect(fetched?.water).toBe(2000);

    const updated = await healthRecordRepository.update(created.id, {
      date: '2026-11-15',
      steps: 9000,
      calories: 480,
      water: 2250,
    });

    expect(updated.steps).toBe(9000);
    expect(updated.created_at).toBe(created.created_at);

    await healthRecordRepository.delete(created.id);
    const afterDelete = await healthRecordRepository.getById(created.id);
    expect(afterDelete).toBeNull();
  });

  test('Rejects duplicate date creation with DuplicateDateError', async () => {
    await healthRecordRepository.create({
      date: '2026-11-15',
      steps: 5000,
      calories: 300,
      water: 1500,
    });

    await expect(
      healthRecordRepository.create({
        date: '2026-11-15',
        steps: 6000,
        calories: 350,
        water: 1800,
      })
    ).rejects.toThrow(DuplicateDateError);
  });

  test('Validates negative values and invalid dates via Zod schema', () => {
    const negativeResult = healthRecordSchema.safeParse({
      date: '2026-11-15',
      steps: -100,
      calories: 200,
      water: 1000,
    });
    expect(negativeResult.success).toBe(false);

    const invalidDateResult = healthRecordSchema.safeParse({
      date: '2026-02-31',
      steps: 5000,
      calories: 200,
      water: 1000,
    });
    expect(invalidDateResult.success).toBe(false);
  });

  test('Calculates BMI and categories accurately', () => {
    const normal = calculateBMI(70, 175);
    expect(normal.bmi).toBe(22.9);
    expect(normal.category).toBe('Normal');

    const underweight = calculateBMI(48, 170);
    expect(underweight.category).toBe('Underweight');

    const overweight = calculateBMI(82, 175);
    expect(overweight.category).toBe('Overweight');

    const obese = calculateBMI(100, 175);
    expect(obese.category).toBe('Obese');
  });

  test('Calculates age and goal progress accurately', () => {
    const age = calculateAgeFromDOB('1996-05-10', new Date(2026, 10, 15));
    expect(age).toBe(30);

    const progress = calculateGoalProgress(7500, 10000);
    expect(progress.percentage).toBe(75);
    expect(progress.remaining).toBe(2500);
    expect(progress.isCompleted).toBe(false);
  });

  test('Stores and updates user profile and resets all database data', async () => {
    const profile = await userProfileRepository.upsertProfile({
      full_name: 'Alex Morgan',
      date_of_birth: '1995-04-12',
      gender: 'female',
      height_cm: 168,
      weight_kg: 62,
    });
    expect(profile.full_name).toBe('Alex Morgan');

    await resetAllDatabaseData();
    const afterReset = await userProfileRepository.getProfile();
    expect(afterReset).toBeNull();
  });
});
