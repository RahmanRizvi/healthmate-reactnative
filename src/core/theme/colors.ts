export const Colors = {
  primary: '#073F38',
  secondary: '#176B5B',
  background: '#F7F9F8',
  surface: '#FFFFFF',
  textPrimary: '#172B27',
  textSecondary: '#71817C',
  border: '#E5ECE8',
  water: '#3998D4',
  calories: '#E36B55',
  steps: '#21845B',
  success: '#21845B',
  warning: '#D69A32',
  error: '#D9534F',

  // Subtle surface tint variants (solid colors only — no gradients or glow)
  primaryMuted: '#EBF3F1',
  waterMuted: '#ECF6FC',
  caloriesMuted: '#FDF0EE',
  stepsMuted: '#EBF5F0',
  warningMuted: '#FBF5EA',
  errorMuted: '#FCEEED',
} as const;

export type ColorName = keyof typeof Colors;
