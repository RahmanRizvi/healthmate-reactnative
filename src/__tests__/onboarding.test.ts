import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { setDatabaseExecutorForTesting } from '../core/database/database';
import { runMigrations } from '../core/database/migrations';
import { useOnboardingStore } from '../features/onboarding/viewmodels/useOnboardingViewModel';
import { useProfileStore } from '../features/profile/viewmodels/useProfileViewModel';
import { appSettingsRepository } from '../repositories/sqlite/SQLiteAppSettingsRepository';
import { dailyGoalRepository } from '../repositories/sqlite/SQLiteDailyGoalRepository';
import { userProfileRepository } from '../repositories/sqlite/SQLiteUserProfileRepository';
import { useAppBootstrapStore } from '../store/useAppBootstrapStore';
import { InMemorySQLiteExecutor } from './InMemorySQLiteExecutor';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Phase 2 — Onboarding, BMI, Profile & Daily Goals Persistence', () => {
  let executor: InMemorySQLiteExecutor;

  beforeEach(async () => {
    executor = new InMemorySQLiteExecutor();
    setDatabaseExecutorForTesting(executor);
    await runMigrations(executor);
    useOnboardingStore.getState().resetOnboardingFlow();
    useAppBootstrapStore.setState({
      isReady: true,
      isLoading: false,
      error: null,
      onboardingCompleted: false,
      dataRevision: 0,
    });
  });

  afterEach(() => {
    setDatabaseExecutorForTesting(null);
  });

  test('Onboarding Step 2 rejects invalid personal details and prevents advancing to Step 3', () => {
    const store = useOnboardingStore.getState();
    store.nextFromWelcome();
    expect(useOnboardingStore.getState().currentStep).toBe(2);

    const ok = useOnboardingStore.getState().submitPersonalDetailsStep({
      full_name: 'A', // too short
      date_of_birth: '2099-01-01', // future date
      gender: 'female',
      height_cm: '10', // too short
      weight_kg: '-5', // negative
    });

    expect(ok).toBe(false);
    expect(useOnboardingStore.getState().currentStep).toBe(2);
    expect(useOnboardingStore.getState().fieldErrors.full_name).toBeDefined();
    expect(useOnboardingStore.getState().fieldErrors.date_of_birth).toBeDefined();
    expect(useOnboardingStore.getState().fieldErrors.height_cm).toBeDefined();
    expect(useOnboardingStore.getState().fieldErrors.weight_kg).toBeDefined();
  });

  test('Onboarding calculates BMI and age on Step 2 and saves profile, goals, and completion flag on Step 4', async () => {
    useOnboardingStore.getState().nextFromWelcome();

    const step2Success = useOnboardingStore.getState().submitPersonalDetailsStep({
      full_name: 'Jordan Taylor',
      date_of_birth: '1994-03-20',
      gender: 'male',
      height_cm: '180',
      weight_kg: '75',
    });

    expect(step2Success).toBe(true);
    const afterStep2 = useOnboardingStore.getState();
    expect(afterStep2.currentStep).toBe(3);
    // 75 / (1.8 * 1.8) = 23.148 -> 23.1
    expect(afterStep2.bmiResult?.bmi).toBe(23.1);
    expect(afterStep2.bmiResult?.category).toBe('Normal');
    expect(afterStep2.calculatedAge).toBeGreaterThanOrEqual(31);

    // Move to Step 4 (Daily Goals)
    useOnboardingStore.getState().goToStep(4);
    expect(useOnboardingStore.getState().currentStep).toBe(4);

    // Complete onboarding with custom daily goals
    const completed = await useOnboardingStore.getState().completeOnboarding({
      steps_goal: '12000',
      water_goal_ml: '3000',
      calories_goal_kcal: '650',
    });

    expect(completed).toBe(true);
    expect(useAppBootstrapStore.getState().onboardingCompleted).toBe(true);

    // Verify SQLite persistence
    const savedProfile = await userProfileRepository.getProfile();
    expect(savedProfile).not.toBeNull();
    expect(savedProfile?.full_name).toBe('Jordan Taylor');
    expect(savedProfile?.height_cm).toBe(180);
    expect(savedProfile?.weight_kg).toBe(75);

    const savedGoals = await dailyGoalRepository.getGoals();
    expect(savedGoals.steps_goal).toBe(12000);
    expect(savedGoals.water_goal_ml).toBe(3000);
    expect(savedGoals.calories_goal_kcal).toBe(650);

    const savedSettings = await appSettingsRepository.getSettings();
    expect(savedSettings.onboarding_completed).toBe(true);
  });

  test('ProfileViewModel loads and updates profile and daily goals in SQLite', async () => {
    await userProfileRepository.upsertProfile({
      full_name: 'Sam Lee',
      date_of_birth: '1990-08-10',
      gender: 'other',
      height_cm: 165,
      weight_kg: 72,
    });

    await useProfileStore.getState().loadProfileAndGoals();
    expect(useProfileStore.getState().profile?.full_name).toBe('Sam Lee');
    // 72 / (1.65^2) = 26.446 -> 26.4 Overweight
    expect(useProfileStore.getState().bmiResult?.bmi).toBe(26.4);
    expect(useProfileStore.getState().bmiResult?.category).toBe('Overweight');

    // Update profile weight to 62 kg (Normal BMI: 22.8)
    const profileSaved = await useProfileStore.getState().saveProfile({
      full_name: 'Sam Lee',
      date_of_birth: '1990-08-10',
      gender: 'other',
      height_cm: '165',
      weight_kg: '62',
    });
    expect(profileSaved).toBe(true);
    expect(useProfileStore.getState().bmiResult?.bmi).toBe(22.8);
    expect(useProfileStore.getState().bmiResult?.category).toBe('Normal');

    // Update daily goals
    const goalsSaved = await useProfileStore.getState().saveDailyGoals({
      steps_goal: '9500',
      water_goal_ml: '2200',
      calories_goal_kcal: '450',
    });
    expect(goalsSaved).toBe(true);
    expect(useProfileStore.getState().goals?.steps_goal).toBe(9500);
  });
});
