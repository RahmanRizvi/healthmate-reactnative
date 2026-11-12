import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Droplets,
  Flame,
  Footprints,
  Save,
  User,
} from 'lucide-react-native';
import {
  Button,
  Card,
  DatePickerField,
  EmptyState,
  ErrorBanner,
  FormInput,
  LoadingState,
  ScreenContainer,
  SelectDropdown,
} from '../../../components';
import { Colors, IconSize, Radius, Spacing, Typography } from '../../../core/theme';
import { Gender } from '../../../models/UserProfile';
import { BMIResultCard } from '../../onboarding/components/BMIResultCard';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function EditProfileView() {
  const {
    profile,
    profileDraft,
    isLoading,
    isSaving,
    error,
    fieldErrors,
    loadProfileAndGoals,
    updateProfileDraft,
    saveProfile,
    clearMessages,
  } = useProfileViewModel();

  useEffect(() => {
    clearMessages();
    loadProfileAndGoals();
  }, [clearMessages, loadProfileAndGoals]);

  if (isLoading && !profile) {
    return (
      <ScreenContainer scrollable={false}>
        <LoadingState message="Loading profile..." />
      </ScreenContainer>
    );
  }

  const handleSave = async () => {
    const ok = await saveProfile();
    if (ok && router.canGoBack()) {
      router.back();
    }
  };

  return (
    <ScreenContainer keyboardAvoiding>
      {error ? <ErrorBanner message={error} onDismiss={clearMessages} /> : null}

      <Card style={styles.card}>
        <FormInput
          testID="profile-input-name"
          label="Full Name"
          value={profileDraft.full_name}
          onChangeText={(text) => updateProfileDraft({ full_name: text })}
          error={fieldErrors.full_name}
          leftIcon={<User size={IconSize.md} color={Colors.textSecondary} />}
        />

        <DatePickerField
          testID="profile-input-dob"
          label="Date of Birth"
          value={profileDraft.date_of_birth}
          onChange={(dateISO) => updateProfileDraft({ date_of_birth: dateISO })}
          error={fieldErrors.date_of_birth}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />

        <SelectDropdown
          testID="profile-select-gender"
          label="Gender"
          value={profileDraft.gender}
          options={GENDER_OPTIONS}
          onChange={(gender) => updateProfileDraft({ gender })}
          error={fieldErrors.gender}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <FormInput
              testID="profile-input-height"
              label="Height"
              unit="cm"
              keyboardType="numeric"
              value={profileDraft.height_cm}
              onChangeText={(text) => updateProfileDraft({ height_cm: text })}
              error={fieldErrors.height_cm}
            />
          </View>
          <View style={styles.half}>
            <FormInput
              testID="profile-input-weight"
              label="Weight"
              unit="kg"
              keyboardType="numeric"
              value={profileDraft.weight_kg}
              onChangeText={(text) => updateProfileDraft({ weight_kg: text })}
              error={fieldErrors.weight_kg}
            />
          </View>
        </View>
      </Card>

      <Button
        testID="save-profile-btn"
        title="Save Profile"
        onPress={handleSave}
        loading={isSaving}
        icon={<Save size={IconSize.sm} color={Colors.surface} />}
      />
    </ScreenContainer>
  );
}

export function DailyGoalsView() {
  const {
    goals,
    goalsDraft,
    isLoading,
    isSaving,
    error,
    fieldErrors,
    loadProfileAndGoals,
    updateGoalsDraft,
    saveDailyGoals,
    clearMessages,
  } = useProfileViewModel();

  useEffect(() => {
    clearMessages();
    loadProfileAndGoals();
  }, [clearMessages, loadProfileAndGoals]);

  if (isLoading && !goals) {
    return (
      <ScreenContainer scrollable={false}>
        <LoadingState message="Loading daily goals..." />
      </ScreenContainer>
    );
  }

  const handleSave = async () => {
    const ok = await saveDailyGoals();
    if (ok && router.canGoBack()) {
      router.back();
    }
  };

  return (
    <ScreenContainer keyboardAvoiding>
      {error ? <ErrorBanner message={error} onDismiss={clearMessages} /> : null}

      <Card style={styles.card}>
        <FormInput
          testID="goals-input-steps"
          label="Daily Steps Goal"
          unit="steps"
          keyboardType="numeric"
          value={goalsDraft.steps_goal}
          onChangeText={(text) => updateGoalsDraft({ steps_goal: text })}
          error={fieldErrors.steps_goal}
          leftIcon={<Footprints size={IconSize.md} color={Colors.steps} />}
        />

        <FormInput
          testID="goals-input-water"
          label="Daily Water Intake Goal"
          unit="ml"
          keyboardType="numeric"
          value={goalsDraft.water_goal_ml}
          onChangeText={(text) => updateGoalsDraft({ water_goal_ml: text })}
          error={fieldErrors.water_goal_ml}
          leftIcon={<Droplets size={IconSize.md} color={Colors.water} />}
        />

        <FormInput
          testID="goals-input-calories"
          label="Daily Calories Goal"
          unit="kcal"
          keyboardType="numeric"
          value={goalsDraft.calories_goal_kcal}
          onChangeText={(text) => updateGoalsDraft({ calories_goal_kcal: text })}
          error={fieldErrors.calories_goal_kcal}
          leftIcon={<Flame size={IconSize.md} color={Colors.calories} />}
        />
      </Card>

      <Button
        testID="save-goals-btn"
        title="Save Daily Goals"
        onPress={handleSave}
        loading={isSaving}
        icon={<Save size={IconSize.sm} color={Colors.surface} />}
      />
    </ScreenContainer>
  );
}

export function BMIDetailsView() {
  const {
    profile,
    bmiResult,
    age,
    isLoading,
    loadProfileAndGoals,
  } = useProfileViewModel();

  useEffect(() => {
    loadProfileAndGoals();
  }, [loadProfileAndGoals]);

  if (isLoading && !profile) {
    return (
      <ScreenContainer scrollable={false}>
        <LoadingState message="Calculating BMI..." />
      </ScreenContainer>
    );
  }

  if (!profile || !bmiResult) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Profile Not Set"
          description="Add your height and weight in your profile to calculate your BMI."
          actionTitle="Edit Profile"
          onAction={() => router.push('/profile')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <BMIResultCard
        bmiResult={bmiResult}
        age={age}
        heightCm={profile.height_cm}
        weightKg={profile.weight_kg}
      />
      <Button
        title="Update Height or Weight"
        onPress={() => router.push('/profile')}
        variant="outline"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  half: {
    flex: 1,
  },
  genderSection: {
    marginBottom: Spacing.md,
  },
  genderLabel: {
    marginBottom: Spacing.xs,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  genderChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  genderChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  genderChipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  genderChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
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
  },
});
