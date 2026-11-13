import { getDatabase } from '../../core/database/database';
import {
  AppError,
  DuplicateDateError,
  RecordNotFoundError,
} from '../../core/errors/AppError';
import { getNowTimestamp } from '../../core/utils/dateUtils';
import {
  CreateHealthRecordInput,
  HealthRecord,
  RecordQueryOptions,
  UpdateHealthRecordInput,
} from '../../models/HealthRecord';
import { IHealthRecordRepository } from '../interfaces/IHealthRecordRepository';

export class SQLiteHealthRecordRepository implements IHealthRecordRepository {
  async getAll(options: RecordQueryOptions = {}): Promise<HealthRecord[]> {
    const db = await getDatabase();
    const {
      searchDate,
      startDate,
      endDate,
      sortOrder = 'newest',
      limit,
    } = options;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (searchDate && searchDate.trim().length > 0) {
      conditions.push('date LIKE ?');
      params.push(`%${searchDate.trim()}%`);
    }

    if (startDate) {
      conditions.push('date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderDirection = sortOrder === 'oldest' ? 'ASC' : 'DESC';
    let sql = `SELECT * FROM health_records ${whereClause} ORDER BY date ${orderDirection}, id ${orderDirection}`;

    if (typeof limit === 'number' && limit > 0) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    return db.getAllAsync<HealthRecord>(sql, ...params);
  }

  async getById(id: number): Promise<HealthRecord | null> {
    const db = await getDatabase();
    return db.getFirstAsync<HealthRecord>(
      'SELECT * FROM health_records WHERE id = ?;',
      id
    );
  }

  async getByDate(date: string): Promise<HealthRecord | null> {
    const db = await getDatabase();
    return db.getFirstAsync<HealthRecord>(
      'SELECT * FROM health_records WHERE date = ?;',
      date
    );
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
    sortOrder: 'newest' | 'oldest' = 'oldest'
  ): Promise<HealthRecord[]> {
    return this.getAll({ startDate, endDate, sortOrder });
  }

  async create(input: CreateHealthRecordInput): Promise<HealthRecord> {
    const db = await getDatabase();
    const existing = await this.getByDate(input.date);
    if (existing) {
      throw new DuplicateDateError(input.date, existing.id);
    }

    const now = getNowTimestamp();
    const result = await db.runAsync(
      `INSERT INTO health_records (date, steps, calories, water, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      input.date,
      Math.round(input.steps),
      Math.round(input.calories),
      Math.round(input.water),
      now,
      now
    );

    const created = await this.getById(result.lastInsertRowId);
    if (!created) {
      throw new AppError('Failed to retrieve newly created health record.', 'DATABASE_ERROR');
    }
    return created;
  }

  async update(id: number, input: UpdateHealthRecordInput): Promise<HealthRecord> {
    const db = await getDatabase();
    const currentRecord = await this.getById(id);
    if (!currentRecord) {
      throw new RecordNotFoundError(id);
    }

    if (input.date !== currentRecord.date) {
      const duplicateOnDate = await this.getByDate(input.date);
      if (duplicateOnDate && duplicateOnDate.id !== id) {
        throw new DuplicateDateError(input.date, duplicateOnDate.id);
      }
    }

    const now = getNowTimestamp();
    await db.runAsync(
      `UPDATE health_records
       SET date = ?, steps = ?, calories = ?, water = ?, updated_at = ?
       WHERE id = ?;`,
      input.date,
      Math.round(input.steps),
      Math.round(input.calories),
      Math.round(input.water),
      now,
      id
    );

    const updated = await this.getById(id);
    if (!updated) {
      throw new RecordNotFoundError(id);
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) {
      throw new RecordNotFoundError(id);
    }
    await db.runAsync('DELETE FROM health_records WHERE id = ?;', id);
  }

  async addWaterForDate(date: string, amountMl: number): Promise<HealthRecord> {
    if (amountMl <= 0) {
      throw new AppError('Water amount must be greater than zero.', 'VALIDATION_ERROR');
    }

    const existing = await this.getByDate(date);
    if (existing) {
      return this.update(existing.id, {
        date: existing.date,
        steps: existing.steps,
        calories: existing.calories,
        water: existing.water + Math.round(amountMl),
      });
    }

    return this.create({
      date,
      steps: 0,
      calories: 0,
      water: Math.round(amountMl),
    });
  }

  async insertSampleRecordsIfNotExist(records: CreateHealthRecordInput[]): Promise<number> {
    const db = await getDatabase();
    let insertedCount = 0;
    const now = getNowTimestamp();

    await db.withTransactionAsync(async () => {
      for (const record of records) {
        const result = await db.runAsync(
          `INSERT OR IGNORE INTO health_records (date, steps, calories, water, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?);`,
          record.date,
          Math.round(record.steps),
          Math.round(record.calories),
          Math.round(record.water),
          now,
          now
        );
        if (result.changes > 0) {
          insertedCount += 1;
        }
      }
    });

    return insertedCount;
  }
}

export const healthRecordRepository = new SQLiteHealthRecordRepository();
