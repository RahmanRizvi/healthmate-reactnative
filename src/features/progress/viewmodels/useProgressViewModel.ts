import { create } from 'zustand';
import { DEFAULT_DAILY_GOALS } from '../../../core/constants/appConstants';
import { getErrorMessage } from '../../../core/errors/AppError';
import {
  addDaysToISODate,
  formatDateToISO,
  formatReadableDate,
  formatShortDate,
  getDatesBetween,
  getMonthDateRange,
  getWeekDateRange,
  parseISODate,
} from '../../../core/utils/dateUtils';
import { calculateGoalProgress } from '../../../core/utils/healthCalculations';
import { DailyGoal } from '../../../models/DailyGoal';
import { HealthRecord } from '../../../models/HealthRecord';
import { dailyGoalRepository } from '../../../repositories/sqlite/SQLiteDailyGoalRepository';
import { healthRecordRepository } from '../../../repositories/sqlite/SQLiteHealthRecordRepository';

export type ProgressPeriodType = 'daily' | 'weekly' | 'monthly';
export type ProgressChartMetric = 'steps' | 'calories' | 'water';

export interface ProgressChartBar {
  date: string;
  label: string;
  steps: number;
  calories: number;
  water: number;
}

export interface PeriodComparisonDelta {
  stepsDiff: number;
  stepsPercentChange: number | null;
  caloriesDiff: number;
  caloriesPercentChange: number | null;
  waterDiff: number;
  waterPercentChange: number | null;
}

export interface ProgressAnalyticsSummary {
  totalSteps: number;
  totalCalories: number;
  totalWater: number;
  averageDailySteps: number;
  averageDailyWater: number;
  averageDailyCalories: number;
  activeDays: number;
  totalDaysInPeriod: number;
  goalCompletionPercentage: number;
  comparison: PeriodComparisonDelta;
}

interface ProgressViewModelState {
  periodType: ProgressPeriodType;
  anchorDateISO: string;
  periodLabel: string;
  previousPeriodLabel: string;
  selectedMetric: ProgressChartMetric;
  goals: DailyGoal;
  recordsInPeriod: HealthRecord[];
  chartBars: ProgressChartBar[];
  summary: ProgressAnalyticsSummary;
  isLoading: boolean;
  error: string | null;

  loadProgress: (overrideAnchorDateISO?: string) => Promise<void>;
  setPeriodType: (period: ProgressPeriodType, overrideAnchorDateISO?: string) => Promise<void>;
  navigatePeriod: (direction: 'prev' | 'next') => Promise<void>;
  setSelectedMetric: (metric: ProgressChartMetric) => void;
  clearError: () => void;
}

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const initialGoals: DailyGoal = {
  id: 1,
  steps_goal: DEFAULT_DAILY_GOALS.stepsGoal,
  water_goal_ml: DEFAULT_DAILY_GOALS.waterGoalMl,
  calories_goal_kcal: DEFAULT_DAILY_GOALS.caloriesGoalKcal,
  updated_at: '',
};

const emptySummary: ProgressAnalyticsSummary = {
  totalSteps: 0,
  totalCalories: 0,
  totalWater: 0,
  averageDailySteps: 0,
  averageDailyWater: 0,
  averageDailyCalories: 0,
  activeDays: 0,
  totalDaysInPeriod: 1,
  goalCompletionPercentage: 0,
  comparison: {
    stepsDiff: 0,
    stepsPercentChange: null,
    caloriesDiff: 0,
    caloriesPercentChange: null,
    waterDiff: 0,
    waterPercentChange: null,
  },
};

function computePeriodBounds(
  periodType: ProgressPeriodType,
  anchorISO: string
): {
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
  periodLabel: string;
  previousPeriodLabel: string;
} {
  if (periodType === 'daily') {
    const prevDate = addDaysToISODate(anchorISO, -1);
    return {
      startDate: anchorISO,
      endDate: anchorISO,
      prevStartDate: prevDate,
      prevEndDate: prevDate,
      periodLabel: formatReadableDate(anchorISO),
      previousPeriodLabel: formatReadableDate(prevDate),
    };
  }

  if (periodType === 'weekly') {
    const { startDate, endDate } = getWeekDateRange(anchorISO);
    const prevStartDate = addDaysToISODate(startDate, -7);
    const prevEndDate = addDaysToISODate(endDate, -7);
    return {
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      periodLabel: `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`,
      previousPeriodLabel: `${formatShortDate(prevStartDate)} – ${formatShortDate(
        prevEndDate
      )}`,
    };
  }

  const { startDate, endDate } = getMonthDateRange(anchorISO);
  const anchorDate = parseISODate(anchorISO);
  const prevMonthDate = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth() - 1,
    1
  );
  const prevMonthISO = formatDateToISO(prevMonthDate);
  const { startDate: prevStartDate, endDate: prevEndDate } =
    getMonthDateRange(prevMonthISO);

  const monthLabel = anchorDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const prevMonthLabel = prevMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return {
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    periodLabel: monthLabel,
    previousPeriodLabel: prevMonthLabel,
  };
}

function calcPercentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export const useProgressStore = create<ProgressViewModelState>((set, get) => ({
  periodType: 'weekly',
  anchorDateISO: formatDateToISO(),
  periodLabel: '',
  previousPeriodLabel: '',
  selectedMetric: 'steps',
  goals: initialGoals,
  recordsInPeriod: [],
  chartBars: [],
  summary: emptySummary,
  isLoading: false,
  error: null,

  loadProgress: async (overrideAnchorDateISO?: string) => {
    const state = get();
    const anchorISO = overrideAnchorDateISO ?? state.anchorDateISO;
    const bounds = computePeriodBounds(state.periodType, anchorISO);

    set({
      isLoading: true,
      error: null,
      anchorDateISO: anchorISO,
      periodLabel: bounds.periodLabel,
      previousPeriodLabel: bounds.previousPeriodLabel,
    });

    try {
      const [goals, currentRecords, prevRecords] = await Promise.all([
        dailyGoalRepository.getGoals(),
        healthRecordRepository.getByDateRange(
          bounds.startDate,
          bounds.endDate,
          'oldest'
        ),
        healthRecordRepository.getByDateRange(
          bounds.prevStartDate,
          bounds.prevEndDate,
          'oldest'
        ),
      ]);

      const datesInPeriod = getDatesBetween(bounds.startDate, bounds.endDate);
      const totalDaysInPeriod = datesInPeriod.length;

      const recordMap = new Map<string, HealthRecord>();
      for (const r of currentRecords) {
        recordMap.set(r.date, r);
      }

      const chartBars: ProgressChartBar[] = datesInPeriod.map((dISO) => {
        const rec = recordMap.get(dISO);
        const dateObj = parseISODate(dISO);
        let label = String(dateObj.getDate());
        if (state.periodType === 'weekly') {
          label = SHORT_WEEKDAYS[dateObj.getDay()];
        } else if (state.periodType === 'daily') {
          label = formatShortDate(dISO);
        }

        return {
          date: dISO,
          label,
          steps: rec?.steps ?? 0,
          calories: rec?.calories ?? 0,
          water: rec?.water ?? 0,
        };
      });

      const totalSteps = currentRecords.reduce((acc, r) => acc + r.steps, 0);
      const totalCalories = currentRecords.reduce((acc, r) => acc + r.calories, 0);
      const totalWater = currentRecords.reduce((acc, r) => acc + r.water, 0);

      const activeRecords = currentRecords.filter(
        (r) => r.steps > 0 || r.calories > 0 || r.water > 0
      );
      const activeDays = activeRecords.length;
      const divisor = activeDays > 0 ? activeDays : 1;

      const averageDailySteps =
        activeDays > 0 ? Math.round(totalSteps / divisor) : 0;
      const averageDailyWater =
        activeDays > 0 ? Math.round(totalWater / divisor) : 0;
      const averageDailyCalories =
        activeDays > 0 ? Math.round(totalCalories / divisor) : 0;

      // Calculate average goal completion across active days (or for the single day in daily view)
      let goalCompletionPercentage = 0;
      if (activeDays > 0) {
        const sumDayCompletions = activeRecords.reduce((acc, r) => {
          const sProg = calculateGoalProgress(r.steps, goals.steps_goal);
          const cProg = calculateGoalProgress(
            r.calories,
            goals.calories_goal_kcal
          );
          const wProg = calculateGoalProgress(r.water, goals.water_goal_ml);
          return (
            acc +
            (sProg.clampedPercentage +
              cProg.clampedPercentage +
              wProg.clampedPercentage) /
              3
          );
        }, 0);
        goalCompletionPercentage = Math.round(sumDayCompletions / activeDays);
      }

      const prevSteps = prevRecords.reduce((acc, r) => acc + r.steps, 0);
      const prevCalories = prevRecords.reduce((acc, r) => acc + r.calories, 0);
      const prevWater = prevRecords.reduce((acc, r) => acc + r.water, 0);

      const summary: ProgressAnalyticsSummary = {
        totalSteps,
        totalCalories,
        totalWater,
        averageDailySteps,
        averageDailyWater,
        averageDailyCalories,
        activeDays,
        totalDaysInPeriod,
        goalCompletionPercentage,
        comparison: {
          stepsDiff: totalSteps - prevSteps,
          stepsPercentChange: calcPercentChange(totalSteps, prevSteps),
          caloriesDiff: totalCalories - prevCalories,
          caloriesPercentChange: calcPercentChange(totalCalories, prevCalories),
          waterDiff: totalWater - prevWater,
          waterPercentChange: calcPercentChange(totalWater, prevWater),
        },
      };

      set({
        goals,
        recordsInPeriod: currentRecords,
        chartBars,
        summary,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load progress analytics.'),
      });
    }
  },

  setPeriodType: async (
    period: ProgressPeriodType,
    overrideAnchorDateISO?: string
  ) => {
    set({ periodType: period });
    await get().loadProgress(overrideAnchorDateISO);
  },

  navigatePeriod: async (direction: 'prev' | 'next') => {
    const { periodType, anchorDateISO } = get();
    const delta = direction === 'prev' ? -1 : 1;
    let nextAnchor = anchorDateISO;

    if (periodType === 'daily') {
      nextAnchor = addDaysToISODate(anchorDateISO, delta);
    } else if (periodType === 'weekly') {
      nextAnchor = addDaysToISODate(anchorDateISO, delta * 7);
    } else {
      const current = parseISODate(anchorDateISO);
      const targetMonth = new Date(
        current.getFullYear(),
        current.getMonth() + delta,
        1
      );
      nextAnchor = formatDateToISO(targetMonth);
    }

    await get().loadProgress(nextAnchor);
  },

  setSelectedMetric: (metric: ProgressChartMetric) => {
    set({ selectedMetric: metric });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export function useProgressViewModel() {
  return useProgressStore();
}
