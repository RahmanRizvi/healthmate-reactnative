import { create } from 'zustand';
import { getErrorMessage } from '../../../core/errors/AppError';
import {
  formatDateToISO,
  getMonthDateRange,
  getWeekDateRange,
  isValidISODate,
} from '../../../core/utils/dateUtils';
import {
  HealthRecord,
  RecordFilterType,
  RecordQueryOptions,
  RecordSortOrder,
} from '../../../models/HealthRecord';
import { healthRecordRepository } from '../../../repositories/sqlite/SQLiteHealthRecordRepository';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { useToastStore } from '../../../store/useToastStore';

interface RecordsViewModelState {
  records: HealthRecord[];
  isLoading: boolean;
  isDeleting: boolean;
  error: string | null;
  searchQuery: string;
  filterType: RecordFilterType;
  customStartDate: string;
  customEndDate: string;
  sortOrder: RecordSortOrder;

  loadRecords: (referenceDateISO?: string) => Promise<void>;
  setSearchQuery: (query: string) => Promise<void>;
  setFilterType: (filter: RecordFilterType, referenceDateISO?: string) => Promise<void>;
  setCustomDateRange: (startDate: string, endDate: string) => Promise<void>;
  setSortOrder: (sortOrder: RecordSortOrder) => Promise<void>;
  resetFilters: () => Promise<void>;
  deleteRecord: (id: number) => Promise<boolean>;
  clearError: () => void;
}

export const useRecordsStore = create<RecordsViewModelState>((set, get) => ({
  records: [],
  isLoading: false,
  isDeleting: false,
  error: null,
  searchQuery: '',
  filterType: 'all',
  customStartDate: '',
  customEndDate: '',
  sortOrder: 'newest',

  loadRecords: async (referenceDateISO?: string) => {
    const state = get();
    const todayISO = referenceDateISO ?? formatDateToISO();
    const options: RecordQueryOptions = {
      sortOrder: state.sortOrder,
    };

    if (state.searchQuery.trim().length > 0) {
      options.searchDate = state.searchQuery.trim();
    }

    if (state.filterType === 'today') {
      options.startDate = todayISO;
      options.endDate = todayISO;
    } else if (state.filterType === 'week') {
      const { startDate, endDate } = getWeekDateRange(todayISO);
      options.startDate = startDate;
      options.endDate = endDate;
    } else if (state.filterType === 'month') {
      const { startDate, endDate } = getMonthDateRange(todayISO);
      options.startDate = startDate;
      options.endDate = endDate;
    } else if (state.filterType === 'custom') {
      if (state.customStartDate && isValidISODate(state.customStartDate)) {
        options.startDate = state.customStartDate;
      }
      if (state.customEndDate && isValidISODate(state.customEndDate)) {
        options.endDate = state.customEndDate;
      }
      if (
        options.startDate &&
        options.endDate &&
        options.startDate > options.endDate
      ) {
        set({
          error: 'Start date cannot be after end date.',
          records: [],
          isLoading: false,
        });
        return;
      }
    }

    set({ isLoading: true, error: null });
    try {
      const records = await healthRecordRepository.getAll(options);
      set({ records, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load health records.'),
      });
    }
  },

  setSearchQuery: async (query: string) => {
    set({ searchQuery: query });
    await get().loadRecords();
  },

  setFilterType: async (filter: RecordFilterType, referenceDateISO?: string) => {
    set({ filterType: filter, error: null });
    await get().loadRecords(referenceDateISO);
  },

  setCustomDateRange: async (startDate: string, endDate: string) => {
    set({
      filterType: 'custom',
      customStartDate: startDate,
      customEndDate: endDate,
      error: null,
    });
    await get().loadRecords();
  },

  setSortOrder: async (sortOrder: RecordSortOrder) => {
    set({ sortOrder });
    await get().loadRecords();
  },

  resetFilters: async () => {
    set({
      searchQuery: '',
      filterType: 'all',
      customStartDate: '',
      customEndDate: '',
      sortOrder: 'newest',
      error: null,
    });
    await get().loadRecords();
  },

  deleteRecord: async (id: number): Promise<boolean> => {
    set({ isDeleting: true, error: null });
    try {
      await healthRecordRepository.delete(id);
      useAppBootstrapStore.getState().notifyDataChanged();
      await get().loadRecords();
      useToastStore.getState().showToast('Health record deleted.', 'success');
      set({ isDeleting: false });
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

export function useRecordsViewModel() {
  return useRecordsStore();
}
