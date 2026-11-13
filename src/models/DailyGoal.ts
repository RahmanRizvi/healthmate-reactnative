export interface DailyGoal {
  id: number;
  steps_goal: number;
  water_goal_ml: number;
  calories_goal_kcal: number;
  updated_at: string;
}

export interface UpsertDailyGoalInput {
  steps_goal: number;
  water_goal_ml: number;
  calories_goal_kcal: number;
}
