import test from 'node:test';
import assert from 'node:assert/strict';

// Import our core utility & analytics functions
import {
  formatDuration,
  formatDurationShort,
  formatDurationHours,
  generateId,
} from '../src/lib/utils.ts';

import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  daysInMonth,
  addDays,
  dateKey,
  parseKey,
  isSameDay,
} from '../src/lib/date-utils.ts';

import {
  splitSessionByDay,
  totalSecondsForDate,
  totalSecondsInRange,
  secondsBySubjectInRange,
  computePeriodStats,
  hourlyActivity,
} from '../src/lib/analytics.ts';

import {
  validateSession,
  findOverlaps,
  validateImportData,
} from '../src/lib/validation.ts';

import { exportCSV } from '../src/lib/export.ts';

// ─── 1. DURATION & FORMATTING TESTS ─────────────────────────────
test('formatDuration formats seconds correctly into h, m, s', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(45), '45s');
  assert.equal(formatDuration(60), '1m 00s');
  assert.equal(formatDuration(125), '2m 05s');
  assert.equal(formatDuration(3600), '1h 00m 00s');
  assert.equal(formatDuration(3665), '1h 01m 05s');
  assert.equal(formatDuration(7325), '2h 02m 05s');
});

test('formatDurationShort formats concise strings', () => {
  assert.equal(formatDurationShort(50), '0m');
  assert.equal(formatDurationShort(120), '2m');
  assert.equal(formatDurationShort(3600), '1h 0m');
  assert.equal(formatDurationShort(5400), '1h 30m');
});

test('generateId generates unique IDs', () => {
  const id1 = generateId();
  const id2 = generateId();
  assert.notEqual(id1, id2);
  assert.ok(id1.length > 5);
});

// ─── 2. DATE UTILS & BOUNDARIES TESTS ───────────────────────────
test('startOfDay and endOfDay correctly frame a calendar day', () => {
  const d = new Date(2026, 10, 13, 14, 30, 45, 500);
  const start = startOfDay(d);
  const end = endOfDay(d);

  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(start.getSeconds(), 0);
  assert.equal(start.getMilliseconds(), 0);

  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getSeconds(), 59);
  assert.equal(end.getMilliseconds(), 999);
});

test('startOfWeek correctly calculates Monday and Sunday start', () => {
  // 2026-11-13 is a Friday
  const friday = new Date(2026, 10, 13);

  const mondayStart = startOfWeek(friday, 'monday');
  assert.equal(mondayStart.getDay(), 1); // Monday
  assert.equal(mondayStart.getDate(), 9);

  const sundayStart = startOfWeek(friday, 'sunday');
  assert.equal(sundayStart.getDay(), 0); // Sunday
  assert.equal(sundayStart.getDate(), 8);
});

test('daysInMonth handles 30, 31, and leap years', () => {
  assert.equal(daysInMonth(new Date(2026, 1, 1)), 28); // Feb 2026 = 28
  assert.equal(daysInMonth(new Date(2024, 1, 1)), 29); // Feb 2024 = 29 (leap)
  assert.equal(daysInMonth(new Date(2026, 10, 1)), 30); // Nov = 30
  assert.equal(daysInMonth(new Date(2026, 11, 1)), 31); // Dec = 31
});

test('dateKey and parseKey round-trip seamlessly', () => {
  const d = new Date(2026, 10, 13);
  const key = dateKey(d);
  assert.equal(key, '2026-11-13');

  const parsed = parseKey(key);
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 10);
  assert.equal(parsed.getDate(), 13);
});

// ─── 3. MIDNIGHT SPLITTING & SESSIONS TESTS ─────────────────────
test('splitSessionByDay splits a session crossing midnight into two segments', () => {
  // Session starts at 23:00 Nov 13 and ends at 01:30 Nov 14 (2.5 hours total)
  const start = new Date(2026, 10, 13, 23, 0, 0, 0).getTime();
  const end = new Date(2026, 10, 14, 1, 30, 0, 0).getTime();

  const mockSession = {
    id: 'sess-1',
    subjectId: 'sub-econ',
    startTimestamp: start,
    endTimestamp: end,
    durationSeconds: 9000, // 2.5h
    description: 'Late night Economics study',
    isManual: false,
    createdAt: start,
    updatedAt: start,
  };

  const segments = splitSessionByDay(mockSession);
  assert.equal(segments.length, 2);

  // First segment: 1 hour on 2026-11-13 (23:00 to 00:00)
  assert.equal(segments[0].date, '2026-11-13');
  assert.ok(Math.abs(segments[0].seconds - 3600) <= 1);

  // Second segment: 1.5 hours on 2026-11-14 (00:00 to 01:30)
  assert.equal(segments[1].date, '2026-11-14');
  assert.ok(Math.abs(segments[1].seconds - 5400) <= 1);
});

// ─── 4. ANALYTICS & STATS TESTS ─────────────────────────────────
test('totalSecondsForDate calculates exact tracked duration for that date', () => {
  const d = new Date(2026, 10, 13);
  const start = new Date(2026, 10, 13, 10, 0, 0).getTime();
  const end = new Date(2026, 10, 13, 12, 0, 0).getTime(); // 2 hours = 7200s

  const sessions = [
    {
      id: 's1',
      subjectId: 'sub1',
      startTimestamp: start,
      endTimestamp: end,
      durationSeconds: 7200,
      description: '',
      isManual: false,
      createdAt: start,
      updatedAt: start,
    },
  ];

  const total = totalSecondsForDate(sessions, d);
  assert.equal(total, 7200);
});

