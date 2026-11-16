import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Download,
  HeartPulse,
  Info,
  Ruler,
  Scale,
  ShieldCheck,
  Target,
  Trash2,
  User,
} from 'lucide-react-native';
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorBanner,
  LoadingState,
  ScreenContainer,
  SectionHeader,
  SelectDropdown,
} from '../../../components';
import { APP_INFO } from '../../../core/constants/appConstants';
import { Colors, IconSize, Radius, Spacing, Typography } from '../../../core/theme';
import { UnitSystem } from '../../../models/AppSettings';
import { useAppBootstrapStore } from '../../../store/useAppBootstrapStore';
import { useSettingsViewModel } from '../viewmodels/useSettingsViewModel';

const UNIT_OPTIONS: { value: UnitSystem; label: string }[] = [
  { value: 'metric', label: 'Metric (cm, kg, ml)' },
  { value: 'imperial', label: 'Imperial (ft/in, lb, fl oz)' },
];

const REMINDER_HOUR_OPTIONS: { value: string; label: string }[] = [
  { value: '8', label: '08:00 AM (Morning)' },
  { value: '12', label: '12:00 PM (Midday)' },
  { value: '18', label: '06:00 PM (Evening)' },
  { value: '20', label: '08:00 PM (Night)' },
  { value: '21', label: '09:00 PM (Late Evening)' },
];

