'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Plus, CheckCircle2 } from 'lucide-react';
import type { Subject, Goal } from '@/types';
import { useTimelab } from '@/contexts/TimeLabContext';
import { formatDuration, formatDurationShort } from '@/lib/utils';
import { totalSecondsForDate, totalSecondsInRange } from '@/lib/analytics';
import { startOfWeek, endOfWeek } from '@/lib/date-utils';
import Icon from '@/components/ui/Icon';

interface TimerCardProps {
  subject: Subject;
  onEdit?: (subject: Subject) => void;
}

export default function TimerCard({ subject, onEdit }: TimerCardProps) {
  const {
    sessions,
    goals,
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getElapsedSeconds,
    settings,
  } = useTimelab();

  const isCurrentActive = activeTimer?.subjectId === subject.id;
  const isPaused = isCurrentActive && activeTimer?.isPaused;
  const isRunning = isCurrentActive && !activeTimer?.isPaused;

  const [liveElapsed, setLiveElapsed] = useState(0);

  useEffect(() => {
    if (!isCurrentActive) {
      setLiveElapsed(0);
      return;
    }
    setLiveElapsed(getElapsedSeconds());
    const interval = setInterval(() => {
      setLiveElapsed(getElapsedSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, [isCurrentActive, getElapsedSeconds]);

  // Today's total for this subject (already saved sessions + live session if active)
  const todaySavedSecs = totalSecondsForDate(
    sessions.filter((s) => s.subjectId === subject.id),
    new Date()
  );
  const todayTotalSecs = todaySavedSecs + (isCurrentActive ? liveElapsed : 0);

  // Weekly total for this subject
  const weekStart = startOfWeek(new Date(), settings.weekStart);
  const weekEnd = endOfWeek(new Date(), settings.weekStart);
  const weekSavedSecs = totalSecondsInRange(
    sessions.filter((s) => s.subjectId === subject.id),
    weekStart,
    weekEnd
  );
  const weekTotalSecs = weekSavedSecs + (isCurrentActive ? liveElapsed : 0);

  // Subject goals
  const dailyGoal = goals.find((g) => g.subjectId === subject.id && g.period === 'daily');
  const weeklyGoal = goals.find((g) => g.subjectId === subject.id && g.period === 'weekly');

  const dailyProgress = dailyGoal ? Math.min(100, Math.round((todayTotalSecs / dailyGoal.targetSeconds) * 100)) : null;
  const weeklyProgress = weeklyGoal ? Math.min(100, Math.round((weekTotalSecs / weeklyGoal.targetSeconds) * 100)) : null;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 ${
        isRunning
          ? 'bg-[#121622] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
          : isPaused
          ? 'bg-[#14161f] border-amber-500/40'
          : 'bg-[var(--surface-card)] border-[var(--border-subtle)] hover:border-gray-700 hover:bg-[var(--surface-hover)]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border font-bold"
            style={{
              backgroundColor: `${subject.color}15`,
              borderColor: `${subject.color}40`,
              color: subject.color,
            }}
          >
            <Icon name={subject.icon} size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white tracking-tight flex items-center gap-2">
              {subject.name}
              {onEdit && (
                <button
                  onClick={() => onEdit(subject)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition"
                  title="Edit Subject"
                >
                  ✎
                </button>
              )}
            </h3>
            <div className="text-xs text-[var(--foreground-muted)] flex items-center gap-1.5 mt-0.5">
              <span>Today:</span>
              <span className="font-mono font-medium text-gray-200">
                {formatDurationShort(todayTotalSecs)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {isRunning && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
        {isPaused && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
            Paused
          </span>
        )}
      </div>

      {/* Main Timer Display */}
      <div className="my-2 py-3 px-4 rounded-lg bg-black/40 border border-black/60 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--foreground-muted)]">
            {isCurrentActive ? 'Current Session' : 'Today Total'}
          </span>
          <span className="font-mono text-2xl font-bold tracking-tight text-white mt-0.5">
            {isCurrentActive ? formatDuration(liveElapsed) : formatDuration(todayTotalSecs)}
          </span>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2">
          {!isCurrentActive && (
            <button
              onClick={() => startTimer(subject.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition shadow-sm"
              title="Start Timer"
            >
              <Play size={14} fill="currentColor" />
              <span>Start</span>
            </button>
          )}

          {isRunning && (
            <>
              <button
                onClick={pauseTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs transition"
                title="Pause Timer"
              >
                <Pause size={14} />
                <span>Pause</span>
              </button>
              <button
                onClick={stopTimer}
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-semibold text-xs transition"
                title="Stop & Save"
              >
                <Square size={14} fill="currentColor" />
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                onClick={resumeTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition"
                title="Resume Timer"
              >
                <Play size={14} fill="currentColor" />
                <span>Resume</span>
              </button>
              <button
                onClick={stopTimer}
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-semibold text-xs transition"
                title="Stop & Save"
              >
                <Square size={14} fill="currentColor" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bars for Goals */}
      <div className="mt-3 space-y-2 text-xs">
        {/* Daily Goal */}
        {dailyGoal && (
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-[var(--foreground-muted)]">Daily Goal</span>
              <span className="font-mono text-gray-300">
                {formatDurationShort(todayTotalSecs)} / {formatDurationShort(dailyGoal.targetSeconds)} ({dailyProgress}%)
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${dailyProgress}%`,
                  backgroundColor: (dailyProgress || 0) >= 100 ? '#10b981' : subject.color,
                }}
              />
            </div>
          </div>
        )}

        {/* Weekly Goal */}
        {weeklyGoal && (
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-[var(--foreground-muted)]">Weekly Goal</span>
              <span className="font-mono text-gray-300">
                {formatDurationShort(weekTotalSecs)} / {formatDurationShort(weeklyGoal.targetSeconds)} ({weeklyProgress}%)
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${weeklyProgress}%`,
                  backgroundColor: (weeklyProgress || 0) >= 100 ? '#10b981' : subject.color,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
