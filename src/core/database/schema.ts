export const CREATE_HEALTH_RECORDS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS health_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  steps INTEGER NOT NULL DEFAULT 0 CHECK (steps >= 0),
  calories INTEGER NOT NULL DEFAULT 0 CHECK (calories >= 0),
  water INTEGER NOT NULL DEFAULT 0 CHECK (water >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const CREATE_HEALTH_RECORDS_DATE_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_health_records_date ON health_records (date);
`;

export const CREATE_USER_PROFILE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  full_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  gender TEXT NOT NULL,
  height_cm REAL NOT NULL CHECK (height_cm > 0),
  weight_kg REAL NOT NULL CHECK (weight_kg > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const CREATE_DAILY_GOALS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS daily_goals (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  steps_goal INTEGER NOT NULL DEFAULT 10000 CHECK (steps_goal > 0),
  water_goal_ml INTEGER NOT NULL DEFAULT 2500 CHECK (water_goal_ml > 0),
  calories_goal_kcal INTEGER NOT NULL DEFAULT 500 CHECK (calories_goal_kcal > 0),
  updated_at TEXT NOT NULL
);
`;

export const CREATE_APP_SETTINGS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  unit_system TEXT NOT NULL DEFAULT 'metric',
  notifications_enabled INTEGER NOT NULL DEFAULT 0,
  reminder_hour INTEGER NOT NULL DEFAULT 20,
  reminder_minute INTEGER NOT NULL DEFAULT 0,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
`;

export const ALL_SCHEMA_STATEMENTS = [
  CREATE_HEALTH_RECORDS_TABLE_SQL,
  CREATE_HEALTH_RECORDS_DATE_INDEX_SQL,
  CREATE_USER_PROFILE_TABLE_SQL,
  CREATE_DAILY_GOALS_TABLE_SQL,
  CREATE_APP_SETTINGS_TABLE_SQL,
];
