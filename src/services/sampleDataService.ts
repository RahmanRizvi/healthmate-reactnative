import { addDaysToISODate, formatDateToISO } from '../core/utils/dateUtils';
import { CreateHealthRecordInput } from '../models/HealthRecord';
import { healthRecordRepository } from '../repositories/sqlite/SQLiteHealthRecordRepository';

const SAMPLE_VARIATIONS: { steps: number; calories: number; water: number }[] = [
  { steps: 7850, calories: 420, water: 2000 }, // Today (matches prompt demonstration example)
  { steps: 9240, calories: 510, water: 2500 },
  { steps: 6410, calories: 340, water: 1850 },
  { steps: 10450, calories: 580, water: 2750 },
  { steps: 8120, calories: 445, water: 2200 },
  { steps: 5390, calories: 290, water: 1600 },
  { steps: 11200, calories: 620, water: 2600 },
  { steps: 7600, calories: 410, water: 2100 },
  { steps: 8900, calories: 475, water: 2400 },
  { steps: 6850, calories: 365, water: 1950 },
  { steps: 9500, calories: 520, water: 2500 },
  { steps: 7200, calories: 390, water: 2050 },
  { steps: 8400, calories: 460, water: 2300 },
  { steps: 10100, calories: 540, water: 2550 },
];

/**
 * Builds 14 days of realistic sample health records ending on referenceDateISO.
 */
export function buildSampleHealthRecords(
  referenceDateISO: string = formatDateToISO()
): CreateHealthRecordInput[] {
  return SAMPLE_VARIATIONS.map((metrics, index) => ({
    date: addDaysToISODate(referenceDateISO, -index),
    steps: metrics.steps,
    calories: metrics.calories,
    water: metrics.water,
  }));
}

/**
 * Inserts sample records using INSERT OR IGNORE so existing user records are never overwritten
 * and duplicate dates are never created.
 */
export async function insertSampleDemonstrationData(
  referenceDateISO: string = formatDateToISO()
): Promise<number> {
  const sampleRecords = buildSampleHealthRecords(referenceDateISO);
  return healthRecordRepository.insertSampleRecordsIfNotExist(sampleRecords);
}
