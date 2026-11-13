import { getDatabase } from '../../core/database/database';
import { AppError } from '../../core/errors/AppError';
import { getNowTimestamp } from '../../core/utils/dateUtils';
import { UpsertUserProfileInput, UserProfile } from '../../models/UserProfile';
import { IUserProfileRepository } from '../interfaces/IUserProfileRepository';

export class SQLiteUserProfileRepository implements IUserProfileRepository {
  async getProfile(): Promise<UserProfile | null> {
    const db = await getDatabase();
    return db.getFirstAsync<UserProfile>('SELECT * FROM user_profile WHERE id = 1;');
  }

  async upsertProfile(input: UpsertUserProfileInput): Promise<UserProfile> {
    const db = await getDatabase();
    const existing = await this.getProfile();
    const now = getNowTimestamp();

    if (existing) {
      await db.runAsync(
        `UPDATE user_profile
         SET full_name = ?, date_of_birth = ?, gender = ?, height_cm = ?, weight_kg = ?, updated_at = ?
         WHERE id = 1;`,
        input.full_name.trim(),
        input.date_of_birth,
        input.gender,
        input.height_cm,
        input.weight_kg,
        now
      );
    } else {
      await db.runAsync(
        `INSERT INTO user_profile (id, full_name, date_of_birth, gender, height_cm, weight_kg, created_at, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?);`,
        input.full_name.trim(),
        input.date_of_birth,
        input.gender,
        input.height_cm,
        input.weight_kg,
        now,
        now
      );
    }

    const saved = await this.getProfile();
    if (!saved) {
      throw new AppError('Failed to save user profile.', 'DATABASE_ERROR');
    }
    return saved;
  }
}

export const userProfileRepository = new SQLiteUserProfileRepository();
