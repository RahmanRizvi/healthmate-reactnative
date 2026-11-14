import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowDownUp,
  Calendar,
  Clock,
  Droplets,
  Edit3,
  Filter,
  Flame,
  Footprints,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';
import {
  Button,
  Card,
  ConfirmDialog,
  DatePickerField,
  EmptyState,
  ErrorBanner,
  FormInput,
  LoadingState,
  ProgressBar,
  ScreenContainer,
  SectionHeader,
} from '../../../components';
import { Colors, IconSize, Radius, Spacing, Typography } from '../../../core/theme';
import {
  formatReadableDate,
  formatTimestamp,
} from '../../../core/utils/dateUtils';
import { RecordFilterType } from '../../../models/HealthRecord';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { HealthRecordCard } from '../components/HealthRecordCard';
import { useRecordDetailsViewModel } from '../viewmodels/useRecordDetailsViewModel';
import { useRecordFormViewModel } from '../viewmodels/useRecordFormViewModel';
import { useRecordsViewModel } from '../viewmodels/useRecordsViewModel';

const FILTER_OPTIONS: { value: RecordFilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Date Range' },
];

export function RecordsListView() {
  const {
    records,
    isLoading,
    error,
    searchQuery,
    filterType,
    customStartDate,
    customEndDate,
    sortOrder,
    loadRecords,
    setSearchQuery,
    setFilterType,
    setCustomDateRange,
    setSortOrder,
    resetFilters,
    clearError,
  } = useRecordsViewModel();

  const dataRevision = useAppBootstrapStore((state) => state.dataRevision);

  useEffect(() => {
    loadRecords();
  }, [loadRecords, dataRevision]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  return (
    <ScreenContainer>
      <SectionHeader
        title="Health Records"
        subtitle={`${records.length} ${records.length === 1 ? 'record' : 'records'} shown`}
        rightAction={
          <Button
            testID="records-add-btn"
            title="Add Record"
            size="sm"
            onPress={() => router.push('/records/add')}
            icon={<Plus size={IconSize.sm} color={Colors.surface} />}
          />
        }
      />

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

      {/* Search by Date & Sort Controls */}
      <Card style={styles.filterCard}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputBox}>
            <Search size={IconSize.sm} color={Colors.textSecondary} />
            <TextInput
              testID="records-search-input"
              style={styles.searchInput}
              placeholder="Search date (YYYY-MM-DD)"
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={IconSize.sm} color={Colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            testID="records-sort-toggle"
            onPress={toggleSortOrder}
            style={styles.sortButton}
          >
            <ArrowDownUp size={IconSize.sm} color={Colors.primary} />
            <Text style={styles.sortButtonText}>
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
            </Text>
          </Pressable>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          {FILTER_OPTIONS.map((item) => {
            const active = filterType === item.value;
            return (
              <Pressable
                key={item.value}
                testID={`filter-chip-${item.value}`}
                onPress={() => setFilterType(item.value)}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom Date Range Filter Inputs */}
        {filterType === 'custom' ? (
          <View style={styles.customRangeBox}>
            <View style={styles.customRangeRow}>
              <View style={styles.halfCol}>
                <DatePickerField
                  testID="custom-range-start"
                  label="Start Date"
                  value={customStartDate}
                  onChange={(start) => setCustomDateRange(start, customEndDate)}
                  helperText="YYYY-MM-DD"
                />
              </View>
              <View style={styles.halfCol}>
                <DatePickerField
                  testID="custom-range-end"
                  label="End Date"
                  value={customEndDate}
                  onChange={(end) => setCustomDateRange(customStartDate, end)}
                  helperText="YYYY-MM-DD"
                />
              </View>
            </View>
          </View>
        ) : null}

        {searchQuery.length > 0 || filterType !== 'all' ? (
          <Pressable onPress={resetFilters} style={styles.resetFilterLink}>
            <RotateCcw size={14} color={Colors.primary} />
            <Text style={styles.resetFilterText}>Reset search and filters</Text>
          </Pressable>
        ) : null}
      </Card>

      {/* Records List */}
      {isLoading ? (
        <LoadingState message="Loading health records..." />
      ) : records.length === 0 ? (
        <EmptyState
          title="No Health Records Found"
          description={
            searchQuery.length > 0 || filterType !== 'all'
              ? 'No saved records match your current search or date filter.'
              : 'Start tracking your daily wellness by logging your first health record.'
          }
          icon={<Filter size={IconSize.lg} color={Colors.primary} />}
          actionTitle={
            searchQuery.length > 0 || filterType !== 'all'
              ? 'Clear Filters'
              : 'Add Today’s Record'
          }
          onAction={
            searchQuery.length > 0 || filterType !== 'all'
              ? resetFilters
              : () => router.push('/records/add')
          }
        />
      ) : (
        <View>
          {records.map((record) => (
            <HealthRecordCard
              key={record.id}
              record={record}
              onPress={() => router.push(`/records/details/${record.id}`)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

export function AddRecordView() {
  const params = useLocalSearchParams<{ date?: string }>();
  const {
    draft,
    isSubmitting,
    error,
    fieldErrors,
    duplicateDateRecordId,
    duplicateDateValue,
    initAddForm,
    updateDraft,
    submitForm,
    clearFormError,
  } = useRecordFormViewModel();

  useEffect(() => {
    initAddForm(typeof params.date === 'string' ? params.date : undefined);
  }, [initAddForm, params.date]);

  const handleSave = async () => {
    const created = await submitForm();
    if (created) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/records');
      }
    }
  };

  return (
    <ScreenContainer keyboardAvoiding>
      {error ? (
        <ErrorBanner
          message={error}
          onDismiss={clearFormError}
          actionLabel={
            duplicateDateRecordId
              ? `Edit ${duplicateDateValue ?? ''} Record`
              : undefined
          }
          onAction={
            duplicateDateRecordId
              ? () => router.replace(`/records/edit/${duplicateDateRecordId}`)
              : undefined
          }
        />
      ) : null}

      <Card style={styles.formCard}>
        <DatePickerField
          testID="record-form-date"
          label="Record Date"
          value={draft.date}
          onChange={(dateISO) => updateDraft({ date: dateISO })}
          error={fieldErrors.date}
          maximumDate={new Date()}
        />

        <FormInput
          testID="record-form-steps"
          label="Steps"
          unit="steps"
          keyboardType="numeric"
          placeholder="e.g. 7850"
          value={draft.steps}
          onChangeText={(text) => updateDraft({ steps: text })}
          error={fieldErrors.steps}
          leftIcon={<Footprints size={IconSize.md} color={Colors.steps} />}
        />

        <FormInput
          testID="record-form-calories"
          label="Calories Burned"
          unit="kcal"
          keyboardType="numeric"
          placeholder="e.g. 420"
          value={draft.calories}
          onChangeText={(text) => updateDraft({ calories: text })}
          error={fieldErrors.calories}
          leftIcon={<Flame size={IconSize.md} color={Colors.calories} />}
        />

        <FormInput
          testID="record-form-water"
          label="Water Intake"
          unit="ml"
          keyboardType="numeric"
          placeholder="e.g. 2000"
          value={draft.water}
          onChangeText={(text) => updateDraft({ water: text })}
          error={fieldErrors.water}
          leftIcon={<Droplets size={IconSize.md} color={Colors.water} />}
        />
      </Card>

      <View style={styles.formActionsRow}>
        <Button
          testID="record-form-cancel"
          title="Cancel"
          variant="outline"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/records');
            }
          }}
          disabled={isSubmitting}
          style={styles.cancelButton}
        />
        <Button
          testID="record-form-save"
          title="Save Record"
          variant="primary"
          onPress={handleSave}
          loading={isSubmitting}
          icon={<Save size={IconSize.sm} color={Colors.surface} />}
          style={styles.saveButton}
        />
      </View>
    </ScreenContainer>
  );
}

export function EditRecordView() {
  const params = useLocalSearchParams<{ id?: string }>();
  const recordId = Number(params.id);

  const {
    loadedRecord,
    draft,
    isLoading,
    isSubmitting,
    error,
    fieldErrors,
    loadRecordForEdit,
    updateDraft,
    submitForm,
    clearFormError,
  } = useRecordFormViewModel();

  useEffect(() => {
    if (Number.isFinite(recordId) && recordId > 0) {
      loadRecordForEdit(recordId);
    }
  }, [loadRecordForEdit, recordId]);

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <LoadingState message="Loading health record..." />
      </ScreenContainer>
    );
  }

  if (!loadedRecord) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Record Not Found"
          description={error ?? 'This health record could not be loaded.'}
          actionTitle="Back to Records"
          onAction={() => router.replace('/(tabs)/records')}
        />
      </ScreenContainer>
    );
  }

  const handleUpdate = async () => {
    const updated = await submitForm();
    if (updated) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/records/details/${updated.id}`);
      }
    }
  };

  return (
    <ScreenContainer keyboardAvoiding>
      {error ? (
        <ErrorBanner message={error} onDismiss={clearFormError} />
      ) : null}

      <Card style={styles.formCard}>
        <DatePickerField
          testID="edit-record-date"
          label="Record Date"
          value={draft.date}
          onChange={(dateISO) => updateDraft({ date: dateISO })}
          error={fieldErrors.date}
          maximumDate={new Date()}
        />

        <FormInput
          testID="edit-record-steps"
          label="Steps"
          unit="steps"
          keyboardType="numeric"
          value={draft.steps}
          onChangeText={(text) => updateDraft({ steps: text })}
          error={fieldErrors.steps}
          leftIcon={<Footprints size={IconSize.md} color={Colors.steps} />}
        />

        <FormInput
          testID="edit-record-calories"
          label="Calories Burned"
          unit="kcal"
          keyboardType="numeric"
          value={draft.calories}
          onChangeText={(text) => updateDraft({ calories: text })}
          error={fieldErrors.calories}
          leftIcon={<Flame size={IconSize.md} color={Colors.calories} />}
        />

        <FormInput
          testID="edit-record-water"
          label="Water Intake"
          unit="ml"
          keyboardType="numeric"
          value={draft.water}
          onChangeText={(text) => updateDraft({ water: text })}
          error={fieldErrors.water}
          leftIcon={<Droplets size={IconSize.md} color={Colors.water} />}
        />
      </Card>

      <View style={styles.formActionsRow}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace(`/records/details/${loadedRecord.id}`);
            }
          }}
          disabled={isSubmitting}
          style={styles.cancelButton}
        />
        <Button
          testID="edit-record-save"
          title="Save Changes"
          variant="primary"
          onPress={handleUpdate}
          loading={isSubmitting}
          icon={<Save size={IconSize.sm} color={Colors.surface} />}
          style={styles.saveButton}
        />
      </View>
    </ScreenContainer>
  );
}

export function RecordDetailsView() {
  const params = useLocalSearchParams<{ id?: string }>();
  const recordId = Number(params.id);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const {
    record,
    goalSummary,
    isLoading,
    isDeleting,
    error,
    loadRecordDetails,
    deleteCurrentRecord,
    clearError,
  } = useRecordDetailsViewModel();

  const dataRevision = useAppBootstrapStore((state) => state.dataRevision);

  useEffect(() => {
    if (Number.isFinite(recordId) && recordId > 0) {
      loadRecordDetails(recordId);
    }
  }, [loadRecordDetails, recordId, dataRevision]);

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <LoadingState message="Loading record details..." />
      </ScreenContainer>
    );
  }

  if (!record || !goalSummary) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Record Not Found"
          description={error ?? 'This health record no longer exists.'}
          actionTitle="Back to Records"
          onAction={() => router.replace('/(tabs)/records')}
        />
      </ScreenContainer>
    );
  }

  const handleConfirmDelete = async () => {
    const deleted = await deleteCurrentRecord();
    setConfirmDeleteVisible(false);
    if (deleted) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/records');
      }
    }
  };

  return (
    <ScreenContainer>
      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

      {/* Date Header Card */}
      <Card style={styles.detailsHeaderCard}>
        <View style={styles.detailsDateRow}>
          <View style={styles.detailsDateIcon}>
            <Calendar size={IconSize.lg} color={Colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.detailsReadableDate}>
              {formatReadableDate(record.date)}
            </Text>
            <Text style={styles.detailsISODate}>Date: {record.date}</Text>
          </View>
        </View>
      </Card>

      {/* Steps Goal Progress Card */}
      <Card style={styles.metricDetailCard}>
        <View style={styles.metricTopRow}>
          <View style={styles.metricTitleGroup}>
            <View style={[styles.metricBadge, { backgroundColor: Colors.stepsMuted }]}>
              <Footprints size={IconSize.md} color={Colors.steps} />
            </View>
            <View>
              <Text style={styles.metricHeading}>Steps</Text>
              <Text style={styles.metricGoalSubtitle}>
                Daily Goal: {goalSummary.steps.goal.toLocaleString()} steps
              </Text>
            </View>
          </View>
          <Text style={[styles.percentageBadge, { color: Colors.steps }]}>
            {goalSummary.steps.percentage}%
          </Text>
        </View>

        <Text style={styles.metricBigValue}>
          {record.steps.toLocaleString()}{' '}
          <Text style={styles.metricUnitText}>steps</Text>
        </Text>

        <ProgressBar
          percentage={goalSummary.steps.clampedPercentage}
          color={Colors.steps}
          height={10}
        />

        <Text style={styles.remainingText}>
          {goalSummary.steps.isCompleted
            ? 'Daily steps goal achieved!'
            : `${goalSummary.steps.remaining.toLocaleString()} steps remaining to reach goal`}
        </Text>
      </Card>

      {/* Calories Goal Progress Card */}
      <Card style={styles.metricDetailCard}>
        <View style={styles.metricTopRow}>
          <View style={styles.metricTitleGroup}>
            <View
              style={[styles.metricBadge, { backgroundColor: Colors.caloriesMuted }]}
            >
              <Flame size={IconSize.md} color={Colors.calories} />
            </View>
            <View>
              <Text style={styles.metricHeading}>Calories Burned</Text>
              <Text style={styles.metricGoalSubtitle}>
                Daily Goal: {goalSummary.calories.goal.toLocaleString()} kcal
              </Text>
            </View>
          </View>
          <Text style={[styles.percentageBadge, { color: Colors.calories }]}>
            {goalSummary.calories.percentage}%
          </Text>
        </View>

        <Text style={styles.metricBigValue}>
          {record.calories.toLocaleString()}{' '}
          <Text style={styles.metricUnitText}>kcal</Text>
        </Text>

        <ProgressBar
          percentage={goalSummary.calories.clampedPercentage}
          color={Colors.calories}
          height={10}
        />

        <Text style={styles.remainingText}>
          {goalSummary.calories.isCompleted
            ? 'Daily calories goal achieved!'
            : `${goalSummary.calories.remaining.toLocaleString()} kcal remaining to reach goal`}
        </Text>
      </Card>

      {/* Water Intake Goal Progress Card */}
      <Card style={styles.metricDetailCard}>
        <View style={styles.metricTopRow}>
          <View style={styles.metricTitleGroup}>
            <View style={[styles.metricBadge, { backgroundColor: Colors.waterMuted }]}>
              <Droplets size={IconSize.md} color={Colors.water} />
            </View>
            <View>
              <Text style={styles.metricHeading}>Water Intake</Text>
              <Text style={styles.metricGoalSubtitle}>
                Daily Goal: {goalSummary.water.goal.toLocaleString()} ml
              </Text>
            </View>
          </View>
          <Text style={[styles.percentageBadge, { color: Colors.water }]}>
            {goalSummary.water.percentage}%
          </Text>
        </View>

        <Text style={styles.metricBigValue}>
          {record.water.toLocaleString()}{' '}
          <Text style={styles.metricUnitText}>ml</Text>
        </Text>

        <ProgressBar
          percentage={goalSummary.water.clampedPercentage}
          color={Colors.water}
          height={10}
        />

        <Text style={styles.remainingText}>
          {goalSummary.water.isCompleted
            ? 'Daily hydration goal achieved!'
            : `${goalSummary.water.remaining.toLocaleString()} ml remaining to reach goal`}
        </Text>
      </Card>

      {/* Timestamps Metadata Card */}
      <Card style={styles.timestampsCard}>
        <View style={styles.timestampRow}>
          <Clock size={IconSize.sm} color={Colors.textSecondary} />
          <Text style={styles.timestampLabel}>Created:</Text>
          <Text style={styles.timestampValue}>
            {formatTimestamp(record.created_at)}
          </Text>
        </View>
        <View style={styles.timestampRow}>
          <Clock size={IconSize.sm} color={Colors.textSecondary} />
          <Text style={styles.timestampLabel}>Last Updated:</Text>
          <Text style={styles.timestampValue}>
            {formatTimestamp(record.updated_at)}
          </Text>
        </View>
      </Card>

      {/* Edit & Delete Actions */}
      <View style={styles.formActionsRow}>
        <Button
          testID="details-edit-btn"
          title="Edit Record"
          variant="primary"
          onPress={() => router.push(`/records/edit/${record.id}`)}
          icon={<Edit3 size={IconSize.sm} color={Colors.surface} />}
          style={styles.flex}
        />
        <Button
          testID="details-delete-btn"
          title="Delete"
          variant="danger"
          onPress={() => setConfirmDeleteVisible(true)}
          icon={<Trash2 size={IconSize.sm} color={Colors.surface} />}
          style={styles.flex}
        />
      </View>

      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Delete Health Record"
        message={`Are you sure you want to delete the health record for ${formatReadableDate(
          record.date
        )}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  filterCard: {
    marginBottom: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  searchInputBox: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    minHeight: 42,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
    paddingVertical: 6,
  },
  sortButton: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    minHeight: 42,
    gap: 4,
  },
  sortButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.surface,
  },
  customRangeBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  customRangeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfCol: {
    flex: 1,
  },
  resetFilterLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    gap: 4,
  },
  resetFilterText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  detailsHeaderCard: {
    marginBottom: Spacing.md,
  },
  detailsDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsDateIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  detailsReadableDate: {
    ...Typography.h2,
  },
  detailsISODate: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  metricDetailCard: {
    marginBottom: Spacing.md,
  },
  metricTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  metricHeading: {
    ...Typography.h3,
  },
  metricGoalSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  percentageBadge: {
    ...Typography.h3,
    fontWeight: '700',
  },
  metricBigValue: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  metricUnitText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  remainingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  timestampsCard: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timestampLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  timestampValue: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
});