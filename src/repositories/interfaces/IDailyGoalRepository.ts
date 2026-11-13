import { DailyGoal, UpsertDailyGoalInput } from '../../models/DailyGoal';

export interface IDailyGoalRepository {
  getGoals(): Promise<DailyGoal>;
  upsertGoals(input: UpsertDailyGoalInput): Promise<DailyGoal>;
}
