import { create } from 'zustand';
import { getErrorMessage } from '../../../core/errors/AppError';
import { calculateGoalProgress } from '../../../core/utils/healthCalculations';
import { DailyGoal } from '../../../models/DailyGoal';
import { HealthRecord } from '../../../models/HealthRecord';
import { dailyGoalRepository } from '../../../repositories/sqlite/SQLiteDailyGoalRepository';
import { healthRecordRepository } from '../../../repositories/sqlite/SQLiteHealthRecordRepository';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { useToastStore } from '../../../store/useToastStore';
import { useRecordsStore } from './useRecordsViewModel';

export interface MetricGoalBreakdown {
  current: number;
  goal: number;
  percentage: number;
  clampedPercentage: number;
  remaining: number;
  isCompleted: boolean;
}

export interface RecordGoalSummary {
  steps: MetricGoalBreakdown;
  calories: MetricGoalBreakdown;
  water: MetricGoalBreakdown;
}

interface RecordDetailsViewModelState {
  record: HealthRecord | null;
  goals: DailyGoal | null;
  goalSummary: RecordGoalSummary | null;
  isLoading: boolean;
  isDeleting: boolean;
  error: string | null;

  loadRecordDetails: (id: number) => Promise<void>;
  deleteCurrentRecord: () => Promise<boolean>;
  clearError: () => void;
}

export const useRecordDetailsStore = create<RecordDetailsViewModelState>((set, get) => ({
  record: null,
  goals: null,
  goalSummary: null,
  isLoading: false,
  isDeleting: false,
  error: null,

  loadRecordDetails: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const [record, goals] = await Promise.all([
        healthRecordRepository.getById(id),
        dailyGoalRepository.getGoals(),
      ]);

      if (!record) {
        set({
          record: null,
          goals,
          goalSummary: null,
          isLoading: false,
          error: 'Health record not found.',
        });
        return;
      }

      const stepsProgress = calculateGoalProgress(record.steps, goals.steps_goal);
      const caloriesProgress = calculateGoalProgress(
        record.calories,
        goals.calories_goal_kcal
      );
      const waterProgress = calculateGoalProgress(record.water, goals.water_goal_ml);

      set({
        record,
        goals,
        goalSummary: {
          steps: {
            current: record.steps,
            goal: goals.steps_goal,
            ...stepsProgress,
          },
          calories: {
            current: record.calories,
            goal: goals.calories_goal_kcal,
            ...caloriesProgress,
          },
          water: {
            current: record.water,
            goal: goals.water_goal_ml,
            ...waterProgress,
          },
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load record details.'),
      });
    }
  },

  deleteCurrentRecord: async (): Promise<boolean> => {
    const current = get().record;
    if (!current) return false;

    set({ isDeleting: true, error: null });
    try {
      await healthRecordRepository.delete(current.id);
      useAppBootstrapStore.getState().notifyDataChanged();
      await useRecordsStore.getState().loadRecords();
      useToastStore
        .getState()
        .showToast('Health record deleted.', 'success');
      set({
        isDeleting: false,
        record: null,
        goalSummary: null,
      });
      return true;
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Failed to delete health record.');
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        isDeleting: false,
        error: errMsg,
      });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export function useRecordDetailsViewModel() {
  return useRecordDetailsStore();
}
