import {
  CreateHealthRecordInput,
  HealthRecord,
  RecordQueryOptions,
  UpdateHealthRecordInput,
} from '../../models/HealthRecord';

export interface IHealthRecordRepository {
  getAll(options?: RecordQueryOptions): Promise<HealthRecord[]>;
  getById(id: number): Promise<HealthRecord | null>;
  getByDate(date: string): Promise<HealthRecord | null>;
  getByDateRange(startDate: string, endDate: string, sortOrder?: 'newest' | 'oldest'): Promise<HealthRecord[]>;
  create(input: CreateHealthRecordInput): Promise<HealthRecord>;
  update(id: number, input: UpdateHealthRecordInput): Promise<HealthRecord>;
  delete(id: number): Promise<void>;
  addWaterForDate(date: string, amountMl: number): Promise<HealthRecord>;
  insertSampleRecordsIfNotExist(records: CreateHealthRecordInput[]): Promise<number>;
}
