import { isValidISODate, parseISODate } from './dateUtils';

export type BMICategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

export interface BMIResult {
  bmi: number;
  category: BMICategory;
  description: string;
  healthyWeightRangeKg: {
    min: number;
    max: number;
  };
}

/**
 * Calculates BMI using weight (kg) / height (m)^2.
 * Validates inputs and throws on non-positive values.
 */
export function calculateBMI(weightKg: number, heightCm: number): BMIResult {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('Weight must be a positive number.');
  }
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new Error('Height must be a positive number.');
  }

  const heightMeters = heightCm / 100;
  const rawBmi = weightKg / (heightMeters * heightMeters);
  const bmi = Math.round(rawBmi * 10) / 10;

  let category: BMICategory;
  let description: string;

  if (bmi < 18.5) {
    category = 'Underweight';
    description =
      'Your estimated BMI is below the standard adult range (18.5–24.9). Consider nutrient-dense meals and consulting a healthcare professional.';
  } else if (bmi < 25.0) {
    category = 'Normal';
    description =
      'Your estimated BMI falls within the standard adult range (18.5–24.9). Maintain consistent hydration and daily movement.';
  } else if (bmi < 30.0) {
    category = 'Overweight';
    description =
      'Your estimated BMI is above the standard adult range (18.5–24.9). Gradual increases in daily steps and balanced nutrition can support wellness.';
  } else {
    category = 'Obese';
    description =
      'Your estimated BMI is 30.0 or above. Regular physical activity and personalized guidance from a healthcare professional are recommended.';
  }

  const minHealthyWeight = Math.round(18.5 * heightMeters * heightMeters * 10) / 10;
  const maxHealthyWeight = Math.round(24.9 * heightMeters * heightMeters * 10) / 10;

  return {
    bmi,
    category,
    description,
    healthyWeightRangeKg: {
      min: minHealthyWeight,
      max: maxHealthyWeight,
    },
  };
}

/**
 * Calculates age in years from a YYYY-MM-DD date of birth string.
 */
export function calculateAgeFromDOB(
  dateOfBirthISO: string,
  referenceDate: Date = new Date()
): number {
  if (!isValidISODate(dateOfBirthISO)) {
    throw new Error('Invalid date of birth format. Use YYYY-MM-DD.');
  }
  const dob = parseISODate(dateOfBirthISO);
  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Calculates goal completion percentage (0 to 100+ or capped for progress bars) and remaining amount.
 */
export function calculateGoalProgress(current: number, goal: number): {
  percentage: number;
  clampedPercentage: number;
  remaining: number;
  isCompleted: boolean;
} {
  if (goal <= 0) {
    return {
      percentage: 0,
      clampedPercentage: 0,
      remaining: 0,
      isCompleted: false,
    };
  }
  const safeCurrent = Math.max(0, current);
  const rawPercentage = Math.round((safeCurrent / goal) * 100);
  const clampedPercentage = Math.min(100, Math.max(0, rawPercentage));
  const remaining = Math.max(0, goal - safeCurrent);

  return {
    percentage: rawPercentage,
    clampedPercentage,
    remaining,
    isCompleted: safeCurrent >= goal,
  };
}
