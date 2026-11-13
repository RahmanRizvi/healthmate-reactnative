import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME } from '../constants/appConstants';
import { AppError } from '../errors/AppError';
import { DatabaseExecutor, runMigrations } from './migrations';
import { WebAndMemorySQLiteExecutor } from './webFallbackExecutor';

let dbInstance: DatabaseExecutor | null = null;
let initPromise: Promise<DatabaseExecutor> | null = null;


export function setDatabaseExecutorForTesting(executor: DatabaseExecutor | null): void {
  dbInstance = executor;
  initPromise = executor ? Promise.resolve(executor) : null;
}


export async function initializeDatabase(): Promise<DatabaseExecutor> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      let db: DatabaseExecutor;
      if (Platform.OS === 'web') {
        db = new WebAndMemorySQLiteExecutor(true);
      } else {
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      }
      await runMigrations(db);
      dbInstance = db;
      return db;
    } catch (error) {
      initPromise = null;
      throw new AppError(
        'Failed to initialize the local SQLite database.',
        'DATABASE_ERROR',
        error
      );
    }
  })();

  return initPromise;
}

/**
 * Returns the active initialized database connection, initializing it if needed.
 */
export async function getDatabase(): Promise<DatabaseExecutor> {
  if (dbInstance) {
    return dbInstance;
  }
  return initializeDatabase();
}

/**
 * Resets all user data in the database within a transaction and restores default goals and settings.
 */
export async function resetAllDatabaseData(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM health_records;');
    await db.runAsync('DELETE FROM user_profile;');
    await db.runAsync('DELETE FROM daily_goals;');
    await db.runAsync('DELETE FROM app_settings;');
  });
  await runMigrations(db);
}
