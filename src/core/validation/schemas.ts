import { z } from 'zod';
import { isValidISODate } from '../utils/dateUtils';

const parseWholeNumber = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return NaN;
    if (!/^-?\d+$/.test(trimmed)) return NaN;
    return Number(trimmed);
  }
  return NaN;
};

const parseDecimalNumber = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return NaN;
    return Number(trimmed);
  }
  return NaN;
};

export const healthRecordSchema = z.object({
  date: z
    .string()
    .min(1, 'Date is required.')
    .refine((val) => isValidISODate(val), {
      message: 'Please enter a valid date in YYYY-MM-DD format.',
    }),
  steps: z.preprocess(
    parseWholeNumber,
    z
      .number({ message: 'Steps must be a valid whole number.' })
      .int('Steps must be a whole number.')
      .min(0, 'Steps cannot be negative.')
      .max(200000, 'Steps value is unrealistically high.')
  ),
  calories: z.preprocess(
    parseWholeNumber,
    z
      .number({ message: 'Calories must be a valid whole number.' })
      .int('Calories must be a whole number.')
      .min(0, 'Calories cannot be negative.')
      .max(30000, 'Calories value is unrealistically high.')
  ),
  water: z.preprocess(
    parseWholeNumber,
    z
      .number({ message: 'Water intake must be a valid whole number.' })
      .int('Water intake must be a whole number.')
      .min(0, 'Water intake cannot be negative.')
      .max(20000, 'Water intake value is unrealistically high.')
  ),
});

export type HealthRecordFormValues = z.infer<typeof healthRecordSchema>;

export const userProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(80, 'Full name cannot exceed 80 characters.'),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required.')
    .refine((val) => isValidISODate(val), {
      message: 'Enter a valid date of birth (YYYY-MM-DD).',
    })
    .refine(
      (val) => {
        if (!isValidISODate(val)) return false;
        const [y, m, d] = val.split('-').map(Number);
        const dob = new Date(y, m - 1, d);
        const now = new Date();
        return dob <= now && y >= 1900;
      },
      {
        message: 'Date of birth cannot be in the future.',
      }
    ),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  height_cm: z.preprocess(
    parseDecimalNumber,
    z
      .number({ message: 'Height must be a valid number.' })
      .min(50, 'Height must be at least 50 cm.')
      .max(280, 'Height cannot exceed 280 cm.')
  ),
  weight_kg: z.preprocess(
    parseDecimalNumber,
    z
      .number({ message: 'Weight must be a valid number.' })
      .min(15, 'Weight must be at least 15 kg.')
      .max(400, 'Weight cannot exceed 400 kg.')
  ),
});

export type UserProfileFormValues = z.infer<typeof userProfileSchema>;

export const dailyGoalSchema = z.object({
  steps_goal: z.preprocess(
    parseWholeNumber,
    z
      .number({ message: 'Steps goal must be a valid whole number.' })
      .int('Steps goal must be a whole number.')
      .min(500, 'Steps goal must be at least 500.')
      .max(100000, 'Steps goal cannot exceed 100,000.')
  ),
  water_goal_ml: z.preprocess(
    parseWholeNumber,
    z
      .number({ message: 'Water goal must be a valid whole number.' })
      .int('Water goal must be a whole number.')
      .min(250, 'Water goal must be at least 250 ml.')
      .max(15000, 'Water goal cannot exceed 15,000 ml.')
  ),
  calories_goal_kcal: z.preprocess(
    parseWholeNumber,
    z
      .number({ message: 'Calories goal must be a valid whole number.' })
      .int('Calories goal must be a whole number.')
      .min(50, 'Calories goal must be at least 50 kcal.')
      .max(15000, 'Calories goal cannot exceed 15,000 kcal.')
  ),
});

export type DailyGoalFormValues = z.infer<typeof dailyGoalSchema>;
