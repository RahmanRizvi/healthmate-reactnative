/**
 * Formats a Date object as YYYY-MM-DD in local time.
 */
export function formatDateToISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current UTC/ISO timestamp string for created_at and updated_at.
 */
export function getNowTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validates whether a string is a valid calendar date in YYYY-MM-DD format.
 */
export function isValidISODate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

/**
 * Parses a YYYY-MM-DD string into a local Date instance safely.
 */
export function parseISODate(dateString: string): Date {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  return new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
}

export function formatReadableDate(dateString: string): string {
  if (!isValidISODate(dateString)) {
    return dateString;
  }
  const date = parseISODate(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}


export function formatShortDate(dateString: string): string {
  if (!isValidISODate(dateString)) {
    return dateString;
  }
  const date = parseISODate(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an ISO timestamp into a readable date and time.
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Adds or subtracts days from a YYYY-MM-DD string and returns YYYY-MM-DD.
 */
export function addDaysToISODate(dateString: string, days: number): string {
  const date = parseISODate(dateString);
  date.setDate(date.getDate() + days);
  return formatDateToISO(date);
}

/**
 * Returns the start (Monday) and end (Sunday) of the week containing the given YYYY-MM-DD date.
 */
export function getWeekDateRange(referenceDateISO: string): { startDate: string; endDate: string } {
  const date = parseISODate(referenceDateISO);
  const day = date.getDay();
  // Monday as first day of week (1..7)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startDate: formatDateToISO(start),
    endDate: formatDateToISO(end),
  };
}

/**
 * Returns the first and last day of the month containing the given YYYY-MM-DD date.
 */
export function getMonthDateRange(referenceDateISO: string): { startDate: string; endDate: string } {
  const date = parseISODate(referenceDateISO);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    startDate: formatDateToISO(start),
    endDate: formatDateToISO(end),
  };
}

/**
 * Generates an array of YYYY-MM-DD dates from startDate to endDate inclusive.
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = parseISODate(startDate);
  const last = parseISODate(endDate);

  while (current <= last) {
    dates.push(formatDateToISO(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
