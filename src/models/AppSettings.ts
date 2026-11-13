export type UnitSystem = 'metric' | 'imperial';

export interface AppSettings {
  id: number;
  unit_system: UnitSystem;
  notifications_enabled: boolean;
  reminder_hour: number;
  reminder_minute: number;
  onboarding_completed: boolean;
  updated_at: string;
}

export interface UpdateAppSettingsInput {
  unit_system?: UnitSystem;
  notifications_enabled?: boolean;
  reminder_hour?: number;
  reminder_minute?: number;
  onboarding_completed?: boolean;
}
