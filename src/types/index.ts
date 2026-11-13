// ─── Subject ───────────────────────────────────────────────
export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number; // epoch ms
  archivedAt: number | null;
  isActive: boolean;
  sortOrder: number;
}

// ─── Session ───────────────────────────────────────────────
export interface Session {
  id: string;
  subjectId: string;
  startTimestamp: number; // epoch ms
  endTimestamp: number;   // epoch ms
  durationSeconds: number;
  description: string;
  isManual: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── Active Timer State (persisted) ────────────────────────
export interface ActiveTimerState {
  subjectId: string;
  startTimestamp: number;  // when this segment started
  accumulatedMs: number;   // time accumulated before this segment
  isPaused: boolean;
  pausedAt: number | null; // when it was paused
}

// ─── Goal ──────────────────────────────────────────────────
export type GoalPeriod = 'daily' | 'weekly' | 'monthly';

export interface Goal {
  id: string;
  subjectId: string;
  period: GoalPeriod;
  targetSeconds: number;
  createdAt: number;
  updatedAt: number;
}

// ─── Settings ──────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light';
export type TimeFormat = '12h' | '24h';
export type WeekStart = 'monday' | 'sunday';

export interface CalendarThresholds {
  low: number;    // hours
  moderate: number;
  high: number;
  highest: number;
}

export interface AppSettings {
  theme: ThemeMode;
  timeFormat: TimeFormat;
  weekStart: WeekStart;
  calendarThresholds: CalendarThresholds;
}

// ─── Defaults ──────────────────────────────────────────────
export const DEFAULT_SUBJECTS: Omit<Subject, 'id' | 'createdAt'>[] = [
  { name: 'Economics',            color: '#10b981', icon: 'TrendingUp',    archivedAt: null, isActive: true, sortOrder: 0 },
  { name: 'Mathematics',         color: '#3b82f6', icon: 'Calculator',    archivedAt: null, isActive: true, sortOrder: 1 },
  { name: 'Econometrics',        color: '#8b5cf6', icon: 'BarChart3',     archivedAt: null, isActive: true, sortOrder: 2 },
  { name: 'Python Programming',  color: '#f59e0b', icon: 'Code',          archivedAt: null, isActive: true, sortOrder: 3 },
  { name: 'Quant Research',      color: '#06b6d4', icon: 'FlaskConical',  archivedAt: null, isActive: true, sortOrder: 4 },
  { name: 'Reading',             color: '#ec4899', icon: 'BookOpen',      archivedAt: null, isActive: true, sortOrder: 5 },
  { name: 'Personal Development',color: '#f97316', icon: 'Rocket',        archivedAt: null, isActive: true, sortOrder: 6 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  timeFormat: '24h',
  weekStart: 'monday',
  calendarThresholds: { low: 2, moderate: 4, high: 6, highest: 8 },
};

export const SUBJECT_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4',
  '#ec4899', '#f97316', '#ef4444', '#84cc16', '#14b8a6',
  '#a855f7', '#6366f1', '#e11d48', '#0ea5e9', '#d946ef',
];

export const SUBJECT_ICONS = [
  'TrendingUp', 'Calculator', 'BarChart3', 'Code', 'FlaskConical',
  'BookOpen', 'Rocket', 'Brain', 'GraduationCap', 'Lightbulb',
  'Target', 'Puzzle', 'Microscope', 'Palette', 'Music',
  'Globe', 'Cpu', 'Heart', 'Star', 'Zap',
];
