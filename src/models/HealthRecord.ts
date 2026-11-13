export interface HealthRecord {
  id: number;
  date: string; // YYYY-MM-DD
  steps: number;
  calories: number;
  water: number; // ml
  created_at: string;
  updated_at: string;
}

export interface CreateHealthRecordInput {
  date: string; // YYYY-MM-DD
  steps: number;
  calories: number;
  water: number; // ml
}

export interface UpdateHealthRecordInput {
  date: string; // YYYY-MM-DD
  steps: number;
  calories: number;
  water: number; // ml
}

export type RecordFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';
export type RecordSortOrder = 'newest' | 'oldest';

export interface RecordQueryOptions {
  searchDate?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: RecordSortOrder;
  limit?: number;
}
