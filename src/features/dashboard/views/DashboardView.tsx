import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Activity,
  ArrowRight,
  Calendar,
  Droplets,
  Edit3,
  Flame,
  Footprints,
  Plus,
  Target,
} from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  LoadingState,
  ProgressBar,
  ScreenContainer,
  SectionHeader,
} from '../../../components';
import { WATER_QUICK_ADD_AMOUNTS } from '../../../core/constants/appConstants';
import { Colors, IconSize, Radius, Spacing, Typography } from '../../../core/theme';
import { formatReadableDate } from '../../../core/utils/dateUtils';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { HealthRecordCard } from '../../records/components/HealthRecordCard';
import { WeeklyActivityChart } from '../components/WeeklyActivityChart';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardView() {
  const {
    currentDateISO,
    profile,
    goals,
    todayRecord,
    progress,
    weeklyPoints,
    selectedChartMetric,
    recentRecords,
    isLoading,
    isAddingWater,
    error,
    loadDashboard,
    quickAddWater,
    setSelectedChartMetric,
    clearError,
  } = useDashboardViewModel();

  const dataRevision = useAppBootstrapStore((state) => state.dataRevision);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, dataRevision]);

  const firstName = profile?.full_name
    ? profile.full_name.trim().split(' ')[0]
    : 'there';

  const activeChartGoal =
    selectedChartMetric === 'steps'
      ? goals.steps_goal
      : selectedChartMetric === 'calories'
      ? goals.calories_goal_kcal
      : goals.water_goal_ml;

  if (isLoading && !profile && recentRecords.length === 0) {
    return (
      <ScreenContainer scrollable={false}>
        <LoadingState message="Loading your wellness dashboard..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Personalised Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingTitle}>
            {getTimeOfDayGreeting()}, {firstName}
          </Text>
          <View style={styles.dateRow}>
            <Calendar size={14} color={Colors.textSecondary} />
            <Text style={styles.dateSubtitleText}>
              {formatReadableDate(currentDateISO)}
            </Text>
          </View>
        </View>

        <Pressable
          testID="dashboard-top-action-btn"
          accessibilityRole="button"
          accessibilityLabel={todayRecord ? 'Edit today record' : 'Add today record'}
          onPress={() => {
            if (todayRecord) {
              router.push(`/records/edit/${todayRecord.id}`);
            } else {
              router.push(`/records/add?date=${currentDateISO}`);
            }
          }}
          style={({ pressed }) => [
            styles.topIconActionBtn,
            pressed && styles.topIconActionBtnPressed,
          ]}
        >
          {todayRecord ? (
            <Edit3 size={IconSize.md} color={Colors.surface} />
          ) : (
            <Plus size={IconSize.md} color={Colors.surface} />
          )}
        </Pressable>
      </View>

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

      {/* Today's Overall Activity Summary Banner */}
      <Card style={styles.summaryBannerCard}>
        <View style={styles.summaryBannerTop}>
          <View style={styles.summaryTitleGroup}>
            <View style={styles.summaryIconBox}>
              <Target size={IconSize.md} color={Colors.primary} />
            </View>
            <View style={styles.summaryTextContent}>
              <Text style={styles.summaryTitle}>Today’s Goal Completion</Text>
              <Text style={styles.summarySubtitle}>
                {todayRecord
                  ? 'Combined progress across steps, calories & water'
                  : 'No record logged for today yet'}
              </Text>
            </View>
          </View>
          <Text
            style={styles.overallPercentageText}
            testID="dashboard-overall-progress"
          >
            {progress.overallCompletionPercentage}%
          </Text>
        </View>
        <ProgressBar
          percentage={progress.overallCompletionPercentage}
          color={Colors.primary}
          height={10}
        />
      </Card>

      {/* Empty state prompt if no record for today */}
      {!todayRecord ? (
        <Card style={styles.emptyTodayCard}>
          <View style={styles.emptyTodayRow}>
            <View style={styles.emptyTodayIcon}>
              <Activity size={IconSize.md} color={Colors.primary} />
            </View>
            <View style={styles.emptyTodayContent}>
              <Text style={styles.emptyTodayTitle}>
                No Health Record for Today
              </Text>
              <Text style={styles.emptyTodayDescription}>
                Start logging your daily steps, calories burned, or use a quick
                water action below to create today’s record.
              </Text>
            </View>
          </View>
          <Button
            testID="dashboard-empty-add-today-btn"
            title="Add Today’s Record"
            onPress={() => router.push(`/records/add?date=${currentDateISO}`)}
            variant="primary"
            size="md"
            icon={<Plus size={IconSize.sm} color={Colors.surface} />}
          />
        </Card>
      ) : null}

      {/* Metric Cards: Steps, Calories Burned, Water Intake */}
      <SectionHeader
        title="Today’s Metrics"
        subtitle="Your daily activity compared with your goals"
      />

      {/* Steps Card */}
      <Card style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <View style={styles.metricHeaderLeft}>
            <View style={[styles.metricIconBox, { backgroundColor: Colors.stepsMuted }]}>
              <Footprints size={IconSize.md} color={Colors.steps} />
            </View>
            <View>
              <Text style={styles.metricLabel}>Steps</Text>
              <Text style={styles.metricGoalText}>
                Goal: {progress.steps.goal.toLocaleString()} steps
              </Text>
            </View>
          </View>
          <Text style={[styles.metricPercent, { color: Colors.steps }]}>
            {progress.steps.percentage}%
          </Text>
        </View>

        <Text style={styles.metricMainValue} testID="dashboard-steps-value">
          {progress.steps.current.toLocaleString()}{' '}
          <Text style={styles.metricUnit}>steps</Text>
        </Text>

        <ProgressBar
          percentage={progress.steps.clampedPercentage}
          color={Colors.steps}
          height={8}
        />

        <Text style={styles.metricRemaining}>
          {progress.steps.isCompleted
            ? 'Daily step goal completed'
            : `${progress.steps.remaining.toLocaleString()} steps remaining`}
        </Text>
      </Card>

      {/* Calories Burned Card */}
      <Card style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <View style={styles.metricHeaderLeft}>
            <View
              style={[styles.metricIconBox, { backgroundColor: Colors.caloriesMuted }]}
            >
              <Flame size={IconSize.md} color={Colors.calories} />
            </View>
            <View>
              <Text style={styles.metricLabel}>Calories Burned</Text>
              <Text style={styles.metricGoalText}>
                Goal: {progress.calories.goal.toLocaleString()} kcal
              </Text>
            </View>
          </View>
          <Text style={[styles.metricPercent, { color: Colors.calories }]}>
            {progress.calories.percentage}%
          </Text>
        </View>

        <Text style={styles.metricMainValue} testID="dashboard-calories-value">
          {progress.calories.current.toLocaleString()}{' '}
          <Text style={styles.metricUnit}>kcal</Text>
        </Text>

        <ProgressBar
          percentage={progress.calories.clampedPercentage}
          color={Colors.calories}
          height={8}
        />

        <Text style={styles.metricRemaining}>
          {progress.calories.isCompleted
            ? 'Daily calorie goal completed'
            : `${progress.calories.remaining.toLocaleString()} kcal remaining`}
        </Text>
      </Card>

      {/* Water Intake Card with Quick-Add Actions */}
      <Card style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <View style={styles.metricHeaderLeft}>
            <View style={[styles.metricIconBox, { backgroundColor: Colors.waterMuted }]}>
              <Droplets size={IconSize.md} color={Colors.water} />
            </View>
            <View>
              <Text style={styles.metricLabel}>Water Intake</Text>
              <Text style={styles.metricGoalText}>
                Goal: {progress.water.goal.toLocaleString()} ml
              </Text>
            </View>
          </View>
          <Text style={[styles.metricPercent, { color: Colors.water }]}>
            {progress.water.percentage}%
          </Text>
        </View>

        <Text style={styles.metricMainValue} testID="dashboard-water-value">
          {progress.water.current.toLocaleString()}{' '}
          <Text style={styles.metricUnit}>ml</Text>
        </Text>

        <ProgressBar
          percentage={progress.water.clampedPercentage}
          color={Colors.water}
          height={8}
        />

        <Text style={styles.metricRemaining}>
          {progress.water.isCompleted
            ? 'Daily hydration goal completed'
            : `${progress.water.remaining.toLocaleString()} ml remaining`}
        </Text>

        <View style={styles.quickWaterSection}>
          <Text style={styles.quickWaterTitle}>Quick Add Water</Text>
          <View style={styles.quickWaterRow}>
            {WATER_QUICK_ADD_AMOUNTS.map((amount) => (
              <Pressable
                key={amount}
                testID={`quick-add-water-${amount}`}
                disabled={isAddingWater}
                onPress={() => quickAddWater(amount)}
                style={({ pressed }) => [
                  styles.quickWaterBtn,
                  pressed && styles.quickWaterBtnPressed,
                  isAddingWater && styles.quickWaterBtnDisabled,
                ]}
              >
                <Plus size={14} color={Colors.water} />
                <Text style={styles.quickWaterBtnText}>{amount} ml</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Card>

      {/* Weekly Activity Chart */}
      <WeeklyActivityChart
        points={weeklyPoints}
        selectedMetric={selectedChartMetric}
        onSelectMetric={setSelectedChartMetric}
        goalValue={activeChartGoal}
      />

      {/* Recent Health Records */}
      <SectionHeader
        title="Recent Health Records"
        subtitle="Latest entries saved on your device"
        rightAction={
          recentRecords.length > 0 ? (
            <Pressable
              onPress={() => router.push('/(tabs)/records')}
              style={styles.viewAllLink}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ArrowRight size={14} color={Colors.primary} />
            </Pressable>
          ) : null
        }
      />

      {recentRecords.length === 0 ? (
        <EmptyState
          title="No Saved Records Yet"
          description="Your recent health records will appear here once you add your first daily entry."
          actionTitle="Log Today’s Activity"
          onAction={() => router.push(`/records/add?date=${currentDateISO}`)}
        />
      ) : (
        <View>
          {recentRecords.map((rec) => (
            <HealthRecordCard
              key={rec.id}
              record={rec}
              onPress={() => router.push(`/records/details/${rec.id}`)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.xs,
  },
  greetingTitle: {
    ...Typography.h1,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateSubtitleText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  topIconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topIconActionBtnPressed: {
    opacity: 0.85,
  },
  summaryBannerCard: {
    marginBottom: Spacing.md,
  },
  summaryBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  summaryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  summaryTextContent: {
    flex: 1,
    minWidth: 0,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  summaryTitle: {
    ...Typography.h3,
  },
  summarySubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  overallPercentageText: {
    ...Typography.h1,
    color: Colors.primary,
    flexShrink: 0,
  },
  emptyTodayCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  emptyTodayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  emptyTodayIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  emptyTodayContent: {
    flex: 1,
  },
  emptyTodayTitle: {
    ...Typography.h3,
    marginBottom: 2,
  },
  emptyTodayDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  metricCard: {
    marginBottom: Spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  metricHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  metricLabel: {
    ...Typography.h3,
  },
  metricGoalText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metricPercent: {
    ...Typography.h3,
    fontWeight: '700',
  },
  metricMainValue: {
    ...Typography.h1,
    marginVertical: Spacing.xs,
  },
  metricUnit: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  metricRemaining: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  quickWaterSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickWaterTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  quickWaterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  quickWaterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.waterMuted,
    borderWidth: 1,
    borderColor: Colors.water,
    borderRadius: Radius.md,
    paddingVertical: Spacing.xs + 2,
    gap: 4,
  },
  quickWaterBtnPressed: {
    opacity: 0.75,
  },
  quickWaterBtnDisabled: {
    opacity: 0.5,
  },
  quickWaterBtnText: {
    ...Typography.caption,
    color: Colors.water,
    fontWeight: '700',
  },
  viewAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    ...Typography.label,
    color: Colors.primary,
  },
});
