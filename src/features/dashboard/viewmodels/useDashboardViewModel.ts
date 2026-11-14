import { create } from 'zustand';
import { DEFAULT_DAILY_GOALS } from '../../../core/constants/appConstants';
import { getErrorMessage } from '../../../core/errors/AppError';
import {
  addDaysToISODate,
  formatDateToISO,
  parseISODate,
} from '../../../core/utils/dateUtils';
import { calculateGoalProgress } from '../../../core/utils/healthCalculations';
import { DailyGoal } from '../../../models/DailyGoal';
import { HealthRecord } from '../../../models/HealthRecord';
import { UserProfile } from '../../../models/UserProfile';
import { dailyGoalRepository } from '../../../repositories/sqlite/SQLiteDailyGoalRepository';
import { healthRecordRepository } from '../../../repositories/sqlite/SQLiteHealthRecordRepository';
import { userProfileRepository } from '../../../repositories/sqlite/SQLiteUserProfileRepository';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { useToastStore } from '../../../store/useToastStore';

export type ChartMetric = 'steps' | 'calories' | 'water';

export interface WeeklyChartDayPoint {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. Mon, Tue
  isToday: boolean;
  steps: number;
  calories: number;
  water: number;
}

export interface DashboardProgressSummary {
  steps: {
    current: number;
    goal: number;
    percentage: number;
    clampedPercentage: number;
    remaining: number;
    isCompleted: boolean;
  };
  calories: {
    current: number;
    goal: number;
    percentage: number;
    clampedPercentage: number;
    remaining: number;
    isCompleted: boolean;
  };
  water: {
    current: number;
    goal: number;
    percentage: number;
    clampedPercentage: number;
    remaining: number;
    isCompleted: boolean;
  };
  overallCompletionPercentage: number;
}

interface DashboardViewModelState {
  currentDateISO: string;
  profile: UserProfile | null;
  goals: DailyGoal;
  todayRecord: HealthRecord | null;
  progress: DashboardProgressSummary;
  weeklyPoints: WeeklyChartDayPoint[];
  selectedChartMetric: ChartMetric;
  recentRecords: HealthRecord[];
  isLoading: boolean;
  isAddingWater: boolean;
  error: string | null;

  loadDashboard: (overrideDateISO?: string) => Promise<void>;
  quickAddWater: (amountMl: number, overrideDateISO?: string) => Promise<boolean>;
  setSelectedChartMetric: (metric: ChartMetric) => void;
  clearError: () => void;
}

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function computeProgress(
  record: HealthRecord | null,
  goals: DailyGoal
): DashboardProgressSummary {
  const stepsVal = record?.steps ?? 0;
  const caloriesVal = record?.calories ?? 0;
  const waterVal = record?.water ?? 0;

  const stepsProg = calculateGoalProgress(stepsVal, goals.steps_goal);
  const caloriesProg = calculateGoalProgress(caloriesVal, goals.calories_goal_kcal);
  const waterProg = calculateGoalProgress(waterVal, goals.water_goal_ml);

  const overallCompletionPercentage = Math.round(
    (stepsProg.clampedPercentage +
      caloriesProg.clampedPercentage +
      waterProg.clampedPercentage) /
      3
  );

  return {
    steps: {
      current: stepsVal,
      goal: goals.steps_goal,
      ...stepsProg,
    },
    calories: {
      current: caloriesVal,
      goal: goals.calories_goal_kcal,
      ...caloriesProg,
    },
    water: {
      current: waterVal,
      goal: goals.water_goal_ml,
      ...waterProg,
    },
    overallCompletionPercentage,
  };
}

const initialGoals: DailyGoal = {
  id: 1,
  steps_goal: DEFAULT_DAILY_GOALS.stepsGoal,
  water_goal_ml: DEFAULT_DAILY_GOALS.waterGoalMl,
  calories_goal_kcal: DEFAULT_DAILY_GOALS.caloriesGoalKcal,
  updated_at: '',
};

export const useDashboardStore = create<DashboardViewModelState>((set, get) => ({
  currentDateISO: formatDateToISO(),
  profile: null,
  goals: initialGoals,
  todayRecord: null,
  progress: computeProgress(null, initialGoals),
  weeklyPoints: [],
  selectedChartMetric: 'steps',
  recentRecords: [],
  isLoading: false,
  isAddingWater: false,
  error: null,

  loadDashboard: async (overrideDateISO?: string) => {
    const todayISO = overrideDateISO ?? formatDateToISO();
    const sevenDaysStartISO = addDaysToISODate(todayISO, -6);

    set({ isLoading: true, error: null, currentDateISO: todayISO });

    try {
      const [profile, goals, todayRecord, weekRecords, recentRecords] =
        await Promise.all([
          userProfileRepository.getProfile(),
          dailyGoalRepository.getGoals(),
          healthRecordRepository.getByDate(todayISO),
          healthRecordRepository.getByDateRange(
            sevenDaysStartISO,
            todayISO,
            'oldest'
          ),
          healthRecordRepository.getAll({ sortOrder: 'newest', limit: 5 }),
        ]);

      const recordByDateMap = new Map<string, HealthRecord>();
      for (const rec of weekRecords) {
        recordByDateMap.set(rec.date, rec);
      }

      const weeklyPoints: WeeklyChartDayPoint[] = [];
      for (let offset = -6; offset <= 0; offset++) {
        const dISO = addDaysToISODate(todayISO, offset);
        const dateObj = parseISODate(dISO);
        const matched = recordByDateMap.get(dISO);

        weeklyPoints.push({
          date: dISO,
          dayLabel: SHORT_WEEKDAYS[dateObj.getDay()],
          isToday: dISO === todayISO,
          steps: matched?.steps ?? 0,
          calories: matched?.calories ?? 0,
          water: matched?.water ?? 0,
        });
      }

      const progress = computeProgress(todayRecord, goals);

      set({
        profile,
        goals,
        todayRecord,
        progress,
        weeklyPoints,
        recentRecords,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load dashboard data.'),
      });
    }
  },

  quickAddWater: async (amountMl: number, overrideDateISO?: string): Promise<boolean> => {
    const targetDateISO = overrideDateISO ?? get().currentDateISO;
    set({ isAddingWater: true, error: null });

    try {
      await healthRecordRepository.addWaterForDate(targetDateISO, amountMl);
      useAppBootstrapStore.getState().notifyDataChanged();
      await get().loadDashboard(targetDateISO);
      useToastStore
        .getState()
        .showToast(`Added +${amountMl} ml of water.`, 'success');
      set({ isAddingWater: false });
      return true;
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Failed to update water intake.');
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        isAddingWater: false,
        error: errMsg,
      });
      return false;
    }
  },

  setSelectedChartMetric: (metric: ChartMetric) => {
    set({ selectedChartMetric: metric });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export function useDashboardViewModel() {
  return useDashboardStore();
}