export function SettingsView() {
  const {
    profile,
    goals,
    settings,
    bmiResult,
    totalRecordCount,
    isLoading,
    isExporting,
    isResetting,
    error,
    loadSettingsData,
    updateUnitSystem,
    toggleNotifications,
    updateReminderHour,
    exportRecordsCSV,
    resetApplicationData,
    clearMessages,
  } = useSettingsViewModel();

  const dataRevision = useAppBootstrapStore((state) => state.dataRevision);
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData, dataRevision]);

  const handleConfirmReset = async () => {
    const ok = await resetApplicationData();
    setConfirmResetVisible(false);
    if (ok) {
      router.replace('/onboarding');
    }
  };

  if (isLoading && !settings) {
    return (
      <ScreenContainer scrollable={false}>
        <LoadingState message="Loading settings..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeader
        title="Settings"
        subtitle="Profile, daily goals, notifications, data export & privacy"
      />

      {error ? <ErrorBanner message={error} onDismiss={clearMessages} /> : null}

      {/* 1. Profile, BMI & Daily Goals Navigation */}
      <Text style={styles.groupHeading}>Profile & Wellness Targets</Text>
      <Card style={styles.groupCard}>
        <Pressable
          testID="settings-edit-profile-row"
          onPress={() => router.push('/profile')}
          style={styles.navRow}
        >
          <View style={[styles.rowIconBox, { backgroundColor: Colors.primaryMuted }]}>
            <User size={IconSize.md} color={Colors.primary} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Edit Profile</Text>
            <Text style={styles.rowSubtitle}>
              {profile
                ? `${profile.full_name} • ${profile.height_cm} cm • ${profile.weight_kg} kg`
                : 'Set up your personal details'}
            </Text>
          </View>
          <ChevronRight size={IconSize.md} color={Colors.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          testID="settings-bmi-info-row"
          onPress={() => router.push('/profile/bmi')}
          style={styles.navRow}
        >
          <View style={[styles.rowIconBox, { backgroundColor: Colors.stepsMuted }]}>
            <Scale size={IconSize.md} color={Colors.steps} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>View BMI Information</Text>
            <Text style={styles.rowSubtitle}>
              {bmiResult
                ? `Current BMI: ${bmiResult.bmi.toFixed(1)} (${bmiResult.category})`
                : 'Calculate your Body Mass Index'}
            </Text>
          </View>
          <ChevronRight size={IconSize.md} color={Colors.textSecondary} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          testID="settings-edit-goals-row"
          onPress={() => router.push('/profile/goals')}
          style={styles.navRow}
        >
          <View style={[styles.rowIconBox, { backgroundColor: Colors.waterMuted }]}>
            <Target size={IconSize.md} color={Colors.water} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Edit Daily Goals</Text>
            <Text style={styles.rowSubtitle}>
              {goals
                ? `${goals.steps_goal.toLocaleString()} steps • ${goals.water_goal_ml.toLocaleString()} ml • ${goals.calories_goal_kcal.toLocaleString()} kcal`
                : 'Customize daily targets'}
            </Text>
          </View>
          <ChevronRight size={IconSize.md} color={Colors.textSecondary} />
        </Pressable>
      </Card>

      {/* 2. Measurement Preferences & Notification Settings */}
      <Text style={styles.groupHeading}>Preferences & Reminders</Text>
      <Card style={styles.groupCard}>
        <View style={styles.preferenceBlock}>
          <View style={styles.prefHeader}>
            <View style={[styles.rowIconBox, { backgroundColor: Colors.primaryMuted }]}>
              <Ruler size={IconSize.md} color={Colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Measurement Preferences</Text>
              <Text style={styles.rowSubtitle}>
                Choose your preferred display unit system
              </Text>
            </View>
          </View>
          <SelectDropdown
            testID="settings-unit-dropdown"
            label="Unit System"
            value={settings?.unit_system ?? 'metric'}
            options={UNIT_OPTIONS}
            onChange={(val) => updateUnitSystem(val)}
            containerStyle={styles.noBottomMargin}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.preferenceBlock}>
          <View style={styles.switchRow}>
            <View style={[styles.rowIconBox, { backgroundColor: Colors.warningMuted }]}>
              <Bell size={IconSize.md} color={Colors.warning} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Daily Reminder Notifications</Text>
              <Text style={styles.rowSubtitle}>
                Receive a local reminder to log your daily activity
              </Text>
            </View>
            <Switch
              testID="settings-notifications-switch"
              value={Boolean(settings?.notifications_enabled)}
              onValueChange={(enabled) => toggleNotifications(enabled)}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={Colors.surface}
            />
          </View>

          {settings?.notifications_enabled ? (
            <View style={styles.reminderTimeWrapper}>
              <SelectDropdown
                testID="settings-reminder-hour-dropdown"
                label="Daily Reminder Time"
                value={String(settings.reminder_hour ?? 20)}
                options={REMINDER_HOUR_OPTIONS}
                onChange={(hourStr) => updateReminderHour(Number(hourStr))}
                containerStyle={styles.noBottomMargin}
              />
            </View>
          ) : null}
        </View>
      </Card>

      {/* 3. Data Export */}
      <Text style={styles.groupHeading}>Data Export</Text>
      <Card style={styles.groupCard}>
        <View style={styles.actionBlock}>
          <View style={styles.prefHeader}>
            <View style={[styles.rowIconBox, { backgroundColor: Colors.stepsMuted }]}>
              <Download size={IconSize.md} color={Colors.steps} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Export Health Records (CSV)</Text>
              <Text style={styles.rowSubtitle}>
                Export all {totalRecordCount}{' '}
                {totalRecordCount === 1 ? 'record' : 'records'} with dates,
                metrics, and timestamps
              </Text>
            </View>
          </View>
          <Button
            testID="settings-export-csv-btn"
            title="Export CSV File"
            variant="primary"
            size="md"
            loading={isExporting}
            onPress={exportRecordsCSV}
            icon={<Download size={IconSize.sm} color={Colors.surface} />}
          />
        </View>
      </Card>

      {/* 4. Privacy Information & About HealthMate */}
      <Text style={styles.groupHeading}>Privacy & About</Text>
      <Card style={styles.groupCard}>
        <View style={styles.infoBlock}>
          <View style={styles.infoHeader}>
            <ShieldCheck size={IconSize.md} color={Colors.primary} />
            <Text style={styles.infoTitle}>Privacy Information</Text>
          </View>
          <Text style={styles.infoBody}>
            HealthMate works completely offline. Your personal profile, body
            measurements, daily goals, and health records are saved privately on
            your device and are never shared with external servers.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoBlock}>
          <View style={styles.infoHeader}>
            <HeartPulse size={IconSize.md} color={Colors.secondary} />
            <Text style={styles.infoTitle}>
              About {APP_INFO.name} (v{APP_INFO.version})
            </Text>
          </View>
          <Text style={styles.infoBody}>
            {APP_INFO.name} – {APP_INFO.tagline}. Designed to help you build
            consistent daily habits for movement, hydration, and active energy.
          </Text>
          <View style={styles.disclaimerNote}>
            <Info size={14} color={Colors.textSecondary} />
            <Text style={styles.disclaimerNoteText}>
              Wellness metrics and BMI estimates are for informational tracking
              only and do not constitute medical advice.
            </Text>
          </View>
        </View>
      </Card>

      {/* 5. Reset Application Data */}
      <Text style={styles.groupHeading}>Danger Zone</Text>
      <Card style={[styles.groupCard, styles.dangerCard]}>
        <View style={styles.actionBlock}>
          <View style={styles.prefHeader}>
            <View style={[styles.rowIconBox, { backgroundColor: Colors.errorMuted }]}>
              <Trash2 size={IconSize.md} color={Colors.error} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Reset Application Data</Text>
              <Text style={styles.rowSubtitle}>
                Permanently delete all saved health records, profile details,
                and custom goals from this device and restart setup
              </Text>
            </View>
          </View>
          <Button
            testID="settings-reset-data-btn"
            title="Reset All Data"
            variant="danger"
            size="md"
            onPress={() => setConfirmResetVisible(true)}
            icon={<Trash2 size={IconSize.sm} color={Colors.surface} />}
          />
        </View>
      </Card>

      <ConfirmDialog
        visible={confirmResetVisible}
        title="Reset All HealthMate Data?"
        message="This will permanently delete all of your health records, personal profile, and daily goals from your device. This action cannot be undone."
        confirmLabel="Reset Everything"
        cancelLabel="Cancel"
        destructive
        loading={isResetting}
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmResetVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  groupHeading: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  groupCard: {
    marginBottom: Spacing.md,
  },
  dangerCard: {
    borderColor: Colors.error,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  rowIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  rowContent: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  rowTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  rowSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  preferenceBlock: {
    paddingVertical: Spacing.xxs,
  },
  prefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTimeWrapper: {
    marginTop: Spacing.sm,
  },
  noBottomMargin: {
    marginBottom: 0,
  },
  actionBlock: {
    paddingVertical: Spacing.xxs,
  },
  infoBlock: {
    paddingVertical: Spacing.xxs,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  infoTitle: {
    ...Typography.h3,
  },
  infoBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  disclaimerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  disclaimerNoteText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stepsMuted,
    borderWidth: 1,
    borderColor: Colors.steps,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  successText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    fontWeight: '600',
    flex: 1,
  },
});
