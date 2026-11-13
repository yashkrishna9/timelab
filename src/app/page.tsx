'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar as CalendarIcon,
  Plus,
  Play,
  Pause,
  Square,
  TrendingUp,
  BarChart2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { useTimelab } from '@/contexts/TimeLabContext';
import {
  formatDuration,
  formatDurationHours,
  formatDurationShort,
  formatTime,
  getGreeting,
} from '@/lib/utils';
import {
  totalSecondsForDate,
  totalSecondsInRange,
  secondsBySubjectInRange,
  hourlyActivity,
  computePeriodStats,
} from '@/lib/analytics';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from '@/lib/date-utils';
import StatCard from '@/components/dashboard/StatCard';
import TimerCard from '@/components/timers/TimerCard';
import TimeDistributionDonut from '@/components/charts/TimeDistributionDonut';
import HourlyActivityChart from '@/components/charts/HourlyActivityChart';
import RecentSessionsList from '@/components/dashboard/RecentSessionsList';
import ManualSessionModal from '@/components/timers/ManualSessionModal';
import SubjectModal from '@/components/timers/SubjectModal';
import Icon from '@/components/ui/Icon';

export default function OverviewPage() {
  const {
    subjects,
    sessions,
    activeTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getElapsedSeconds,
    settings,
  } = useTimelab();

  const [clockTime, setClockTime] = useState(Date.now());
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(Date.now());
      if (activeTimer) {
        setLiveElapsed(getElapsedSeconds());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTimer, getElapsedSeconds]);

  const now = new Date(clockTime);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const weekStart = startOfWeek(now, settings.weekStart);
  const weekEnd = endOfWeek(now, settings.weekStart);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Stats calculation
  const todaySaved = totalSecondsForDate(sessions, now);
  const todayTotal = todaySaved + (activeTimer ? liveElapsed : 0);

  const weekSaved = totalSecondsInRange(sessions, weekStart, weekEnd);
  const weekTotal = weekSaved + (activeTimer ? liveElapsed : 0);

  const monthSaved = totalSecondsInRange(sessions, monthStart, monthEnd);
  const monthTotal = monthSaved + (activeTimer ? liveElapsed : 0);

  // Subjects studied today
  const todayBreakdown = secondsBySubjectInRange(sessions, todayStart, todayEnd);
  if (activeTimer) {
    todayBreakdown[activeTimer.subjectId] =
      (todayBreakdown[activeTimer.subjectId] || 0) + liveElapsed;
  }
  const subjectsStudiedTodayCount = Object.keys(todayBreakdown).filter(
    (id) => (todayBreakdown[id] || 0) > 30
  ).length;

  // Active subject info
  const activeSubject = activeTimer
    ? subjects.find((s) => s.id === activeTimer.subjectId)
    : null;

  // Today distribution for Donut
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const distributionData = Object.entries(todayBreakdown)
    .filter(([_, secs]) => secs > 0)
    .map(([subjectId, secs]) => {
      const sub = subjectMap.get(subjectId);
      const percentage =
        todayTotal > 0 ? Math.round((secs / todayTotal) * 100) : 0;
      return {
        subjectId,
        name: sub?.name || 'Unknown',
        color: sub?.color || '#10b981',
        seconds: secs,
        percentage,
      };
    })
    .sort((a, b) => b.seconds - a.seconds);

  // Hourly activity
  const hourlySecs = hourlyActivity(sessions, now);
  if (activeTimer && !activeTimer.isPaused) {
    const curHour = now.getHours();
    hourlySecs[curHour] += liveElapsed;
  }

  // Daily summary stats
  const todayStats = computePeriodStats(sessions, todayStart, todayEnd);
  const mostStudiedSub = todayStats.mostStudiedSubjectId
    ? subjectMap.get(todayStats.mostStudiedSubjectId)?.name
    : 'None';

  return (
    <div className="space-y-8">
      {/* ─── TOP SECTION: GREETING, CLOCK, ACTIVE BANNER ────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            TimeLab Intelligence Dashboard
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {getGreeting()}, Yash
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            {new Date(clockTime).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Big Digital Clock & Quick Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col items-end px-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--foreground-muted)]">
              Local Time
            </span>
            <span className="font-mono text-2xl font-bold text-white tracking-wider">
              {formatTime(clockTime, settings.timeFormat)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setManualModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-white transition"
            >
              <Clock size={14} className="text-emerald-400" />
              <span>Log Manual Time</span>
            </button>
            <button
              onClick={() => setSubjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition"
            >
              <Plus size={14} />
              <span>New Subject</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── CURRENT ACTIVE TASK HERO BANNER ──────────────────────── */}
      {activeTimer && activeSubject && (
        <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-black/40 p-6 shadow-xl shadow-emerald-950/30 animate-timer-glow">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border font-bold shadow-lg"
                style={{
                  backgroundColor: `${activeSubject.color}25`,
                  borderColor: `${activeSubject.color}60`,
                  color: activeSubject.color,
                }}
              >
                <Icon name={activeSubject.icon} size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    {activeTimer.isPaused ? 'Session Paused' : 'Currently Recording Focus Time'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-0.5 tracking-tight">
                  {activeSubject.name}
                </h2>
              </div>
            </div>

            {/* Large live counter + Action buttons */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80">
                  Elapsed Time
                </span>
                <div className="font-mono text-3xl font-extrabold tracking-tight text-white">
                  {formatDuration(liveElapsed)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeTimer.isPaused ? (
                  <button
                    onClick={resumeTimer}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition shadow-lg shadow-emerald-500/20"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-sm transition"
                  >
                    <Pause size={16} />
                    <span>Pause</span>
                  </button>
                )}
                <button
                  onClick={stopTimer}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-bold text-sm transition"
                  title="Save and End Session"
                >
                  <Square size={16} fill="currentColor" />
                  <span>Stop & Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4 MAIN STATISTIC CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tracked Today"
          value={formatDuration(todayTotal)}
          subtitle={`${todayStats.sessionCount} session${todayStats.sessionCount === 1 ? '' : 's'} recorded`}
          icon={Clock}
          badge="Today"
        />
        <StatCard
          title="Tracked This Week"
          value={formatDuration(weekTotal)}
          subtitle="Mon – Sun total"
          icon={CalendarDays}
          badge="Week"
          trend="up"
        />
        <StatCard
          title="Tracked This Month"
          value={formatDuration(monthTotal)}
          subtitle={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          icon={TrendingUp}
          badge="Month"
        />
        <StatCard
          title="Subjects Studied Today"
          value={`${subjectsStudiedTodayCount}`}
          subtitle={`Out of ${subjects.filter((s) => s.isActive).length} active subjects`}
          icon={BarChart2}
        />
      </div>

      {/* ─── A. MY TIMERS (SUBJECT CARDS GRID) ───────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">My Timers</h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              One-click stopwatch for all active study subjects. Switch subjects seamlessly.
            </p>
          </div>
          <Link
            href="/timers"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
          >
            Manage All Subjects →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {subjects
            .filter((s) => s.isActive)
            .map((subject) => (
              <TimerCard key={subject.id} subject={subject} />
            ))}
        </div>
      </div>

      {/* ─── B & C: TODAY'S DISTRIBUTION & DAILY ACTIVITY ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* B. Today's Time Distribution */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Today&apos;s Time Distribution
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Percentage of total tracked time across subjects
              </p>
            </div>
            <Link
              href="/daily"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Full Daily Report →
            </Link>
          </div>
          <TimeDistributionDonut data={distributionData} totalSeconds={todayTotal} />
        </div>

        {/* C. Daily Activity Timeline */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Daily Activity Pattern
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Active study duration distribution across 24 hours
              </p>
            </div>
            <span className="text-[10px] font-mono text-gray-400">00:00 – 23:00</span>
          </div>
          <HourlyActivityChart hourlySeconds={hourlySecs} />

          {/* Daily Summary Stats Pill Strip */}
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-[var(--surface)]">
              <span className="text-[10px] text-[var(--foreground-muted)] block">Top Subject</span>
              <span className="font-semibold text-white truncate block">{mostStudiedSub}</span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--surface)]">
              <span className="text-[10px] text-[var(--foreground-muted)] block">Sessions</span>
              <span className="font-mono font-semibold text-emerald-400 block">
                {todayStats.sessionCount}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--surface)]">
              <span className="text-[10px] text-[var(--foreground-muted)] block">Avg Length</span>
              <span className="font-mono font-semibold text-gray-200 block">
                {formatDurationShort(todayStats.avgSessionSeconds)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── D. RECENT SESSIONS ──────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Recent Sessions</h3>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Latest tracked time entries with start, end, and duration details
            </p>
          </div>
          <button
            onClick={() => setManualModalOpen(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            + Add Session
          </button>
        </div>
        <RecentSessionsList sessions={sessions} limit={6} />
      </div>

      {/* Modals */}
      <ManualSessionModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
      />
      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
      />
    </div>
  );
}
