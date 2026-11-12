import { create } from 'zustand';
import { getErrorMessage } from '../../../core/errors/AppError';
import {
  BMIResult,
  calculateAgeFromDOB,
  calculateBMI,
} from '../../../core/utils/healthCalculations';
import {
  dailyGoalSchema,
  userProfileSchema,
} from '../../../core/validation/schemas';
import { DailyGoal } from '../../../models/DailyGoal';
import { Gender, UserProfile } from '../../../models/UserProfile';
import { dailyGoalRepository } from '../../../repositories/sqlite/SQLiteDailyGoalRepository';
import { userProfileRepository } from '../../../repositories/sqlite/SQLiteUserProfileRepository';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { useToastStore } from '../../../store/useToastStore';

export interface ProfileFormDraft {
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  height_cm: string;
  weight_kg: string;
}

export interface GoalsFormDraft {
  steps_goal: string;
  water_goal_ml: string;
  calories_goal_kcal: string;
}

interface ProfileViewModelState {
  profile: UserProfile | null;
  goals: DailyGoal | null;
  profileDraft: ProfileFormDraft;
  goalsDraft: GoalsFormDraft;
  bmiResult: BMIResult | null;
  age: number | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  fieldErrors: Record<string, string>;

  loadProfileAndGoals: () => Promise<void>;
  updateProfileDraft: (partial: Partial<ProfileFormDraft>) => void;
  updateGoalsDraft: (partial: Partial<GoalsFormDraft>) => void;
  saveProfile: (draft?: ProfileFormDraft) => Promise<boolean>;
  saveDailyGoals: (draft?: GoalsFormDraft) => Promise<boolean>;
  clearMessages: () => void;
}

const defaultProfileDraft: ProfileFormDraft = {
  full_name: '',
  date_of_birth: '1995-06-15',
  gender: 'prefer_not_to_say',
  height_cm: '170',
  weight_kg: '68',
};

const defaultGoalsDraft: GoalsFormDraft = {
  steps_goal: '10000',
  water_goal_ml: '2500',
  calories_goal_kcal: '500',
};

export const useProfileStore = create<ProfileViewModelState>((set, get) => ({
  profile: null,
  goals: null,
  profileDraft: { ...defaultProfileDraft },
  goalsDraft: { ...defaultGoalsDraft },
  bmiResult: null,
  age: null,
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,
  fieldErrors: {},

  loadProfileAndGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const [profile, goals] = await Promise.all([
        userProfileRepository.getProfile(),
        dailyGoalRepository.getGoals(),
      ]);

      let bmiResult: BMIResult | null = null;
      let age: number | null = null;
      let profileDraft = { ...defaultProfileDraft };

      if (profile) {
        bmiResult = calculateBMI(profile.weight_kg, profile.height_cm);
        age = calculateAgeFromDOB(profile.date_of_birth);
        profileDraft = {
          full_name: profile.full_name,
          date_of_birth: profile.date_of_birth,
          gender: profile.gender,
          height_cm: String(profile.height_cm),
          weight_kg: String(profile.weight_kg),
        };
      }

      const goalsDraft: GoalsFormDraft = {
        steps_goal: String(goals.steps_goal),
        water_goal_ml: String(goals.water_goal_ml),
        calories_goal_kcal: String(goals.calories_goal_kcal),
      };

      set({
        profile,
        goals,
        profileDraft,
        goalsDraft,
        bmiResult,
        age,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load profile and goals.'),
      });
    }
  },

  updateProfileDraft: (partial: Partial<ProfileFormDraft>) => {
    set((state) => ({
      profileDraft: { ...state.profileDraft, ...partial },
      error: null,
      successMessage: null,
    }));
  },

  updateGoalsDraft: (partial: Partial<GoalsFormDraft>) => {
    set((state) => ({
      goalsDraft: { ...state.goalsDraft, ...partial },
      error: null,
      successMessage: null,
    }));
  },

  saveProfile: async (draft?: ProfileFormDraft): Promise<boolean> => {
    const inputToValidate = draft ?? get().profileDraft;
    set({ error: null, successMessage: null, fieldErrors: {} });
    const parsed = userProfileSchema.safeParse(inputToValidate);

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      set({
        fieldErrors: errors,
        error: 'Please check the highlighted profile fields.',
      });
      return false;
    }

    set({ isSaving: true });
    try {
      const updated = await userProfileRepository.upsertProfile(parsed.data);
      const bmiResult = calculateBMI(updated.weight_kg, updated.height_cm);
      const age = calculateAgeFromDOB(updated.date_of_birth);

      useAppBootstrapStore.getState().notifyDataChanged();
      useToastStore
        .getState()
        .showToast('Profile saved successfully.', 'success');

      set({
        profile: updated,
        profileDraft: {
          full_name: updated.full_name,
          date_of_birth: updated.date_of_birth,
          gender: updated.gender,
          height_cm: String(updated.height_cm),
          weight_kg: String(updated.weight_kg),
        },
        bmiResult,
        age,
        isSaving: false,
        successMessage: 'Profile saved successfully.',
      });
      return true;
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Failed to update profile.');
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        isSaving: false,
        error: errMsg,
      });
      return false;
    }
  },

  saveDailyGoals: async (draft?: GoalsFormDraft): Promise<boolean> => {
    const inputToValidate = draft ?? get().goalsDraft;
    set({ error: null, successMessage: null, fieldErrors: {} });
    const parsed = dailyGoalSchema.safeParse(inputToValidate);

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      set({
        fieldErrors: errors,
        error: 'Please enter valid whole numbers for your daily goals.',
      });
      return false;
    }

    set({ isSaving: true });
    try {
      const updatedGoals = await dailyGoalRepository.upsertGoals(parsed.data);
      useAppBootstrapStore.getState().notifyDataChanged();
      useToastStore
        .getState()
        .showToast('Daily goals updated successfully.', 'success');

      set({
        goals: updatedGoals,
        goalsDraft: {
          steps_goal: String(updatedGoals.steps_goal),
          water_goal_ml: String(updatedGoals.water_goal_ml),
          calories_goal_kcal: String(updatedGoals.calories_goal_kcal),
        },
        isSaving: false,
        successMessage: 'Daily goals updated successfully.',
      });
      return true;
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Failed to update daily goals.');
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        isSaving: false,
        error: errMsg,
      });
      return false;
    }
  },

  clearMessages: () => {
    set({ error: null, successMessage: null, fieldErrors: {} });
  },
}));

export function useProfileViewModel() {
  return useProfileStore();
}
