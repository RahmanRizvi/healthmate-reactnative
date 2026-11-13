import { getDatabase } from '../../core/database/database';
import { getNowTimestamp } from '../../core/utils/dateUtils';
import { AppSettings, UnitSystem, UpdateAppSettingsInput } from '../../models/AppSettings';
import { IAppSettingsRepository } from '../interfaces/IAppSettingsRepository';

interface RawAppSettingsRow {
  id: number;
  unit_system: UnitSystem;
  notifications_enabled: number;
  reminder_hour: number;
  reminder_minute: number;
  onboarding_completed: number;
  updated_at: string;
}

export class SQLiteAppSettingsRepository implements IAppSettingsRepository {
  private mapRow(row: RawAppSettingsRow): AppSettings {
    return {
      id: row.id,
      unit_system: row.unit_system,
      notifications_enabled: row.notifications_enabled === 1,
      reminder_hour: row.reminder_hour,
      reminder_minute: row.reminder_minute,
      onboarding_completed: row.onboarding_completed === 1,
      updated_at: row.updated_at,
    };
  }

  async getSettings(): Promise<AppSettings> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<RawAppSettingsRow>(
      'SELECT * FROM app_settings WHERE id = 1;'
    );

    if (row) {
      return this.mapRow(row);
    }

    const now = getNowTimestamp();
    await db.runAsync(
      `INSERT OR IGNORE INTO app_settings (id, unit_system, notifications_enabled, reminder_hour, reminder_minute, onboarding_completed, updated_at)
       VALUES (1, 'metric', 0, 20, 0, 0, ?);`,
      now
    );

    return {
      id: 1,
      unit_system: 'metric',
      notifications_enabled: false,
      reminder_hour: 20,
      reminder_minute: 0,
      onboarding_completed: false,
      updated_at: now,
    };
  }

  async updateSettings(input: UpdateAppSettingsInput): Promise<AppSettings> {
    const db = await getDatabase();
    const current = await this.getSettings();
    const now = getNowTimestamp();

    const unitSystem = input.unit_system ?? current.unit_system;
    const notificationsEnabled =
      (input.notifications_enabled ?? current.notifications_enabled) ? 1 : 0;
    const reminderHour = input.reminder_hour ?? current.reminder_hour;
    const reminderMinute = input.reminder_minute ?? current.reminder_minute;
    const onboardingCompleted =
      (input.onboarding_completed ?? current.onboarding_completed) ? 1 : 0;

    await db.runAsync(
      `UPDATE app_settings
       SET unit_system = ?,
           notifications_enabled = ?,
           reminder_hour = ?,
           reminder_minute = ?,
           onboarding_completed = ?,
           updated_at = ?
       WHERE id = 1;`,
      unitSystem,
      notificationsEnabled,
      reminderHour,
      reminderMinute,
      onboardingCompleted,
      now
    );

    return this.getSettings();
  }
}

export const appSettingsRepository = new SQLiteAppSettingsRepository();
