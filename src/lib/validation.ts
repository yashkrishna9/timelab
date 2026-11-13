import type { Session } from '../types/index.ts';

/** Validate a manual session entry */
export function validateSession(session: Partial<Session>): string | null {
  if (!session.subjectId) return 'Subject is required';
  if (!session.startTimestamp || !session.endTimestamp)
    return 'Start and end times are required';
  if (session.startTimestamp >= session.endTimestamp)
    return 'End time must be after start time';
  if (session.endTimestamp > Date.now() + 60000)
    return 'End time cannot be in the future';
  const duration = (session.endTimestamp - session.startTimestamp) / 1000;
  if (duration > 24 * 3600) return 'Session cannot exceed 24 hours';
  if (duration < 1) return 'Session must be at least 1 second';
  return null;
}

/** Check for overlapping sessions */
export function findOverlaps(
  sessions: Session[],
  newStart: number,
  newEnd: number,
  excludeId?: string
): Session[] {
  return sessions.filter((s) => {
    if (s.id === excludeId) return false;
    return s.startTimestamp < newEnd && s.endTimestamp > newStart;
  });
}

/** Validate import data structure */
export function validateImportData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return 'Invalid data format';
  const d = data as Record<string, unknown>;
  if (!d.version || typeof d.version !== 'number')
    return 'Missing or invalid version';
  if (!Array.isArray(d.subjects)) return 'Missing subjects array';
  if (!Array.isArray(d.sessions)) return 'Missing sessions array';
  if (!Array.isArray(d.goals)) return 'Missing goals array';
  if (!d.settings || typeof d.settings !== 'object') return 'Missing settings';
  return null;
}
