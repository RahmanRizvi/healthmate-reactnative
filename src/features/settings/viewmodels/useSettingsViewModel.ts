import { create } from 'zustand';
import { resetAllDatabaseData } from '../../../core/database/database';
import { getErrorMessage } from '../../../core/errors/AppError';
import { BMIResult, calculateBMI } from '../../../core/utils/healthCalculations';
import { AppSettings, UnitSystem } from '../../../models/AppSettings';
import { DailyGoal } from '../../../models/DailyGoal';
import { UserProfile } from '../../../models/UserProfile';
import { appSettingsRepository } from '../../../repositories/sqlite/SQLiteAppSettingsRepository';
import { dailyGoalRepository } from '../../../repositories/sqlite/SQLiteDailyGoalRepository';
import { healthRecordRepository } from '../../../repositories/sqlite/SQLiteHealthRecordRepository';
import { userProfileRepository } from '../../../repositories/sqlite/SQLiteUserProfileRepository';
import { exportHealthRecordsToCSV } from '../../../services/csvExportService';
import {
  disableDailyReminderNotification,
  enableDailyReminderNotification,
} from '../../../services/notificationService';
import { insertSampleDemonstrationData } from '../../../services/sampleDataService';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { useToastStore } from '../../../store/useToastStore';
import { useOnboardingStore } from '../../onboarding/viewmodels/useOnboardingViewModel';

interface SettingsViewModelState {
  profile: UserProfile | null;
  goals: DailyGoal | null;
  settings: AppSettings | null;
  bmiResult: BMIResult | null;
  totalRecordCount: number;
  isLoading: boolean;
  isExporting: boolean;
  isResetting: boolean;
  isLoadingSampleData: boolean;
  error: string | null;
  successMessage: string | null;

  loadSettingsData: () => Promise<void>;
  updateUnitSystem: (unitSystem: UnitSystem) => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  updateReminderHour: (hour: number) => Promise<void>;
  exportRecordsCSV: () => Promise<boolean>;
  loadSampleData: (referenceDateISO?: string) => Promise<number>;
  resetApplicationData: () => Promise<boolean>;
  clearMessages: () => void;
}

export const useSettingsStore = create<SettingsViewModelState>((set, get) => ({
  profile: null,
  goals: null,
  settings: null,
  bmiResult: null,
  totalRecordCount: 0,
  isLoading: false,
  isExporting: false,
  isResetting: false,
  isLoadingSampleData: false,
  error: null,
  successMessage: null,

  loadSettingsData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [profile, goals, settings, allRecords] = await Promise.all([
        userProfileRepository.getProfile(),
        dailyGoalRepository.getGoals(),
        appSettingsRepository.getSettings(),
        healthRecordRepository.getAll(),
      ]);

      const bmiResult = profile
        ? calculateBMI(profile.weight_kg, profile.height_cm)
        : null;

      set({
        profile,
        goals,
        settings,
        bmiResult,
        totalRecordCount: allRecords.length,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load settings.'),
      });
    }
  },

  updateUnitSystem: async (unitSystem: UnitSystem) => {
    set({ error: null, successMessage: null });
    try {
      const updated = await appSettingsRepository.updateSettings({
        unit_system: unitSystem,
      });
      useAppBootstrapStore.getState().notifyDataChanged();
      const msg = `Measurement preference updated to ${
        unitSystem === 'metric' ? 'Metric (cm, kg, ml)' : 'Imperial (ft/in, lb, fl oz)'
      }.`;
      useToastStore.getState().showToast(msg, 'success');
      set({
        settings: updated,
        successMessage: msg,
      });
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Failed to update measurement preference.');
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        error: errMsg,
      });
    }
  },

  toggleNotifications: async (enabled: boolean) => {
    set({ error: null, successMessage: null });
    const currentSettings = get().settings;
    const hour = currentSettings?.reminder_hour ?? 20;
    const minute = currentSettings?.reminder_minute ?? 0;

    try {
      if (enabled) {
        await enableDailyReminderNotification(hour, minute);
      } else {
        await disableDailyReminderNotification();
      }

      const updated = await appSettingsRepository.updateSettings({
        notifications_enabled: enabled,
      });

      const msg = enabled
        ? `Daily reminder enabled for ${String(hour).padStart(2, '0')}:${String(
            minute
          ).padStart(2, '0')}.`
        : 'Daily reminders disabled.';
      useToastStore.getState().showToast(msg, 'success');

      set({
        settings: updated,
        successMessage: msg,
      });
    } catch (error) {
      const errMsg = getErrorMessage(
        error,
        'Could not update notification settings.'
      );
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        error: errMsg,
      });
    }
  },

  updateReminderHour: async (hour: number) => {
    set({ error: null, successMessage: null });
    try {
      const currentSettings = get().settings;
      const updated = await appSettingsRepository.updateSettings({
        reminder_hour: hour,
        reminder_minute: 0,
      });

      if (currentSettings?.notifications_enabled) {
        await enableDailyReminderNotification(hour, 0);
      }

      const msg = `Reminder time set to ${String(hour).padStart(2, '0')}:00.`;
      useToastStore.getState().showToast(msg, 'success');

      set({
        settings: updated,
        successMessage: msg,
      });
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Failed to update reminder time.');
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        error: errMsg,
      });
    }
  },

  exportRecordsCSV: async (): Promise<boolean> => {
    set({ isExporting: true, error: null, successMessage: null });
    try {
      const records = await healthRecordRepository.getAll({ sortOrder: 'newest' });
      const result = await exportHealthRecordsToCSV(records);
      const msg = `Exported ${result.recordCount} health ${
        result.recordCount === 1 ? 'record' : 'records'
      } to ${result.fileName}.`;
      useToastStore.getState().showToast(msg, 'success');
      set({
        isExporting: false,
        successMessage: msg,
      });
      return true;
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Failed to export health records to CSV.');
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        isExporting: false,
        error: errMsg,
      });
      return false;
    }
  },

  loadSampleData: async (referenceDateISO?: string): Promise<number> => {
    set({ isLoadingSampleData: true, error: null, successMessage: null });
    try {
      const inserted = await insertSampleDemonstrationData(referenceDateISO);
      useAppBootstrapStore.getState().notifyDataChanged();
      await get().loadSettingsData();
      const msg =
        inserted > 0
          ? `Inserted ${inserted} sample health ${
              inserted === 1 ? 'record' : 'records'
            }.`
          : 'Sample dates already have records — no data was overwritten.';
      useToastStore
        .getState()
        .showToast(msg, inserted > 0 ? 'success' : 'info');
      set({
        isLoadingSampleData: false,
        successMessage: msg,
      });
      return inserted;
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Failed to insert sample records.');
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        isLoadingSampleData: false,
        error: errMsg,
      });
      return 0;
    }
  },

  resetApplicationData: async (): Promise<boolean> => {
    set({ isResetting: true, error: null, successMessage: null });
    try {
      await disableDailyReminderNotification();
      await resetAllDatabaseData();
      useOnboardingStore.getState().resetOnboardingFlow();
      const bootstrapStore = useAppBootstrapStore.getState();
      bootstrapStore.setOnboardingCompleted(false);
      bootstrapStore.notifyDataChanged();
      useToastStore
        .getState()
        .showToast('All application data has been reset.', 'info');
      set({
        isResetting: false,
        profile: null,
        totalRecordCount: 0,
      });
      return true;
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Failed to reset application data.');
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        isResetting: false,
        error: errMsg,
      });
      return false;
    }
  },

  clearMessages: () => {
    set({ error: null, successMessage: null });
  },
}));

export function useSettingsViewModel() {
  return useSettingsStore();
}
