import type { WeekStart } from '../types/index.ts';

/** Start of day (00:00:00.000) in local time */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** End of day (23:59:59.999) in local time */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Add days to a date */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Get Monday (or Sunday) of the week containing the date */
export function startOfWeek(date: Date, weekStart: WeekStart = 'monday'): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = weekStart === 'monday'
    ? (day === 0 ? 6 : day - 1)
    : day;
  d.setDate(d.getDate() - diff);
  return d;
}

/** Get Sunday (or Saturday) end of the week */
export function endOfWeek(date: Date, weekStart: WeekStart = 'monday'): Date {
  const start = startOfWeek(date, weekStart);
  return endOfDay(addDays(start, 6));
}

/** Start of month */
export function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** End of month */
export function endOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Number of days in a month */
export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Check if two dates are the same calendar day */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** Format YYYY-MM-DD key for a date */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD key back to a Date */
export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Get all days in a range (inclusive) */
export function getDaysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let d = startOfDay(start);
  const endD = startOfDay(end);
  while (d <= endD) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }
  return days;
}

/** Get the week number label, e.g. "Nov 11 - Nov 17" */
export function weekLabel(date: Date, weekStart: WeekStart): string {
  const start = startOfWeek(date, weekStart);
  const end = addDays(start, 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Month label, e.g. "November 2024" */
export function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Day names for the week */
export function weekDayNames(weekStart: WeekStart): string[] {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (weekStart === 'monday') {
    return [...names.slice(1), names[0]];
  }
  return names;
}

/** Calendar grid: 6 rows × 7 cols of dates for a given month */
export function calendarGrid(year: number, month: number, weekStart: WeekStart): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const start = startOfWeek(firstDay, weekStart);
  const rows: (Date | null)[][] = [];
  let cursor = new Date(start);
  for (let r = 0; r < 6; r++) {
    const row: (Date | null)[] = [];
    for (let c = 0; c < 7; c++) {
      row.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    rows.push(row);
  }
  return rows;
}
