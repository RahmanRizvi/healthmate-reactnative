import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Flame,
  Footprints,
  Minus,
  Target,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorBanner,
  LoadingState,
  ProgressBar,
  ScreenContainer,
  SectionHeader,
} from '../../../components';
import { Colors, IconSize, Radius, Spacing, Typography } from '../../../core/theme';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { ProgressPeriodChart } from '../components/ProgressPeriodChart';
import {
  ProgressPeriodType,
  useProgressViewModel,
} from '../viewmodels/useProgressViewModel';

const PERIOD_TABS: { value: ProgressPeriodType; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function ProgressView() {
  const {
    periodType,
    periodLabel,
    previousPeriodLabel,
    selectedMetric,
    goals,
    recordsInPeriod,
    chartBars,
    summary,
    isLoading,
    error,
    loadProgress,
    setPeriodType,
    navigatePeriod,
    setSelectedMetric,
    clearError,
  } = useProgressViewModel();

  const dataRevision = useAppBootstrapStore((state) => state.dataRevision);

  useEffect(() => {
    loadProgress();
  }, [loadProgress, dataRevision]);

  const activeGoalValue =
    selectedMetric === 'steps'
      ? goals.steps_goal
      : selectedMetric === 'calories'
      ? goals.calories_goal_kcal
      : goals.water_goal_ml;

  const renderDeltaRow = (
    label: string,
    diff: number,
    percentChange: number | null,
    unit: string
  ) => {
    const isPositive = diff > 0;
    const isNegative = diff < 0;
    const badgeColor = isPositive
      ? Colors.steps
      : isNegative
      ? Colors.error
      : Colors.textSecondary;

    const sign = isPositive ? '+' : '';

    return (
      <View style={styles.comparisonRow} key={label}>
        <Text style={styles.comparisonLabel}>{label}</Text>
        <View style={styles.comparisonRight}>
          {isPositive ? (
            <ArrowUpRight size={15} color={badgeColor} />
          ) : isNegative ? (
            <ArrowDownRight size={15} color={badgeColor} />
          ) : (
            <Minus size={15} color={badgeColor} />
          )}
          <Text style={[styles.comparisonDiffText, { color: badgeColor }]}>
            {sign}
            {diff.toLocaleString()} {unit}
            {percentChange !== null ? ` (${sign}${percentChange}%)` : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <SectionHeader
        title="Progress & Analytics"
        subtitle="Track your trends across daily, weekly, and monthly periods"
      />

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

      {/* Period Selector Tabs (Daily / Weekly / Monthly) */}
      <View style={styles.segmentedControl}>
        {PERIOD_TABS.map((tab) => {
          const active = periodType === tab.value;
          return (
            <Pressable
              key={tab.value}
              testID={`progress-period-${tab.value}`}
              onPress={() => setPeriodType(tab.value)}
              style={[
                styles.segmentButton,
                active && styles.segmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  active && styles.segmentTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Previous & Next Period Navigation Bar */}
      <Card style={styles.periodNavCard}>
        <Pressable
          testID="progress-prev-period-btn"
          onPress={() => navigatePeriod('prev')}
          style={styles.navIconBtn}
          accessibilityRole="button"
          accessibilityLabel="Previous period"
        >
          <ChevronLeft size={IconSize.md} color={Colors.primary} />
        </Pressable>

        <View style={styles.periodCenter}>
          <Text style={styles.periodLabelText}>{periodLabel}</Text>
          <Text style={styles.periodSubtext}>
            {summary.activeDays} of {summary.totalDaysInPeriod} days active
          </Text>
        </View>

        <Pressable
          testID="progress-next-period-btn"
          onPress={() => navigatePeriod('next')}
          style={styles.navIconBtn}
          accessibilityRole="button"
          accessibilityLabel="Next period"
        >
          <ChevronRight size={IconSize.md} color={Colors.primary} />
        </Pressable>
      </Card>

      {isLoading ? (
        <LoadingState message="Calculating analytics..." />
      ) : recordsInPeriod.length === 0 ? (
        <EmptyState
          title="No Activity Data for This Period"
          description={`There are no health records logged for ${periodLabel}. Add a health record or navigate to another period.`}
          icon={<BarChart3 size={IconSize.lg} color={Colors.primary} />}
          actionTitle="Add Health Record"
          onAction={() => router.push('/records/add')}
        />
      ) : (
        <View>
          {/* Period Chart */}
          <ProgressPeriodChart
            bars={chartBars}
            periodType={periodType}
            selectedMetric={selectedMetric}
            onSelectMetric={setSelectedMetric}
            goalValue={activeGoalValue}
          />

          {/* Goal Completion & Active Days Card */}
          <Card style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <View style={styles.completionLeft}>
                <View style={styles.iconCircle}>
                  <Target size={IconSize.md} color={Colors.primary} />
                </View>
                <View style={styles.completionTextContent}>
                  <Text style={styles.cardHeading}>
                    Goal Completion Rate
                  </Text>
                  <Text style={styles.cardSubheading}>
                    Average daily goal completion on active days
                  </Text>
                </View>
              </View>
              <Text
                style={styles.completionBigPercent}
                testID="progress-goal-completion-percent"
              >
                {summary.goalCompletionPercentage}%
              </Text>
            </View>
            <ProgressBar
              percentage={summary.goalCompletionPercentage}
              color={Colors.primary}
              height={10}
            />
          </Card>

          {/* Totals Grid */}
          <SectionHeader
            title="Period Totals"
            subtitle={`Cumulative totals for ${periodLabel}`}
          />

          <View style={styles.statsGrid}>
            <Card style={styles.statGridItem}>
              <View
                style={[styles.statBadge, { backgroundColor: Colors.stepsMuted }]}
              >
                <Footprints size={IconSize.sm} color={Colors.steps} />
              </View>
              <Text style={styles.statLabel}>Total Steps</Text>
              <Text style={styles.statValue} testID="progress-total-steps">
                {summary.totalSteps.toLocaleString()}
              </Text>
            </Card>

            <Card style={styles.statGridItem}>
              <View
                style={[
                  styles.statBadge,
                  { backgroundColor: Colors.caloriesMuted },
                ]}
              >
                <Flame size={IconSize.sm} color={Colors.calories} />
              </View>
              <Text style={styles.statLabel}>Total Calories</Text>
              <Text style={styles.statValue} testID="progress-total-calories">
                {summary.totalCalories.toLocaleString()} kcal
              </Text>
            </Card>

            <Card style={styles.statGridItem}>
              <View
                style={[styles.statBadge, { backgroundColor: Colors.waterMuted }]}
              >
                <Droplets size={IconSize.sm} color={Colors.water} />
              </View>
              <Text style={styles.statLabel}>Total Water</Text>
              <Text style={styles.statValue} testID="progress-total-water">
                {summary.totalWater.toLocaleString()} ml
              </Text>
            </Card>

            <Card style={styles.statGridItem}>
              <View
                style={[
                  styles.statBadge,
                  { backgroundColor: Colors.primaryMuted },
                ]}
              >
                <Calendar size={IconSize.sm} color={Colors.primary} />
              </View>
              <Text style={styles.statLabel}>Active Days</Text>
              <Text style={styles.statValue} testID="progress-active-days">
                {summary.activeDays} / {summary.totalDaysInPeriod}
              </Text>
            </Card>
          </View>

          {/* Daily Averages Card */}
          <Card style={styles.averagesCard}>
            <Text style={styles.cardHeading}>Daily Averages (Active Days)</Text>
            <View style={styles.avgRow}>
              <Text style={styles.avgLabel}>Average Daily Steps</Text>
              <Text style={styles.avgValue} testID="progress-avg-steps">
                {summary.averageDailySteps.toLocaleString()} steps
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.avgRow}>
              <Text style={styles.avgLabel}>Average Daily Water Intake</Text>
              <Text style={styles.avgValue} testID="progress-avg-water">
                {summary.averageDailyWater.toLocaleString()} ml
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.avgRow}>
              <Text style={styles.avgLabel}>Average Daily Calories Burned</Text>
              <Text style={styles.avgValue}>
                {summary.averageDailyCalories.toLocaleString()} kcal
              </Text>
            </View>
          </Card>

          {/* Comparison with Previous Period */}
          <Card style={styles.comparisonCard}>
            <Text style={styles.cardHeading}>
              Comparison vs Previous Period
            </Text>
            <Text style={[styles.cardSubheading, { marginBottom: Spacing.sm }]}>
              Compared with {previousPeriodLabel}
            </Text>

            {renderDeltaRow(
              'Steps',
              summary.comparison.stepsDiff,
              summary.comparison.stepsPercentChange,
              'steps'
            )}
            <View style={styles.divider} />
            {renderDeltaRow(
              'Calories Burned',
              summary.comparison.caloriesDiff,
              summary.comparison.caloriesPercentChange,
              'kcal'
            )}
            <View style={styles.divider} />
            {renderDeltaRow(
              'Water Intake',
              summary.comparison.waterDiff,
              summary.comparison.waterPercentChange,
              'ml'
            )}
          </Card>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: Spacing.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.surface,
  },
  periodNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodCenter: {
    alignItems: 'center',
    flex: 1,
  },
  periodLabelText: {
    ...Typography.h3,
  },
  periodSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  completionCard: {
    marginBottom: Spacing.md,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  completionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  completionTextContent: {
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  cardHeading: {
    ...Typography.h3,
  },
  cardSubheading: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  completionBigPercent: {
    ...Typography.h1,
    color: Colors.primary,
    flexShrink: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statGridItem: {
    width: '48%',
    flexGrow: 1,
  },
  statBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statValue: {
    ...Typography.h3,
    marginTop: 2,
  },
  averagesCard: {
    marginBottom: Spacing.md,
  },
  avgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  avgLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  avgValue: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  comparisonCard: {
    marginBottom: Spacing.lg,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  comparisonLabel: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  comparisonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comparisonDiffText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
});
