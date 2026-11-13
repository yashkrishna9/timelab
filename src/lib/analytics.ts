import type { Session, WeekStart } from '../types/index.ts';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  dateKey,
  addDays,
} from './date-utils.ts';

/**
 * Split a session that crosses midnight into per-day segments.
 * Each segment has adjusted start/end timestamps and duration.
 */
export function splitSessionByDay(
  session: Session
): { date: string; seconds: number; session: Session }[] {
  const segments: { date: string; seconds: number; session: Session }[] = [];
  let current = new Date(session.startTimestamp);
  const end = new Date(session.endTimestamp);

  while (current < end) {
    const dayEnd = endOfDay(current);
    const segEnd = dayEnd < end ? new Date(dayEnd.getTime() + 1) : end;
    const seconds = (segEnd.getTime() - current.getTime()) / 1000;
    segments.push({
      date: dateKey(current),
      seconds: Math.max(0, seconds),
      session,
    });
    current = new Date(startOfDay(addDays(current, 1)));
  }
  return segments;
}

/** Filter sessions that overlap with a time range */
export function sessionsInRange(
  sessions: Session[],
  start: Date,
  end: Date
): Session[] {
  const s = start.getTime();
  const e = end.getTime();
  return sessions.filter(
    (session) => session.startTimestamp < e && session.endTimestamp > s
  );
}

/** Get total seconds tracked on a specific date */
export function totalSecondsForDate(sessions: Session[], date: Date): number {
  const dayStart = startOfDay(date).getTime();
  const dayEnd = endOfDay(date).getTime();
  let total = 0;
  for (const session of sessions) {
    if (session.endTimestamp <= dayStart || session.startTimestamp >= dayEnd + 1)
      continue;
    const start = Math.max(session.startTimestamp, dayStart);
    const end = Math.min(session.endTimestamp, dayEnd + 1);
    total += (end - start) / 1000;
  }
  return total;
}

/** Get total seconds for a date range */
export function totalSecondsInRange(
  sessions: Session[],
  start: Date,
  end: Date
): number {
  const s = start.getTime();
  const e = end.getTime() + 1;
  let total = 0;
  for (const session of sessions) {
    if (session.endTimestamp <= s || session.startTimestamp >= e) continue;
    const clampStart = Math.max(session.startTimestamp, s);
    const clampEnd = Math.min(session.endTimestamp, e);
    total += (clampEnd - clampStart) / 1000;
  }
  return total;
}

/** Group seconds by subject for a date range */
export function secondsBySubjectInRange(
  sessions: Session[],
  start: Date,
  end: Date
): Record<string, number> {
  const s = start.getTime();
  const e = end.getTime() + 1;
  const result: Record<string, number> = {};
  for (const session of sessions) {
    if (session.endTimestamp <= s || session.startTimestamp >= e) continue;
    const clampStart = Math.max(session.startTimestamp, s);
    const clampEnd = Math.min(session.endTimestamp, e);
    const secs = (clampEnd - clampStart) / 1000;
    result[session.subjectId] = (result[session.subjectId] || 0) + secs;
  }
  return result;
}

/** Group seconds by date key */
export function secondsByDate(
  sessions: Session[],
  start: Date,
  end: Date
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const session of sessions) {
    const segments = splitSessionByDay(session);
    for (const seg of segments) {
      const d = new Date(seg.date + 'T00:00:00');
      if (d >= startOfDay(start) && d <= endOfDay(end)) {
        result[seg.date] = (result[seg.date] || 0) + seg.seconds;
      }
    }
  }
  return result;
}

/** Sessions per subject count */
export function sessionCountBySubject(
  sessions: Session[],
  start: Date,
  end: Date
): Record<string, number> {
  const filtered = sessionsInRange(sessions, start, end);
  const result: Record<string, number> = {};
  for (const s of filtered) {
    result[s.subjectId] = (result[s.subjectId] || 0) + 1;
  }
  return result;
}

/** Get hourly activity for a date (24 slots, each = seconds active) */
export function hourlyActivity(sessions: Session[], date: Date): number[] {
  const dayStart = startOfDay(date).getTime();
  const hours = new Array(24).fill(0);
  for (const session of sessions) {
    const sStart = Math.max(session.startTimestamp, dayStart);
    const sEnd = Math.min(session.endTimestamp, dayStart + 24 * 3600000);
    if (sStart >= sEnd) continue;
    const startHour = Math.floor((sStart - dayStart) / 3600000);
    const endHour = Math.min(23, Math.floor((sEnd - dayStart - 1) / 3600000));
    for (let h = startHour; h <= endHour; h++) {
      const hStart = dayStart + h * 3600000;
      const hEnd = hStart + 3600000;
      const overlap = Math.min(sEnd, hEnd) - Math.max(sStart, hStart);
      if (overlap > 0) hours[h] += overlap / 1000;
    }
  }
  return hours;
}

/** Daily totals for a week */
export function weeklyDailyTotals(
  sessions: Session[],
  date: Date,
  weekStart: WeekStart
): number[] {
  const start = startOfWeek(date, weekStart);
  const totals: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    totals.push(totalSecondsForDate(sessions, d));
  }
  return totals;
}

export interface PeriodStats {
  totalSeconds: number;
  sessionCount: number;
  activeDays: number;
  avgSessionSeconds: number;
  longestSessionSeconds: number;
  mostStudiedSubjectId: string | null;
  leastStudiedSubjectId: string | null;
  subjectBreakdown: Record<string, number>;
}

export function computePeriodStats(
  sessions: Session[],
  start: Date,
  end: Date
): PeriodStats {
  const filtered = sessionsInRange(sessions, start, end);
  const breakdown = secondsBySubjectInRange(sessions, start, end);
  const dailyTotals = secondsByDate(sessions, start, end);
  const activeDays = Object.values(dailyTotals).filter((s) => s > 60).length;
  const totalSeconds = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const longestSession = filtered.reduce(
    (max, s) => Math.max(max, s.durationSeconds),
    0
  );

  let mostId: string | null = null;
  let leastId: string | null = null;
  let maxSecs = 0;
  let minSecs = Infinity;
  for (const [id, secs] of Object.entries(breakdown)) {
    if (secs > maxSecs) {
      maxSecs = secs;
      mostId = id;
    }
    if (secs < minSecs) {
      minSecs = secs;
      leastId = id;
    }
  }

  return {
    totalSeconds,
    sessionCount: filtered.length,
    activeDays,
    avgSessionSeconds: filtered.length > 0 ? totalSeconds / filtered.length : 0,
    longestSessionSeconds: longestSession,
    mostStudiedSubjectId: mostId,
    leastStudiedSubjectId: leastId,
    subjectBreakdown: breakdown,
  };
}
