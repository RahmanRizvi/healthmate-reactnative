import { create } from 'zustand';
import { initializeDatabase } from '../core/database/database';
import { getErrorMessage } from '../core/errors/AppError';
import { appSettingsRepository } from '../repositories/sqlite/SQLiteAppSettingsRepository';
import { userProfileRepository } from '../repositories/sqlite/SQLiteUserProfileRepository';

interface AppBootstrapState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  onboardingCompleted: boolean;
  dataRevision: number;
  bootstrap: () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => void;
  notifyDataChanged: () => void;
}

export const useAppBootstrapStore = create<AppBootstrapState>((set) => ({
  isReady: false,
  isLoading: true,
  error: null,
  onboardingCompleted: false,
  dataRevision: 0,

  bootstrap: async () => {
    set({ isLoading: true, error: null });
    try {
      await initializeDatabase();
      const [settings, profile] = await Promise.all([
        appSettingsRepository.getSettings(),
        userProfileRepository.getProfile(),
      ]);

      const completed = Boolean(settings.onboarding_completed && profile !== null);
      set({
        isReady: true,
        isLoading: false,
        onboardingCompleted: completed,
      });
    } catch (error) {
      set({
        isReady: false,
        isLoading: false,
        error: getErrorMessage(error, 'Failed to initialize HealthMate database.'),
      });
    }
  },

  setOnboardingCompleted: (completed: boolean) => {
    set({ onboardingCompleted: completed });
  },

  notifyDataChanged: () => {
    set((state) => ({ dataRevision: state.dataRevision + 1 }));
  },
}));
