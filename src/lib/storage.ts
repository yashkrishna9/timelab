import type {
  Subject,
  Session,
  Goal,
  AppSettings,
  ActiveTimerState,
} from '../types/index.ts';
import { DEFAULT_SUBJECTS, DEFAULT_SETTINGS } from '../types/index.ts';
import { generateId } from './utils.ts';

const STORAGE_VERSION = 1;
const KEYS = {
  version: 'timelab_version',
  subjects: 'timelab_subjects',
  sessions: 'timelab_sessions',
  goals: 'timelab_goals',
  settings: 'timelab_settings',
  activeTimer: 'timelab_active_timer',
} as const;

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

// ─── Initialize ────────────────────────────────────────────
export function initializeStorage(): void {
  const version = getItem<number | null>(KEYS.version, null);
  if (version === null) {
    const now = Date.now();
    const subjects: Subject[] = DEFAULT_SUBJECTS.map((s, i) => ({
      ...s,
      id: generateId() + '-' + i,
      createdAt: now,
    }));
    setItem(KEYS.version, STORAGE_VERSION);
    setItem(KEYS.subjects, subjects);
    setItem(KEYS.sessions, []);
    setItem(KEYS.goals, []);
    setItem(KEYS.settings, DEFAULT_SETTINGS);
  }
}

// ─── Subjects ──────────────────────────────────────────────
export function getSubjects(): Subject[] {
  return getItem<Subject[]>(KEYS.subjects, []);
}

export function saveSubjects(subjects: Subject[]): void {
  setItem(KEYS.subjects, subjects);
}

export function addSubject(subject: Subject): void {
  const subjects = getSubjects();
  subjects.push(subject);
  saveSubjects(subjects);
}

export function updateSubject(id: string, updates: Partial<Subject>): void {
  const subjects = getSubjects();
  const idx = subjects.findIndex((s) => s.id === id);
  if (idx !== -1) {
    subjects[idx] = { ...subjects[idx], ...updates };
    saveSubjects(subjects);
  }
}

export function deleteSubject(id: string): void {
  const subjects = getSubjects().filter((s) => s.id !== id);
  saveSubjects(subjects);
}

// ─── Sessions ──────────────────────────────────────────────
export function getSessions(): Session[] {
  return getItem<Session[]>(KEYS.sessions, []);
}

export function saveSessions(sessions: Session[]): void {
  setItem(KEYS.sessions, sessions);
}

export function addSession(session: Session): void {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
}

export function updateSession(id: string, updates: Partial<Session>): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx !== -1) {
    sessions[idx] = { ...sessions[idx], ...updates, updatedAt: Date.now() };
    saveSessions(sessions);
  }
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
}

// ─── Goals ─────────────────────────────────────────────────
export function getGoals(): Goal[] {
  return getItem<Goal[]>(KEYS.goals, []);
}

export function saveGoals(goals: Goal[]): void {
  setItem(KEYS.goals, goals);
}

export function addGoal(goal: Goal): void {
  const goals = getGoals();
  const filtered = goals.filter(
    (g) => !(g.subjectId === goal.subjectId && g.period === goal.period)
  );
  filtered.push(goal);
  saveGoals(filtered);
}

export function deleteGoal(id: string): void {
  const goals = getGoals().filter((g) => g.id !== id);
  saveGoals(goals);
}

// ─── Settings ──────────────────────────────────────────────
export function getSettings(): AppSettings {
  return getItem<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  setItem(KEYS.settings, settings);
}

// ─── Active Timer ──────────────────────────────────────────
export function getActiveTimer(): ActiveTimerState | null {
  return getItem<ActiveTimerState | null>(KEYS.activeTimer, null);
}

export function saveActiveTimer(state: ActiveTimerState | null): void {
  setItem(KEYS.activeTimer, state);
}

// ─── Export / Import ───────────────────────────────────────
export interface ExportData {
  version: number;
  exportedAt: number;
  subjects: Subject[];
  sessions: Session[];
  goals: Goal[];
  settings: AppSettings;
}

export function exportAllData(): ExportData {
  return {
    version: STORAGE_VERSION,
    exportedAt: Date.now(),
    subjects: getSubjects(),
    sessions: getSessions(),
    goals: getGoals(),
    settings: getSettings(),
  };
}

export function importData(
  data: ExportData
): { imported: number; skipped: number } {
  let imported = 0;
  let skipped = 0;

  // Merge subjects
  const existingSubjects = getSubjects();
  const existingIds = new Set(existingSubjects.map((s) => s.id));
  for (const s of data.subjects) {
    if (!existingIds.has(s.id)) {
      existingSubjects.push(s);
      imported++;
    } else {
      skipped++;
    }
  }
  saveSubjects(existingSubjects);

  // Merge sessions
  const existingSessions = getSessions();
  const sessionIds = new Set(existingSessions.map((s) => s.id));
  for (const s of data.sessions) {
    if (!sessionIds.has(s.id)) {
      existingSessions.push(s);
      imported++;
    } else {
      skipped++;
    }
  }
  saveSessions(existingSessions);

  // Merge goals
  const existingGoals = getGoals();
  const goalIds = new Set(existingGoals.map((g) => g.id));
  for (const g of data.goals) {
    if (!goalIds.has(g.id)) {
      existingGoals.push(g);
      imported++;
    } else {
      skipped++;
    }
  }
  saveGoals(existingGoals);

  // Settings
  saveSettings(data.settings);

  return { imported, skipped };
}

export function resetAllData(): void {
  Object.values(KEYS).forEach((key) => {
    if (typeof window !== 'undefined') localStorage.removeItem(key);
  });
  initializeStorage();
}
