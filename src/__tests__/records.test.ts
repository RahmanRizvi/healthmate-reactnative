import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { setDatabaseExecutorForTesting } from '../core/database/database';
import { runMigrations } from '../core/database/migrations';
import { useRecordDetailsStore } from '../features/records/viewmodels/useRecordDetailsViewModel';
import { useRecordFormStore } from '../features/records/viewmodels/useRecordFormViewModel';
import { useRecordsStore } from '../features/records/viewmodels/useRecordsViewModel';
import { InMemorySQLiteExecutor } from './InMemorySQLiteExecutor';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Phase 3 — Core Health Records (Add, View, Edit, Delete, Search, Filter & Validation)', () => {
  let executor: InMemorySQLiteExecutor;

  beforeEach(async () => {
    executor = new InMemorySQLiteExecutor();
    setDatabaseExecutorForTesting(executor);
    await runMigrations(executor);

    useRecordsStore.setState({
      records: [],
      isLoading: false,
      isDeleting: false,
      error: null,
      searchQuery: '',
      filterType: 'all',
      customStartDate: '',
      customEndDate: '',
      sortOrder: 'newest',
    });

    useRecordFormStore.getState().initAddForm('2026-11-15');
  });

  afterEach(() => {
    setDatabaseExecutorForTesting(null);
  });

  test('RecordFormViewModel validates whole numbers, negative values, and required fields', async () => {
    const result1 = await useRecordFormStore.getState().submitForm({
      date: '2026-11-15',
      steps: '-50',
      calories: '400',
      water: '2000',
    });
    expect(result1).toBeNull();
    expect(useRecordFormStore.getState().fieldErrors.steps).toBe(
      'Steps cannot be negative.'
    );

    const result2 = await useRecordFormStore.getState().submitForm({
      date: '2026-11-15',
      steps: '7500.5',
      calories: 'abc',
      water: '',
    });
    expect(result2).toBeNull();
    expect(useRecordFormStore.getState().fieldErrors.steps).toBeDefined();
    expect(useRecordFormStore.getState().fieldErrors.calories).toBeDefined();
    expect(useRecordFormStore.getState().fieldErrors.water).toBeDefined();
  });

  test('Creates a record, prevents duplicate date with existingRecordId for editing, and updates preserving created_at', async () => {
    const created = await useRecordFormStore.getState().submitForm({
      date: '2026-11-15',
      steps: '7850',
      calories: '420',
      water: '2000',
    });
    expect(created).not.toBeNull();
    expect(created?.steps).toBe(7850);

    // Attempt to add another record on the same date
    useRecordFormStore.getState().initAddForm('2026-11-15');
    const duplicateAttempt = await useRecordFormStore.getState().submitForm({
      date: '2026-11-15',
      steps: '8000',
      calories: '450',
      water: '2100',
    });

    expect(duplicateAttempt).toBeNull();
    expect(useRecordFormStore.getState().duplicateDateRecordId).toBe(created?.id);
    expect(useRecordFormStore.getState().duplicateDateValue).toBe('2026-11-15');

    // Load record for edit and update values
    const loaded = await useRecordFormStore.getState().loadRecordForEdit(created!.id);
    expect(loaded).toBe(true);
    expect(useRecordFormStore.getState().draft.steps).toBe('7850');

    useRecordFormStore.getState().updateDraft({
      steps: '10500',
      calories: '550',
      water: '2600',
    });
    const updated = await useRecordFormStore.getState().submitForm();
    expect(updated).not.toBeNull();
    expect(updated?.steps).toBe(10500);
    expect(updated?.created_at).toBe(created?.created_at);
  });

  test('Prevents changing a record date during edit to a date already used by another record', async () => {
    const rec1 = await useRecordFormStore.getState().submitForm({
      date: '2026-11-14',
      steps: '6000',
      calories: '300',
      water: '1800',
    });
    const rec2 = await useRecordFormStore.getState().submitForm({
      date: '2026-11-15',
      steps: '7850',
      calories: '420',
      water: '2000',
    });

    await useRecordFormStore.getState().loadRecordForEdit(rec2!.id);
    useRecordFormStore.getState().updateDraft({ date: '2026-11-14' });

    const failedUpdate = await useRecordFormStore.getState().submitForm();
    expect(failedUpdate).toBeNull();
    expect(useRecordFormStore.getState().duplicateDateRecordId).toBe(rec1?.id);
  });

  test('RecordsViewModel supports date search, today/week/month/custom filters, and newest/oldest sorting', async () => {
    await useRecordFormStore.getState().submitForm({
      date: '2026-10-05',
      steps: '5000',
      calories: '250',
      water: '1500',
    });
    await useRecordFormStore.getState().submitForm({
      date: '2026-11-10',
      steps: '7000',
      calories: '380',
      water: '1900',
    });
    await useRecordFormStore.getState().submitForm({
      date: '2026-11-15',
      steps: '9500',
      calories: '510',
      water: '2500',
    });

    // Default newest-first
    await useRecordsStore.getState().loadRecords('2026-11-15');
    expect(useRecordsStore.getState().records.map((r) => r.date)).toEqual([
      '2026-11-15',
      '2026-11-10',
      '2026-10-05',
    ]);

    // Oldest-first sorting
    await useRecordsStore.getState().setSortOrder('oldest');
    expect(useRecordsStore.getState().records.map((r) => r.date)).toEqual([
      '2026-10-05',
      '2026-11-10',
      '2026-11-15',
    ]);

    // Today filter (reference: 2026-11-15)
    await useRecordsStore.getState().setFilterType('today', '2026-11-15');
    expect(useRecordsStore.getState().records.map((r) => r.date)).toEqual([
      '2026-11-15',
    ]);

    // This Week filter (week of 2026-11-15 is Mon 2026-11-09 to Sun 2026-11-15)
    await useRecordsStore.getState().setFilterType('week', '2026-11-15');
    expect(useRecordsStore.getState().records.map((r) => r.date)).toEqual([
      '2026-11-10',
      '2026-11-15',
    ]);

    // This Month filter (Nov 2026)
    await useRecordsStore.getState().setFilterType('month', '2026-11-15');
    expect(useRecordsStore.getState().records.length).toBe(2);

    // Custom Date Range filter
    await useRecordsStore
      .getState()
      .setCustomDateRange('2026-10-01', '2026-10-31');
    expect(useRecordsStore.getState().records.map((r) => r.date)).toEqual([
      '2026-10-05',
    ]);

    // Reset filters and search by date substring
    await useRecordsStore.getState().resetFilters();
    await useRecordsStore.getState().setSearchQuery('2026-11-10');
    expect(useRecordsStore.getState().records.map((r) => r.date)).toEqual([
      '2026-11-10',
    ]);
  });

  test('RecordDetailsViewModel computes goal completion percentages, remaining amounts, and deletes record', async () => {
    const created = await useRecordFormStore.getState().submitForm({
      date: '2026-11-15',
      steps: '7500', // 75% of 10000, 2500 remaining
      calories: '600', // 120% of 500, 0 remaining (completed)
      water: '2000', // 80% of 2500, 500 remaining
    });

    await useRecordDetailsStore.getState().loadRecordDetails(created!.id);
    const details = useRecordDetailsStore.getState();

    expect(details.record?.id).toBe(created?.id);
    expect(details.goalSummary?.steps.percentage).toBe(75);
    expect(details.goalSummary?.steps.remaining).toBe(2500);
    expect(details.goalSummary?.steps.isCompleted).toBe(false);

    expect(details.goalSummary?.calories.percentage).toBe(120);
    expect(details.goalSummary?.calories.clampedPercentage).toBe(100);
    expect(details.goalSummary?.calories.remaining).toBe(0);
    expect(details.goalSummary?.calories.isCompleted).toBe(true);

    expect(details.goalSummary?.water.percentage).toBe(80);
    expect(details.goalSummary?.water.remaining).toBe(500);

    // Delete record
    const deleted = await useRecordDetailsStore.getState().deleteCurrentRecord();
    expect(deleted).toBe(true);
    expect(useRecordDetailsStore.getState().record).toBeNull();
    expect(useRecordsStore.getState().records.length).toBe(0);
  });
});
