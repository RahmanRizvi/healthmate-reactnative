import type { SQLiteDatabase } from 'expo-sqlite';
import { CURRENT_DB_VERSION, DEFAULT_DAILY_GOALS } from '../constants/appConstants';
import { getNowTimestamp } from '../utils/dateUtils';
import { ALL_SCHEMA_STATEMENTS } from './schema';

export interface DatabaseExecutor {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: (string | number | null)[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(source: string, ...params: (string | number | null)[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: (string | number | null)[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}


export async function runMigrations(db: DatabaseExecutor | SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;

  for (const statement of ALL_SCHEMA_STATEMENTS) {
    await db.execAsync(statement);
  }

  const now = getNowTimestamp();

  await db.runAsync(
    `INSERT OR IGNORE INTO daily_goals (id, steps_goal, water_goal_ml, calories_goal_kcal, updated_at)
     VALUES (1, ?, ?, ?, ?);`,
    DEFAULT_DAILY_GOALS.stepsGoal,
    DEFAULT_DAILY_GOALS.waterGoalMl,
    DEFAULT_DAILY_GOALS.caloriesGoalKcal,
    now
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO app_settings (id, unit_system, notifications_enabled, reminder_hour, reminder_minute, onboarding_completed, updated_at)
     VALUES (1, 'metric', 0, 20, 0, 0, ?);`,
    now
  );

  if (currentVersion < CURRENT_DB_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION};`);
  }
}
