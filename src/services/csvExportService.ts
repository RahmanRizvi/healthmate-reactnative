import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AppError } from '../core/errors/AppError';
import { formatDateToISO } from '../core/utils/dateUtils';
import { HealthRecord } from '../models/HealthRecord';

/**
 * Escapes a CSV cell value safely.
 */
function escapeCSVField(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates RFC-4180 compliant CSV string for health records.
 * Columns: Date,Steps,Calories,Water,Created timestamp,Updated timestamp
 */
export function buildHealthRecordsCSV(records: HealthRecord[]): string {
  const header = [
    'Date',
    'Steps',
    'Calories',
    'Water',
    'Created timestamp',
    'Updated timestamp',
  ].join(',');

  const rows = records.map((rec) =>
    [
      escapeCSVField(rec.date),
      escapeCSVField(rec.steps),
      escapeCSVField(rec.calories),
      escapeCSVField(rec.water),
      escapeCSVField(rec.created_at),
      escapeCSVField(rec.updated_at),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}

export interface ExportResult {
  fileName: string;
  recordCount: number;
  fileUri?: string;
}

/**
 * Exports the provided health records to a CSV file and shares or downloads it.
 * Throws AppError('EXPORT_ERROR') if there are no records or if sharing fails.
 */
export async function exportHealthRecordsToCSV(
  records: HealthRecord[]
): Promise<ExportResult> {
  if (!records || records.length === 0) {
    throw new AppError(
      'There are no health records to export yet. Add at least one health record first.',
      'EXPORT_ERROR'
    );
  }

  const csvContent = buildHealthRecordsCSV(records);
  const fileName = `healthmate-records-${formatDateToISO()}.csv`;

  if (Platform.OS === 'web') {
    try {
      if (typeof document !== 'undefined' && typeof Blob !== 'undefined') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return {
          fileName,
          recordCount: records.length,
          fileUri: `web-download://${fileName}`,
        };
      }
      throw new Error('Browser download API is unavailable.');
    } catch (err) {
      throw new AppError(
        'Failed to download the CSV export file in your browser.',
        'EXPORT_ERROR',
        err
      );
    }
  }

  try {
    const file = new File(Paths.cache, fileName);
    file.writeSync(csvContent);

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new AppError(
        'Native file sharing is not available on this device.',
        'EXPORT_ERROR'
      );
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export HealthMate Records (CSV)',
      UTI: 'public.comma-separated-values-text',
    });

    return {
      fileName,
      recordCount: records.length,
      fileUri: file.uri,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Failed to export and share health records CSV file.',
      'EXPORT_ERROR',
      error
    );
  }
}
