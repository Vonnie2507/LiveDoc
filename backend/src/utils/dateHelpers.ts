import { ValidationError } from './errorHandlers'

export function formatDateToISO(date: Date): string {
  if (!(date instanceof Date)) {
    throw new ValidationError('Invalid date object provided');
  }
  return date.toISOString();
}

export function parseISOToDate(isoString: string): Date {
  if (typeof isoString !== 'string') {
    throw new ValidationError('Invalid ISO date string');
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ISO date format: ${isoString}`);
  }
  return date;
}

export function formatDateToLocal(date: Date, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  if (!(date instanceof Date)) {
    throw new ValidationError('Invalid date object provided');
  }
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const mergedOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
  return date.toLocaleString(locale, mergedOptions);
}

export function addDays(date: Date, days: number): Date {
  if (!(date instanceof Date)) {
    throw new ValidationError('Invalid date object provided');
  }
  if (typeof days !== 'number' || isNaN(days)) {
    throw new ValidationError('Days must be a valid number');
  }
  const newDate = new Date(date.getTime());
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

export function isDateInPast(date: Date): boolean {
  if (!(date instanceof Date)) {
    throw new ValidationError('Invalid date object provided');
  }
  const currentDate = new Date();
  return date.getTime() < currentDate.getTime();
}

export function getDateRangeFilter(startDate?: string, endDate?: string): { start: Date; end: Date } | null {
  if (startDate === undefined && endDate === undefined) {
    return null;
  }
  let start: Date | null = null;
  if (startDate !== undefined && typeof startDate === 'string') {
    start = parseISOToDate(startDate);
  }
  let end: Date | null = null;
  if (endDate !== undefined && typeof endDate === 'string') {
    end = parseISOToDate(endDate);
  }
  if (start === null && end !== null) {
    start = new Date(0);
  }
  if (end === null && start !== null) {
    end = new Date();
  }
  if (start !== null && end !== null && start.getTime() > end.getTime()) {
    throw new ValidationError('Start date must be before end date');
  }
  return { start: start!, end: end! };
}