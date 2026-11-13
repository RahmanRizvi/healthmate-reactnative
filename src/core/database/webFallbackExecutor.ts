import { DatabaseExecutor } from './migrations';
import { HealthRecord } from '../../models/HealthRecord';
import { UserProfile } from '../../models/UserProfile';
import { DailyGoal } from '../../models/DailyGoal';

interface RawAppSettings {
  id: number;
  unit_system: 'metric' | 'imperial';
  notifications_enabled: number;
  reminder_hour: number;
  reminder_minute: number;
  onboarding_completed: number;
  updated_at: string;
}

interface PersistedWebStore {
  userVersion: number;
  autoIncrementId: number;
  healthRecords: HealthRecord[];
  userProfile: UserProfile | null;
  dailyGoal: DailyGoal | null;
  appSettings: RawAppSettings | null;
}

const STORAGE_KEY = 'healthmate_sqlite_web_store_v1';

/**
 * SQLite-compatible executor for Web preview and In-Memory testing.
 * When `persistToLocalStorage` is true (on web), it persists all tables to browser localStorage
 * so the app works seamlessly in Chrome/Safari at localhost:8081 as well as native iOS/Android.
 */
export class WebAndMemorySQLiteExecutor implements DatabaseExecutor {
  public executedSQL: string[] = [];
  public userVersion = 0;
  public healthRecords: HealthRecord[] = [];
  public userProfile: UserProfile | null = null;
  public dailyGoal: DailyGoal | null = null;
  public appSettings: RawAppSettings | null = null;
  private autoIncrementId = 1;
  private readonly persistToLocalStorage: boolean;

  constructor(persistToLocalStorage = false) {
    this.persistToLocalStorage = persistToLocalStorage;
    if (persistToLocalStorage) {
      this.hydrateFromStorage();
    }
  }

