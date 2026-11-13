export const DATABASE_NAME = 'healthmate.db';
export const CURRENT_DB_VERSION = 1;

export const DEFAULT_DAILY_GOALS = {
  stepsGoal: 10000,
  waterGoalMl: 2500,
  caloriesGoalKcal: 500,
} as const;

export const WATER_QUICK_ADD_AMOUNTS = [150, 250, 500] as const;

export const APP_INFO = {
  name: 'HealthMate',
  tagline: 'Personal Health and Wellness Tracker',
  version: '1.0.0',
} as const;
