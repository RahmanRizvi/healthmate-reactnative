import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Flame,
  Footprints,
  HeartPulse,
  ShieldCheck,
  Target,
  User,
} from 'lucide-react-native';
import {
  Button,
  Card,
  DatePickerField,
  ErrorBanner,
  FormInput,
  ScreenContainer,
  SelectDropdown,
} from '../../../components';
import { Colors, IconSize, Radius, Spacing, Typography } from '../../../core/theme';
import { Gender } from '../../../models/UserProfile';
import { BMIResultCard } from '../components/BMIResultCard';
import { StepIndicator } from '../components/StepIndicator';
import { useOnboardingViewModel } from '../viewmodels/useOnboardingViewModel';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function OnboardingView() {
  const {
    currentStep,
    draftProfile,
    draftGoals,
    validatedProfile,
    calculatedAge,
    bmiResult,
    isSubmitting,
    error,
    fieldErrors,
    nextFromWelcome,
    previousStep,
    goToStep,
    updateDraftProfile,
    updateDraftGoals,
    submitPersonalDetailsStep,
    completeOnboarding,
    clearError,
  } = useOnboardingViewModel();

  const handleFinishOnboarding = async () => {
    const success = await completeOnboarding();
    if (success) {
      router.replace('/(tabs)');
    }
  };

  return (
    <ScreenContainer keyboardAvoiding>
      <StepIndicator currentStep={currentStep} />

      {error ? (
        <ErrorBanner message={error} onDismiss={clearError} />
      ) : null}

      {/* STEP 1: WELCOME */}
      {currentStep === 1 ? (
        <View style={styles.stepWrapper}>
          <View style={styles.heroIconBox}>
            <HeartPulse size={36} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Welcome to HealthMate</Text>
          <Text style={styles.heroSubtitle}>
            Your private, offline-first personal health and wellness tracker.
            Monitor your daily steps, hydration, and active calories with clarity.
          </Text>

          <Card style={styles.featuresCard}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.stepsMuted }]}>
                <Footprints size={IconSize.md} color={Colors.steps} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Daily Activity & Steps</Text>
                <Text style={styles.featureDesc}>
                  Log daily movement and track progress toward your step goals.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.waterMuted }]}>
                <Droplets size={IconSize.md} color={Colors.water} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Hydration Tracking</Text>
                <Text style={styles.featureDesc}>
                  Record water intake with one-tap quick actions throughout the day.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.caloriesMuted }]}>
                <Flame size={IconSize.md} color={Colors.calories} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Calories & BMI Insights</Text>
                <Text style={styles.featureDesc}>
                  Calculate your Body Mass Index and review weekly and monthly trends.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.primaryMuted }]}>
                <ShieldCheck size={IconSize.md} color={Colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>100% Private & Offline</Text>
                <Text style={styles.featureDesc}>
                  All records stay privately on your device with full export support.
                </Text>
              </View>
            </View>
          </Card>

          <Button
            testID="onboarding-get-started-btn"
            title="Get Started"
            onPress={nextFromWelcome}
            size="lg"
            icon={<ArrowRight size={IconSize.md} color={Colors.surface} />}
          />
        </View>
      ) : null}

      {/* STEP 2: PERSONAL DETAILS */}
      {currentStep === 2 ? (
        <View style={styles.stepWrapper}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Text style={styles.sectionSubtitle}>
            Provide your details so we can calculate your age and estimated Body
            Mass Index (BMI).
          </Text>

          <Card style={styles.formCard}>
            <FormInput
              testID="input-full-name"
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              value={draftProfile.full_name}
              onChangeText={(text) => updateDraftProfile({ full_name: text })}
              error={fieldErrors.full_name}
              leftIcon={<User size={IconSize.md} color={Colors.textSecondary} />}
              autoCapitalize="words"
            />

            <DatePickerField
              testID="input-dob"
              label="Date of Birth"
              value={draftProfile.date_of_birth}
              onChange={(dateISO) => updateDraftProfile({ date_of_birth: dateISO })}
              error={fieldErrors.date_of_birth}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />

            <SelectDropdown
              testID="select-gender"
              label="Gender"
              value={draftProfile.gender}
              options={GENDER_OPTIONS}
              onChange={(gender) => updateDraftProfile({ gender })}
              error={fieldErrors.gender}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <FormInput
                  testID="input-height"
                  label="Height"
                  unit="cm"
                  keyboardType="numeric"
                  placeholder="170"
                  value={draftProfile.height_cm}
                  onChangeText={(text) => updateDraftProfile({ height_cm: text })}
                  error={fieldErrors.height_cm}
                />
              </View>
              <View style={styles.halfInput}>
                <FormInput
                  testID="input-weight"
                  label="Weight"
                  unit="kg"
                  keyboardType="numeric"
                  placeholder="68"
                  value={draftProfile.weight_kg}
                  onChangeText={(text) => updateDraftProfile({ weight_kg: text })}
                  error={fieldErrors.weight_kg}
                />
              </View>
            </View>
          </Card>

          <View style={styles.navButtonsRow}>
            <Button
              title="Back"
              onPress={previousStep}
              variant="outline"
              style={styles.navBackBtn}
              icon={<ArrowLeft size={IconSize.sm} color={Colors.primary} />}
            />
            <Button
              testID="onboarding-calculate-bmi-btn"
              title="Calculate BMI"
              onPress={() => submitPersonalDetailsStep()}
              variant="primary"
              style={styles.navNextBtn}
              icon={<Activity size={IconSize.sm} color={Colors.surface} />}
            />
          </View>
        </View>
      ) : null}

      {/* STEP 3: BMI CALCULATION AND RESULT */}
      {currentStep === 3 && bmiResult && validatedProfile ? (
        <View style={styles.stepWrapper}>
          <Text style={styles.sectionTitle}>Your BMI Assessment</Text>
          <Text style={styles.sectionSubtitle}>
            Here is your calculated Body Mass Index based on your personal profile.
          </Text>

          <BMIResultCard
            bmiResult={bmiResult}
            age={calculatedAge}
            heightCm={validatedProfile.height_cm}
            weightKg={validatedProfile.weight_kg}
          />

          <View style={styles.navButtonsRow}>
            <Button
              title="Edit Details"
              onPress={previousStep}
              variant="outline"
              style={styles.navBackBtn}
              icon={<ArrowLeft size={IconSize.sm} color={Colors.primary} />}
            />
            <Button
              testID="onboarding-to-goals-btn"
              title="Set Daily Goals"
              onPress={() => goToStep(4)}
              variant="primary"
              style={styles.navNextBtn}
              icon={<Target size={IconSize.sm} color={Colors.surface} />}
            />
          </View>
        </View>
      ) : null}

      {/* STEP 4: DAILY GOALS SETUP */}
      {currentStep === 4 ? (
        <View style={styles.stepWrapper}>
          <Text style={styles.sectionTitle}>Daily Wellness Goals</Text>
          <Text style={styles.sectionSubtitle}>
            Customize your daily targets. You can adjust these goals anytime in
            Settings.
          </Text>

          <Card style={styles.formCard}>
            <FormInput
              testID="input-steps-goal"
              label="Daily Steps Goal"
              unit="steps"
              keyboardType="numeric"
              placeholder="10000"
              value={draftGoals.steps_goal}
              onChangeText={(text) => updateDraftGoals({ steps_goal: text })}
              error={fieldErrors.steps_goal}
              helperText="Recommended: 7,500 – 10,000 steps per day"
              leftIcon={<Footprints size={IconSize.md} color={Colors.steps} />}
            />

            <FormInput
              testID="input-water-goal"
              label="Daily Water Intake Goal"
              unit="ml"
              keyboardType="numeric"
              placeholder="2500"
              value={draftGoals.water_goal_ml}
              onChangeText={(text) => updateDraftGoals({ water_goal_ml: text })}
              error={fieldErrors.water_goal_ml}
              helperText="Recommended: 2,000 – 3,000 ml per day"
              leftIcon={<Droplets size={IconSize.md} color={Colors.water} />}
            />

            <FormInput
              testID="input-calories-goal"
              label="Active Calories Burned Goal"
              unit="kcal"
              keyboardType="numeric"
              placeholder="500"
              value={draftGoals.calories_goal_kcal}
              onChangeText={(text) =>
                updateDraftGoals({ calories_goal_kcal: text })
              }
              error={fieldErrors.calories_goal_kcal}
              helperText="Recommended: 300 – 600 active kcal per day"
              leftIcon={<Flame size={IconSize.md} color={Colors.calories} />}
            />
          </Card>

          <View style={styles.navButtonsRow}>
            <Button
              title="Back"
              onPress={previousStep}
              variant="outline"
              disabled={isSubmitting}
              style={styles.navBackBtn}
              icon={<ArrowLeft size={IconSize.sm} color={Colors.primary} />}
            />
            <Button
              testID="onboarding-finish-btn"
              title="Complete Setup"
              onPress={handleFinishOnboarding}
              variant="primary"
              loading={isSubmitting}
              style={styles.navNextBtn}
              icon={<CheckCircle2 size={IconSize.sm} color={Colors.surface} />}
            />
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stepWrapper: {
    flex: 1,
  },
  heroIconBox: {
    width: 68,
    height: 68,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...Typography.display,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  featuresCard: {
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  formCard: {
    marginBottom: Spacing.lg,
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
  errorCaption: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xxs,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  navButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  navBackBtn: {
    flex: 1,
  },
  navNextBtn: {
    flex: 2,
  },
});
