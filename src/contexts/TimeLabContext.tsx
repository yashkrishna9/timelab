'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Subject, Session, Goal, AppSettings, ActiveTimerState } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { generateId } from '@/lib/utils';
import * as storage from '@/lib/storage';
import { startOfDay } from '@/lib/date-utils';
import { validateSession, findOverlaps } from '@/lib/validation';

// ─── Context Interface ─────────────────────────────────────────
interface TimelabContextType {
  subjects: Subject[];
  sessions: Session[];
  goals: Goal[];
  settings: AppSettings;
  activeTimer: ActiveTimerState | null;
  isReady: boolean;

  // Timer controls
  startTimer: (subjectId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  getElapsedSeconds: () => number;

  // Subject actions
  addSubject: (name: string, color: string, icon: string) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  archiveSubject: (id: string) => void;
  restoreSubject: (id: string) => void;
  deleteSubject: (id: string) => void;

  // Session actions
  addManualSession: (subjectId: string, start: number, end: number, description?: string) => string | null;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;

  // Goal actions
  setGoal: (subjectId: string, period: 'daily' | 'weekly' | 'monthly', targetSeconds: number) => void;
  deleteGoal: (id: string) => void;

  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Helpers
  refreshData: () => void;
  seedSampleData: () => void;
}

const TimelabContext = createContext<TimelabContextType | null>(null);

export function useTimelab(): TimelabContextType {
  const ctx = useContext(TimelabContext);
  if (!ctx) throw new Error('useTimelab must be used within TimelabProvider');
  return ctx;
}

export function TimelabProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const midnightRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAll = useCallback(() => {
    setSubjects(storage.getSubjects());
    setSessions(storage.getSessions());
    setGoals(storage.getGoals());
    const loadedSettings = storage.getSettings();
    setSettings(loadedSettings);
    setActiveTimer(storage.getActiveTimer());

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', loadedSettings.theme === 'dark');
      document.documentElement.classList.toggle('light', loadedSettings.theme === 'light');
    }
  }, []);

  // Initialize from storage on mount
  useEffect(() => {
    storage.initializeStorage();
    loadAll();
    setIsReady(true);
  }, [loadAll]);

  // Synchronize HTML theme class when settings change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
      document.documentElement.classList.toggle('light', settings.theme === 'light');
    }
  }, [settings.theme]);

  // Midnight handler: split active session at midnight
  useEffect(() => {
    function scheduleMidnight() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 50); // shortly after midnight
      const ms = tomorrow.getTime() - now.getTime();
      midnightRef.current = setTimeout(() => {
        handleMidnight();
        scheduleMidnight();
      }, ms);
    }

    function handleMidnight() {
      const timer = storage.getActiveTimer();
      if (timer && !timer.isPaused) {
        const midnight = startOfDay(new Date()).getTime();
        const elapsed = midnight - timer.startTimestamp + timer.accumulatedMs;
        if (elapsed > 1000) {
          const session: Session = {
            id: generateId(),
            subjectId: timer.subjectId,
            startTimestamp: timer.startTimestamp - timer.accumulatedMs,
            endTimestamp: midnight,
            durationSeconds: Math.floor(elapsed / 1000),
            description: 'Automated midnight segment split',
            isManual: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          storage.addSession(session);
        }

        const newTimer: ActiveTimerState = {
          subjectId: timer.subjectId,
          startTimestamp: midnight,
          accumulatedMs: 0,
          isPaused: false,
          pausedAt: null,
        };
        storage.saveActiveTimer(newTimer);
        loadAll();
      }
    }

    scheduleMidnight();
    return () => {
      if (midnightRef.current) clearTimeout(midnightRef.current);
    };
  }, [loadAll]);

  // Timer calculations
  const getElapsedSeconds = useCallback((): number => {
    const timer = activeTimer || storage.getActiveTimer();
    if (!timer) return 0;
    if (timer.isPaused) return Math.floor(timer.accumulatedMs / 1000);
    return Math.floor((timer.accumulatedMs + (Date.now() - timer.startTimestamp)) / 1000);
  }, [activeTimer]);

  const finishCurrentTimer = useCallback((timer: ActiveTimerState) => {
    const now = Date.now();
    const totalMs = timer.isPaused
      ? timer.accumulatedMs
      : timer.accumulatedMs + (now - timer.startTimestamp);

    if (totalMs >= 1000) {
      const sessionStart = now - totalMs;
      const session: Session = {
        id: generateId(),
        subjectId: timer.subjectId,
        startTimestamp: sessionStart,
        endTimestamp: now,
        durationSeconds: Math.floor(totalMs / 1000),
        description: '',
        isManual: false,
        createdAt: now,
        updatedAt: now,
      };
      storage.addSession(session);
      setSessions(storage.getSessions());
    }
    storage.saveActiveTimer(null);
    setActiveTimer(null);
  }, []);

  const startTimer = useCallback((subjectId: string) => {
    const current = storage.getActiveTimer();
    // Rule: only one timer runs at a time. If another is active, stop it first
    if (current && current.subjectId !== subjectId) {
      finishCurrentTimer(current);
    }

    // If resuming the same paused subject
    if (current && current.subjectId === subjectId && current.isPaused) {
      const resumed: ActiveTimerState = {
        ...current,
        startTimestamp: Date.now(),
        isPaused: false,
        pausedAt: null,
      };
      storage.saveActiveTimer(resumed);
      setActiveTimer(resumed);
      return;
    }

    // New active timer
    const newTimer: ActiveTimerState = {
      subjectId,
      startTimestamp: Date.now(),
      accumulatedMs: 0,
      isPaused: false,
      pausedAt: null,
    };
    storage.saveActiveTimer(newTimer);
    setActiveTimer(newTimer);
  }, [finishCurrentTimer]);

  const pauseTimer = useCallback(() => {
    const timer = storage.getActiveTimer();
    if (!timer || timer.isPaused) return;
    const now = Date.now();
    const paused: ActiveTimerState = {
      ...timer,
      accumulatedMs: timer.accumulatedMs + (now - timer.startTimestamp),
      isPaused: true,
      pausedAt: now,
    };
    storage.saveActiveTimer(paused);
    setActiveTimer(paused);
  }, []);

  const resumeTimer = useCallback(() => {
    const timer = storage.getActiveTimer();
    if (!timer || !timer.isPaused) return;
    const resumed: ActiveTimerState = {
      ...timer,
      startTimestamp: Date.now(),
      isPaused: false,
      pausedAt: null,
    };
    storage.saveActiveTimer(resumed);
    setActiveTimer(resumed);
  }, []);

  const stopTimer = useCallback(() => {
    const timer = storage.getActiveTimer();
    if (!timer) return;
    finishCurrentTimer(timer);
  }, [finishCurrentTimer]);

  // Subject actions
  const addSubjectAction = useCallback((name: string, color: string, icon: string) => {
    const currentSubjects = storage.getSubjects();
    const s: Subject = {
      id: generateId(),
      name,
      color,
      icon,
      createdAt: Date.now(),
      archivedAt: null,
      isActive: true,
      sortOrder: currentSubjects.length,
    };
    storage.addSubject(s);
    setSubjects(storage.getSubjects());
  }, []);

  const updateSubjectAction = useCallback((id: string, updates: Partial<Subject>) => {
    storage.updateSubject(id, updates);
    setSubjects(storage.getSubjects());
  }, []);

  const archiveSubject = useCallback((id: string) => {
    storage.updateSubject(id, { archivedAt: Date.now(), isActive: false });
    setSubjects(storage.getSubjects());
  }, []);

  const restoreSubject = useCallback((id: string) => {
    storage.updateSubject(id, { archivedAt: null, isActive: true });
    setSubjects(storage.getSubjects());
  }, []);

  const deleteSubjectAction = useCallback((id: string) => {
    storage.deleteSubject(id);
    setSubjects(storage.getSubjects());
  }, []);

  // Session actions
  const addManualSession = useCallback((
    subjectId: string, start: number, end: number, description?: string
  ): string | null => {
    const session: Partial<Session> = { subjectId, startTimestamp: start, endTimestamp: end };
    const error = validateSession(session);
    if (error) return error;

    const overlaps = findOverlaps(storage.getSessions(), start, end);
    if (overlaps.length > 0) return 'This time range overlaps with an existing session.';

    const s: Session = {
      id: generateId(),
      subjectId,
      startTimestamp: start,
      endTimestamp: end,
      durationSeconds: Math.floor((end - start) / 1000),
      description: description || '',
      isManual: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    storage.addSession(s);
    setSessions(storage.getSessions());
    return null;
  }, []);

  const updateSessionAction = useCallback((id: string, updates: Partial<Session>) => {
    storage.updateSession(id, updates);
    setSessions(storage.getSessions());
  }, []);

  const deleteSessionAction = useCallback((id: string) => {
    storage.deleteSession(id);
    setSessions(storage.getSessions());
  }, []);

  // Goal actions
  const setGoal = useCallback((subjectId: string, period: 'daily' | 'weekly' | 'monthly', targetSeconds: number) => {
    const goal: Goal = {
      id: generateId(),
      subjectId,
      period,
      targetSeconds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    storage.addGoal(goal);
    setGoals(storage.getGoals());
  }, []);

  const deleteGoalAction = useCallback((id: string) => {
    storage.deleteGoal(id);
    setGoals(storage.getGoals());
  }, []);

  // Settings
  const updateSettingsAction = useCallback((updates: Partial<AppSettings>) => {
    const current = storage.getSettings();
    const updated = { ...current, ...updates };
    storage.saveSettings(updated);
    setSettings(updated);
  }, []);

  // Seed sample data for testing and immediate rich analytics
  const seedSampleData = useCallback(() => {
    const currentSubs = storage.getSubjects();
    if (currentSubs.length === 0) return;

    const sampleSessions: Session[] = [];
    const now = Date.now();
    const oneDay = 24 * 3600 * 1000;

    // Generate sessions for the last 30 days
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const dayBase = new Date(now - dayOffset * oneDay);
      dayBase.setHours(9, 0, 0, 0);

      // 2 to 4 sessions per day
      const sessionCount = 2 + (dayOffset % 3);
      let currentHour = 9;

      for (let sIdx = 0; sIdx < sessionCount; sIdx++) {
        const sub = currentSubs[(dayOffset + sIdx) % currentSubs.length];
        const durationMins = 30 + ((dayOffset * 17 + sIdx * 23) % 90); // 30 to 120 mins
        const start = new Date(dayBase);
        start.setHours(currentHour, 0, 0, 0);
        const end = new Date(start.getTime() + durationMins * 60 * 1000);

        sampleSessions.push({
          id: generateId() + `-sample-${dayOffset}-${sIdx}`,
          subjectId: sub.id,
          startTimestamp: start.getTime(),
          endTimestamp: end.getTime(),
          durationSeconds: durationMins * 60,
          description: `Focused study on ${sub.name}`,
          isManual: false,
          createdAt: start.getTime(),
          updatedAt: start.getTime(),
        });

        currentHour += Math.floor(durationMins / 60) + 1;
      }
    }

    // Set sample goals for subjects
    const defaultGoals: Goal[] = [
      { id: generateId(), subjectId: currentSubs[0]?.id || '', period: 'weekly' as const, targetSeconds: 12 * 3600, createdAt: now, updatedAt: now },
      { id: generateId(), subjectId: currentSubs[1]?.id || '', period: 'weekly' as const, targetSeconds: 10 * 3600, createdAt: now, updatedAt: now },
      { id: generateId(), subjectId: currentSubs[3]?.id || '', period: 'weekly' as const, targetSeconds: 8 * 3600, createdAt: now, updatedAt: now },
      { id: generateId(), subjectId: currentSubs[4]?.id || '', period: 'weekly' as const, targetSeconds: 6 * 3600, createdAt: now, updatedAt: now },
      { id: generateId(), subjectId: currentSubs[0]?.id || '', period: 'daily' as const, targetSeconds: 2 * 3600, createdAt: now, updatedAt: now },
      { id: generateId(), subjectId: currentSubs[1]?.id || '', period: 'daily' as const, targetSeconds: 2 * 3600, createdAt: now, updatedAt: now },
    ].filter(g => Boolean(g.subjectId));

    storage.saveSessions(sampleSessions);
    storage.saveGoals(defaultGoals);
    loadAll();
  }, [loadAll]);

  return (
    <TimelabContext.Provider
      value={{
        subjects,
        sessions,
        goals,
        settings,
        activeTimer,
        isReady,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        getElapsedSeconds,
        addSubject: addSubjectAction,
        updateSubject: updateSubjectAction,
        archiveSubject,
        restoreSubject,
        deleteSubject: deleteSubjectAction,
        addManualSession,
        updateSession: updateSessionAction,
        deleteSession: deleteSessionAction,
        setGoal,
        deleteGoal: deleteGoalAction,
        updateSettings: updateSettingsAction,
        refreshData: loadAll,
        seedSampleData,
      }}
    >
      {children}
    </TimelabContext.Provider>
  );
}
