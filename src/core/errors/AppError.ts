export type ErrorCode =
  | 'DATABASE_ERROR'
  | 'DUPLICATE_DATE'
  | 'RECORD_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'EXPORT_ERROR'
  | 'NOTIFICATION_PERMISSION_DENIED'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly originalError?: unknown;

  constructor(message: string, code: ErrorCode = 'UNKNOWN_ERROR', originalError?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
  }
}

export class DuplicateDateError extends AppError {
  public readonly date: string;
  public readonly existingRecordId?: number;

  constructor(date: string, existingRecordId?: number) {
    super(
      `A health record already exists for ${date}. You can edit the existing record instead.`,
      'DUPLICATE_DATE'
    );
    this.name = 'DuplicateDateError';
    this.date = date;
    this.existingRecordId = existingRecordId;
  }
}

export class RecordNotFoundError extends AppError {
  constructor(identifier: string | number) {
    super(`Health record (${identifier}) was not found.`, 'RECORD_NOT_FOUND');
    this.name = 'RecordNotFoundError';
  }
}

export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (error.message.includes('UNIQUE constraint failed: health_records.date')) {
      return 'A health record already exists for this date.';
    }
    return error.message || fallback;
  }
  return fallback;
}