  private hydrateFromStorage(): void {
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
        const raw = globalThis.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedWebStore;
          this.userVersion = parsed.userVersion ?? 0;
          this.autoIncrementId = parsed.autoIncrementId ?? 1;
          this.healthRecords = Array.isArray(parsed.healthRecords)
            ? parsed.healthRecords
            : [];
          this.userProfile = parsed.userProfile ?? null;
          this.dailyGoal = parsed.dailyGoal ?? null;
          this.appSettings = parsed.appSettings ?? null;
        }
      }
    } catch {
      // Ignore storage access errors in private mode
    }
  }

  private flushToStorage(): void {
    if (!this.persistToLocalStorage) return;
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
        const payload: PersistedWebStore = {
          userVersion: this.userVersion,
          autoIncrementId: this.autoIncrementId,
          healthRecords: this.healthRecords,
          userProfile: this.userProfile,
          dailyGoal: this.dailyGoal,
          appSettings: this.appSettings,
        };
        globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      // Ignore storage quota errors
    }
  }

  async execAsync(source: string): Promise<void> {
    this.executedSQL.push(source.trim());
    const match = source.match(/PRAGMA\s+user_version\s*=\s*(\d+)/i);
    if (match) {
      this.userVersion = Number(match[1]);
      this.flushToStorage();
    }
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await task();
    this.flushToStorage();
  }

  async runAsync(
    source: string,
    ...params: (string | number | null)[]
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const normalized = source.replace(/\s+/g, ' ').trim();
    this.executedSQL.push(normalized);

    if (normalized.startsWith('DELETE FROM health_records WHERE id =')) {
      const id = Number(params[0]);
      const before = this.healthRecords.length;
      this.healthRecords = this.healthRecords.filter((r) => r.id !== id);
      this.flushToStorage();
      return { lastInsertRowId: 0, changes: before - this.healthRecords.length };
    }

    if (normalized.startsWith('DELETE FROM health_records')) {
      const count = this.healthRecords.length;
      this.healthRecords = [];
      this.flushToStorage();
      return { lastInsertRowId: 0, changes: count };
    }

    if (normalized.startsWith('DELETE FROM user_profile')) {
      this.userProfile = null;
      this.flushToStorage();
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (normalized.startsWith('DELETE FROM daily_goals')) {
      this.dailyGoal = null;
      this.flushToStorage();
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (normalized.startsWith('DELETE FROM app_settings')) {
      this.appSettings = null;
      this.flushToStorage();
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (normalized.startsWith('INSERT OR IGNORE INTO daily_goals')) {
      if (!this.dailyGoal) {
        this.dailyGoal = {
          id: 1,
          steps_goal: Number(params[0]),
          water_goal_ml: Number(params[1]),
          calories_goal_kcal: Number(params[2]),
          updated_at: String(params[3]),
        };
        this.flushToStorage();
        return { lastInsertRowId: 1, changes: 1 };
      }
      return { lastInsertRowId: 1, changes: 0 };
    }

    if (normalized.startsWith('INSERT INTO daily_goals')) {
      this.dailyGoal = {
        id: 1,
        steps_goal: Number(params[0]),
        water_goal_ml: Number(params[1]),
        calories_goal_kcal: Number(params[2]),
        updated_at: String(params[3]),
      };
      this.flushToStorage();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (normalized.startsWith('INSERT OR IGNORE INTO app_settings')) {
      if (!this.appSettings) {
        this.appSettings = {
          id: 1,
          unit_system: 'metric',
          notifications_enabled: 0,
          reminder_hour: 20,
          reminder_minute: 0,
          onboarding_completed: 0,
          updated_at: String(params[0]),
        };
        this.flushToStorage();
        return { lastInsertRowId: 1, changes: 1 };
      }
      return { lastInsertRowId: 1, changes: 0 };
    }

    if (normalized.startsWith('UPDATE app_settings')) {
      this.appSettings = {
        id: 1,
        unit_system: params[0] as 'metric' | 'imperial',
        notifications_enabled: Number(params[1]),
        reminder_hour: Number(params[2]),
        reminder_minute: Number(params[3]),
        onboarding_completed: Number(params[4]),
        updated_at: String(params[5]),
      };
      this.flushToStorage();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (normalized.startsWith('INSERT INTO user_profile')) {
      this.userProfile = {
        id: 1,
        full_name: String(params[0]),
        date_of_birth: String(params[1]),
        gender: params[2] as UserProfile['gender'],
        height_cm: Number(params[3]),
        weight_kg: Number(params[4]),
        created_at: String(params[5]),
        updated_at: String(params[6]),
      };
      this.flushToStorage();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (normalized.startsWith('UPDATE user_profile')) {
      if (this.userProfile) {
        this.userProfile = {
          ...this.userProfile,
          full_name: String(params[0]),
          date_of_birth: String(params[1]),
          gender: params[2] as UserProfile['gender'],
          height_cm: Number(params[3]),
          weight_kg: Number(params[4]),
          updated_at: String(params[5]),
        };
        this.flushToStorage();
        return { lastInsertRowId: 1, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    if (normalized.startsWith('INSERT OR IGNORE INTO health_records')) {
      const date = String(params[0]);
      if (this.healthRecords.some((r) => r.date === date)) {
        return { lastInsertRowId: 0, changes: 0 };
      }
      const newRecord: HealthRecord = {
        id: this.autoIncrementId++,
        date,
        steps: Number(params[1]),
        calories: Number(params[2]),
        water: Number(params[3]),
        created_at: String(params[4]),
        updated_at: String(params[5]),
      };
      this.healthRecords.push(newRecord);
      this.flushToStorage();
      return { lastInsertRowId: newRecord.id, changes: 1 };
    }

    if (normalized.startsWith('INSERT INTO health_records')) {
      const date = String(params[0]);
      if (this.healthRecords.some((r) => r.date === date)) {
        throw new Error('UNIQUE constraint failed: health_records.date');
      }
      const newRecord: HealthRecord = {
        id: this.autoIncrementId++,
        date,
        steps: Number(params[1]),
        calories: Number(params[2]),
        water: Number(params[3]),
        created_at: String(params[4]),
        updated_at: String(params[5]),
      };
      this.healthRecords.push(newRecord);
      this.flushToStorage();
      return { lastInsertRowId: newRecord.id, changes: 1 };
    }

    if (normalized.startsWith('UPDATE health_records')) {
      const date = String(params[0]);
      const steps = Number(params[1]);
      const calories = Number(params[2]);
      const water = Number(params[3]);
      const updatedAt = String(params[4]);
      const id = Number(params[5]);

      const duplicate = this.healthRecords.find(
        (r) => r.date === date && r.id !== id
      );
      if (duplicate) {
        throw new Error('UNIQUE constraint failed: health_records.date');
      }

      const idx = this.healthRecords.findIndex((r) => r.id === id);
      if (idx === -1) {
        return { lastInsertRowId: 0, changes: 0 };
      }

      this.healthRecords[idx] = {
        ...this.healthRecords[idx],
        date,
        steps,
        calories,
        water,
        updated_at: updatedAt,
      };
      this.flushToStorage();
      return { lastInsertRowId: id, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(
    source: string,
    ...params: (string | number | null)[]
  ): Promise<T | null> {
    const normalized = source.replace(/\s+/g, ' ').trim();

    if (/PRAGMA\s+user_version/i.test(normalized)) {
      return { user_version: this.userVersion } as unknown as T;
    }

    if (normalized.includes('FROM daily_goals WHERE id = 1')) {
      return (this.dailyGoal ? { ...this.dailyGoal } : null) as unknown as T | null;
    }

    if (normalized.includes('FROM app_settings WHERE id = 1')) {
      return (this.appSettings ? { ...this.appSettings } : null) as unknown as T | null;
    }

    if (normalized.includes('FROM user_profile WHERE id = 1')) {
      return (this.userProfile ? { ...this.userProfile } : null) as unknown as T | null;
    }

    if (normalized.includes('FROM health_records WHERE id = ?')) {
      const id = Number(params[0]);
      const found = this.healthRecords.find((r) => r.id === id);
      return (found ? { ...found } : null) as unknown as T | null;
    }

    if (normalized.includes('FROM health_records WHERE date = ?')) {
      const date = String(params[0]);
      const found = this.healthRecords.find((r) => r.date === date);
      return (found ? { ...found } : null) as unknown as T | null;
    }

    return null;
  }

  async getAllAsync<T>(
    source: string,
    ...params: (string | number | null)[]
  ): Promise<T[]> {
    const normalized = source.replace(/\s+/g, ' ').trim();
    if (!normalized.includes('FROM health_records')) {
      return [];
    }

    let results = [...this.healthRecords];
    let paramIdx = 0;

    if (normalized.includes('date LIKE ?')) {
      const pattern = String(params[paramIdx++]).replace(/%/g, '');
      results = results.filter((r) => r.date.includes(pattern));
    }

    if (normalized.includes('date >= ?')) {
      const startDate = String(params[paramIdx++]);
      results = results.filter((r) => r.date >= startDate);
    }

    if (normalized.includes('date <= ?')) {
      const endDate = String(params[paramIdx++]);
      results = results.filter((r) => r.date <= endDate);
    }

    const isAsc = normalized.includes('ORDER BY date ASC');
    results.sort((a, b) => {
      if (a.date === b.date) {
        return isAsc ? a.id - b.id : b.id - a.id;
      }
      return isAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
    });

    if (normalized.includes('LIMIT ?')) {
      const limit = Number(params[paramIdx++]);
      results = results.slice(0, limit);
    }

    return results as unknown as T[];
  }
}
