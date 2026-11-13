import { DEFAULT_DAILY_GOALS } from '../../core/constants/appConstants';
import { getDatabase } from '../../core/database/database';
import { getNowTimestamp } from '../../core/utils/dateUtils';
import { DailyGoal, UpsertDailyGoalInput } from '../../models/DailyGoal';
import { IDailyGoalRepository } from '../interfaces/IDailyGoalRepository';

export class SQLiteDailyGoalRepository implements IDailyGoalRepository {
  async getGoals(): Promise<DailyGoal> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<DailyGoal>(
      'SELECT * FROM daily_goals WHERE id = 1;'
    );

    if (existing) {
      return existing;
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

    return {
      id: 1,
      steps_goal: DEFAULT_DAILY_GOALS.stepsGoal,
      water_goal_ml: DEFAULT_DAILY_GOALS.waterGoalMl,
      calories_goal_kcal: DEFAULT_DAILY_GOALS.caloriesGoalKcal,
      updated_at: now,
    };
  }

  async upsertGoals(input: UpsertDailyGoalInput): Promise<DailyGoal> {
    const db = await getDatabase();
    const now = getNowTimestamp();

    await db.runAsync(
      `INSERT INTO daily_goals (id, steps_goal, water_goal_ml, calories_goal_kcal, updated_at)
       VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         steps_goal = excluded.steps_goal,
         water_goal_ml = excluded.water_goal_ml,
         calories_goal_kcal = excluded.calories_goal_kcal,
         updated_at = excluded.updated_at;`,
      Math.round(input.steps_goal),
      Math.round(input.water_goal_ml),
      Math.round(input.calories_goal_kcal),
      now
    );

    return this.getGoals();
  }
}

export const dailyGoalRepository = new SQLiteDailyGoalRepository();
