import { create } from 'zustand';
import { DEFAULT_DAILY_GOALS } from '../../../core/constants/appConstants';
import { getErrorMessage } from '../../../core/errors/AppError';
import {
  BMIResult,
  calculateAgeFromDOB,
  calculateBMI,
} from '../../../core/utils/healthCalculations';
import {
  DailyGoalFormValues,
  UserProfileFormValues,
  dailyGoalSchema,
  userProfileSchema,
} from '../../../core/validation/schemas';
import { Gender } from '../../../models/UserProfile';
import { appSettingsRepository } from '../../../repositories/sqlite/SQLiteAppSettingsRepository';
import { dailyGoalRepository } from '../../../repositories/sqlite/SQLiteDailyGoalRepository';
import { userProfileRepository } from '../../../repositories/sqlite/SQLiteUserProfileRepository';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { useToastStore } from '../../../store/useToastStore';

export type OnboardingStep = 1 | 2 | 3 | 4;

export interface OnboardingDraftProfile {
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  height_cm: string;
  weight_kg: string;
}

export interface OnboardingDraftGoals {
  steps_goal: string;
  water_goal_ml: string;
  calories_goal_kcal: string;
}

interface OnboardingState {
  currentStep: OnboardingStep;
  draftProfile: OnboardingDraftProfile;
  draftGoals: OnboardingDraftGoals;
  validatedProfile: UserProfileFormValues | null;
  calculatedAge: number | null;
  bmiResult: BMIResult | null;
  isSubmitting: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;

  goToStep: (step: OnboardingStep) => void;
  nextFromWelcome: () => void;
  previousStep: () => void;
  updateDraftProfile: (partial: Partial<OnboardingDraftProfile>) => void;
  updateDraftGoals: (partial: Partial<OnboardingDraftGoals>) => void;
  submitPersonalDetailsStep: (values?: OnboardingDraftProfile) => boolean;
  completeOnboarding: (goalValues?: OnboardingDraftGoals) => Promise<boolean>;
  resetOnboardingFlow: () => void;
  clearError: () => void;
}

const initialDraftProfile: OnboardingDraftProfile = {
  full_name: '',
  date_of_birth: '1995-06-15',
  gender: 'prefer_not_to_say',
  height_cm: '170',
  weight_kg: '68',
};

const initialDraftGoals: OnboardingDraftGoals = {
  steps_goal: String(DEFAULT_DAILY_GOALS.stepsGoal),
  water_goal_ml: String(DEFAULT_DAILY_GOALS.waterGoalMl),
  calories_goal_kcal: String(DEFAULT_DAILY_GOALS.caloriesGoalKcal),
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 1,
  draftProfile: { ...initialDraftProfile },
  draftGoals: { ...initialDraftGoals },
  validatedProfile: null,
  calculatedAge: null,
  bmiResult: null,
  isSubmitting: false,
  error: null,
  fieldErrors: {},

  goToStep: (step: OnboardingStep) => {
    set({ currentStep: step, error: null, fieldErrors: {} });
  },

  nextFromWelcome: () => {
    set({ currentStep: 2, error: null, fieldErrors: {} });
  },

  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({
        currentStep: (currentStep - 1) as OnboardingStep,
        error: null,
        fieldErrors: {},
      });
    }
  },

  updateDraftProfile: (partial: Partial<OnboardingDraftProfile>) => {
    set((state) => ({
      draftProfile: { ...state.draftProfile, ...partial },
      error: null,
    }));
  },

  updateDraftGoals: (partial: Partial<OnboardingDraftGoals>) => {
    set((state) => ({
      draftGoals: { ...state.draftGoals, ...partial },
      error: null,
    }));
  },

  submitPersonalDetailsStep: (values?: OnboardingDraftProfile): boolean => {
    const inputToValidate = values ?? get().draftProfile;
    const parseResult = userProfileSchema.safeParse(inputToValidate);

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      set({
        fieldErrors: errors,
        error: 'Please correct the highlighted fields to continue.',
      });
      return false;
    }

    try {
      const validData = parseResult.data;
      const bmi = calculateBMI(validData.weight_kg, validData.height_cm);
      const age = calculateAgeFromDOB(validData.date_of_birth);

      set({
        draftProfile: {
          full_name: validData.full_name,
          date_of_birth: validData.date_of_birth,
          gender: validData.gender,
          height_cm: String(validData.height_cm),
          weight_kg: String(validData.weight_kg),
        },
        validatedProfile: validData,
        bmiResult: bmi,
        calculatedAge: age,
        fieldErrors: {},
        error: null,
        currentStep: 3,
      });
      return true;
    } catch (calcError) {
      set({
        error: getErrorMessage(calcError, 'Invalid height, weight, or date of birth.'),
      });
      return false;
    }
  },

  completeOnboarding: async (goalValues?: OnboardingDraftGoals): Promise<boolean> => {
    const state = get();
    let profileData = state.validatedProfile;

    if (!profileData) {
      const profileCheck = userProfileSchema.safeParse(state.draftProfile);
      if (!profileCheck.success) {
        set({
          currentStep: 2,
          error: 'Personal details are incomplete or invalid.',
        });
        return false;
      }
      profileData = profileCheck.data;
    }

    const goalsInput = goalValues ?? state.draftGoals;
    const goalsParseResult = dailyGoalSchema.safeParse(goalsInput);

    if (!goalsParseResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of goalsParseResult.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      set({
        fieldErrors: errors,
        error: 'Please enter valid daily goals before finishing setup.',
      });
      return false;
    }

    const validGoals: DailyGoalFormValues = goalsParseResult.data;

    set({ isSubmitting: true, error: null, fieldErrors: {} });
    try {
      await userProfileRepository.upsertProfile({
        full_name: profileData.full_name,
        date_of_birth: profileData.date_of_birth,
        gender: profileData.gender,
        height_cm: profileData.height_cm,
        weight_kg: profileData.weight_kg,
      });

      await dailyGoalRepository.upsertGoals({
        steps_goal: validGoals.steps_goal,
        water_goal_ml: validGoals.water_goal_ml,
        calories_goal_kcal: validGoals.calories_goal_kcal,
      });

      await appSettingsRepository.updateSettings({
        onboarding_completed: true,
      });

      const bootstrapStore = useAppBootstrapStore.getState();
      bootstrapStore.setOnboardingCompleted(true);
      bootstrapStore.notifyDataChanged();
      useToastStore
        .getState()
        .showToast('Welcome to HealthMate! Setup complete.', 'success');

      set({ isSubmitting: false });
      return true;
    } catch (dbError) {
      set({
        isSubmitting: false,
        error: getErrorMessage(
          dbError,
          'Failed to save your onboarding details.'
        ),
      });
      return false;
    }
  },

  resetOnboardingFlow: () => {
    set({
      currentStep: 1,
      draftProfile: { ...initialDraftProfile },
      draftGoals: { ...initialDraftGoals },
      validatedProfile: null,
      calculatedAge: null,
      bmiResult: null,
      isSubmitting: false,
      error: null,
      fieldErrors: {},
    });
  },

  clearError: () => {
    set({ error: null, fieldErrors: {} });
  },
}));

export function useOnboardingViewModel() {
  return useOnboardingStore();
}