test('computePeriodStats correctly identifies most studied subject and totals', () => {
  const startRange = new Date(2026, 10, 1);
  const endRange = new Date(2026, 10, 30);

  const sessions = [
    {
      id: 's1',
      subjectId: 'econ',
      startTimestamp: new Date(2026, 10, 5, 10, 0).getTime(),
      endTimestamp: new Date(2026, 10, 5, 13, 0).getTime(), // 3h = 10800s
      durationSeconds: 10800,
      description: '',
      isManual: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 's2',
      subjectId: 'math',
      startTimestamp: new Date(2026, 10, 6, 14, 0).getTime(),
      endTimestamp: new Date(2026, 10, 6, 15, 0).getTime(), // 1h = 3600s
      durationSeconds: 3600,
      description: '',
      isManual: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  const stats = computePeriodStats(sessions, startRange, endRange);
  assert.equal(stats.totalSeconds, 14400); // 4h
  assert.equal(stats.sessionCount, 2);
  assert.equal(stats.activeDays, 2);
  assert.equal(stats.mostStudiedSubjectId, 'econ');
  assert.equal(stats.longestSessionSeconds, 10800);
  assert.equal(stats.avgSessionSeconds, 7200);
});

test('hourlyActivity correctly slots sessions into 24 hours', () => {
  const day = new Date(2026, 10, 13);
  const start = new Date(2026, 10, 13, 14, 0).getTime();
  const end = new Date(2026, 10, 13, 15, 30).getTime(); // 14:00 to 15:30 (1.5h)

  const sessions = [
    {
      id: 's1',
      subjectId: 'sub1',
      startTimestamp: start,
      endTimestamp: end,
      durationSeconds: 5400,
      description: '',
      isManual: false,
      createdAt: start,
      updatedAt: start,
    },
  ];

  const hours = hourlyActivity(sessions, day);
  assert.equal(hours.length, 24);
  assert.equal(hours[14], 3600); // 1h in hour 14
  assert.equal(hours[15], 1800); // 30m in hour 15
  assert.equal(hours[13], 0);
  assert.equal(hours[16], 0);
});

// ─── 5. VALIDATION & OVERLAP TESTS ──────────────────────────────
test('validateSession rejects invalid inputs', () => {
  assert.ok(validateSession({ subjectId: '' }) !== null);
  assert.ok(
    validateSession({
      subjectId: 'sub1',
      startTimestamp: 5000,
      endTimestamp: 4000, // end before start
    }) !== null
  );
  assert.ok(
    validateSession({
      subjectId: 'sub1',
      startTimestamp: Date.now(),
      endTimestamp: Date.now() + 1000000, // in the future
    }) !== null
  );
});

test('findOverlaps detects conflicting time segments', () => {
  const existing = [
    {
      id: 's1',
      subjectId: 'sub1',
      startTimestamp: 1000,
      endTimestamp: 2000,
      durationSeconds: 1,
      description: '',
      isManual: false,
      createdAt: 0,
      updatedAt: 0,
    },
  ];

  // Overlap
  const overlaps = findOverlaps(existing, 1500, 2500);
  assert.equal(overlaps.length, 1);

  // No overlap before
  assert.equal(findOverlaps(existing, 0, 1000).length, 0);

  // No overlap after
  assert.equal(findOverlaps(existing, 2000, 3000).length, 0);
});

test('validateImportData validates JSON backup structures', () => {
  assert.equal(validateImportData(null), 'Invalid data format');
  assert.equal(validateImportData({ version: '1' }), 'Missing or invalid version');
  assert.equal(
    validateImportData({
      version: 1,
      subjects: [],
      sessions: [],
      goals: [],
      settings: {},
    }),
    null
  );
});

// ─── 6. CSV EXPORT TESTS ────────────────────────────────────────
test('exportCSV produces properly formatted RFC4180 CSV rows', () => {
  const subjects = [
    { id: 'sub-1', name: 'Economics', color: '#10b981', icon: 'TrendingUp', createdAt: 0, archivedAt: null, isActive: true, sortOrder: 0 },
  ];
  const sessions = [
    {
      id: 's1',
      subjectId: 'sub-1',
      startTimestamp: new Date(2026, 10, 13, 10, 0, 0).getTime(),
      endTimestamp: new Date(2026, 10, 13, 11, 0, 0).getTime(),
      durationSeconds: 3600,
      description: 'Microeconomics Chapter 2',
      isManual: false,
      createdAt: 0,
      updatedAt: 0,
    },
  ];

  const csv = exportCSV(sessions, subjects);
  assert.ok(csv.includes('Subject,Start Date,Start Time,End Date,End Time,Duration (seconds),Duration,Description'));
  assert.ok(csv.includes('"Economics"'));
  assert.ok(csv.includes('3600'));
  assert.ok(csv.includes('"Microeconomics Chapter 2"'));
});
