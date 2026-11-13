import { create } from 'zustand';
import {
  DuplicateDateError,
  getErrorMessage,
} from '../../../core/errors/AppError';
import { formatDateToISO } from '../../../core/utils/dateUtils';
import { healthRecordSchema } from '../../../core/validation/schemas';
import { HealthRecord } from '../../../models/HealthRecord';
import { healthRecordRepository } from '../../../repositories/sqlite/SQLiteHealthRecordRepository';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { useToastStore } from '../../../store/useToastStore';
import { useRecordsStore } from './useRecordsViewModel';

export interface RecordFormDraft {
  date: string;
  steps: string;
  calories: string;
  water: string;
}

interface RecordFormViewModelState {
  mode: 'add' | 'edit';
  editingRecordId: number | null;
  loadedRecord: HealthRecord | null;
  draft: RecordFormDraft;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  duplicateDateRecordId: number | null;
  duplicateDateValue: string | null;

  initAddForm: (initialDate?: string) => void;
  loadRecordForEdit: (id: number) => Promise<boolean>;
  updateDraft: (partial: Partial<RecordFormDraft>) => void;
  submitForm: (overrideDraft?: RecordFormDraft) => Promise<HealthRecord | null>;
  clearFormError: () => void;
}

const createDefaultDraft = (date?: string): RecordFormDraft => ({
  date: date ?? formatDateToISO(),
  steps: '',
  calories: '',
  water: '',
});

export const useRecordFormStore = create<RecordFormViewModelState>((set, get) => ({
  mode: 'add',
  editingRecordId: null,
  loadedRecord: null,
  draft: createDefaultDraft(),
  isLoading: false,
  isSubmitting: false,
  error: null,
  fieldErrors: {},
  duplicateDateRecordId: null,
  duplicateDateValue: null,

  initAddForm: (initialDate?: string) => {
    set({
      mode: 'add',
      editingRecordId: null,
      loadedRecord: null,
      draft: createDefaultDraft(initialDate),
      isLoading: false,
      isSubmitting: false,
      error: null,
      fieldErrors: {},
      duplicateDateRecordId: null,
      duplicateDateValue: null,
    });
  },

  loadRecordForEdit: async (id: number): Promise<boolean> => {
    set({
      mode: 'edit',
      editingRecordId: id,
      isLoading: true,
      error: null,
      fieldErrors: {},
      duplicateDateRecordId: null,
      duplicateDateValue: null,
    });

    try {
      const record = await healthRecordRepository.getById(id);
      if (!record) {
        set({
          isLoading: false,
          loadedRecord: null,
          error: 'The requested health record could not be found.',
        });
        return false;
      }

      set({
        loadedRecord: record,
        draft: {
          date: record.date,
          steps: String(record.steps),
          calories: String(record.calories),
          water: String(record.water),
        },
        isLoading: false,
      });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load health record for editing.'),
      });
      return false;
    }
  },

  updateDraft: (partial: Partial<RecordFormDraft>) => {
    set((state) => ({
      draft: { ...state.draft, ...partial },
      error: null,
      duplicateDateRecordId: null,
      duplicateDateValue: null,
    }));
  },

  submitForm: async (overrideDraft?: RecordFormDraft): Promise<HealthRecord | null> => {
    const state = get();
    const inputToValidate = overrideDraft ?? state.draft;

    set({
      error: null,
      fieldErrors: {},
      duplicateDateRecordId: null,
      duplicateDateValue: null,
    });

    const parsed = healthRecordSchema.safeParse(inputToValidate);
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
        error: 'Please fix the validation errors before saving.',
      });
      return null;
    }

    set({ isSubmitting: true });
    try {
      let savedRecord: HealthRecord;
      if (state.mode === 'edit' && state.editingRecordId !== null) {
        savedRecord = await healthRecordRepository.update(
          state.editingRecordId,
          parsed.data
        );
      } else {
        savedRecord = await healthRecordRepository.create(parsed.data);
      }

      useAppBootstrapStore.getState().notifyDataChanged();
      await useRecordsStore.getState().loadRecords();

      useToastStore
        .getState()
        .showToast(
          state.mode === 'edit'
            ? 'Health record updated successfully.'
            : 'Health record saved successfully.',
          'success'
        );

      set({
        isSubmitting: false,
        loadedRecord: savedRecord,
      });
      return savedRecord;
    } catch (error) {
      if (error instanceof DuplicateDateError) {
        let existingId = error.existingRecordId ?? null;
        if (!existingId) {
          const existing = await healthRecordRepository.getByDate(error.date);
          existingId = existing?.id ?? null;
        }
        useToastStore.getState().showToast(error.message, 'error');
        set({
          isSubmitting: false,
          error: error.message,
          duplicateDateRecordId: existingId,
          duplicateDateValue: error.date,
          fieldErrors: { date: error.message },
        });
        return null;
      }

      const errMsg = getErrorMessage(error, 'Failed to save health record.');
      useToastStore.getState().showToast(errMsg, 'error');
      set({
        isSubmitting: false,
        error: errMsg,
      });
      return null;
    }
  },

  clearFormError: () => {
    set({
      error: null,
      fieldErrors: {},
      duplicateDateRecordId: null,
      duplicateDateValue: null,
    });
  },
}));

export function useRecordFormViewModel() {
  return useRecordFormStore();
}
