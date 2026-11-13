'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  BarChart2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useTimelab } from '@/contexts/TimeLabContext';
import {
  totalSecondsForDate,
  secondsBySubjectInRange,
  hourlyActivity,
  computePeriodStats,
  sessionsInRange,
} from '@/lib/analytics';
import { startOfDay, endOfDay, addDays, dateKey, parseKey } from '@/lib/date-utils';
import { formatDuration, formatDurationShort, formatDurationHours, formatDateFull } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import TimeDistributionDonut from '@/components/charts/TimeDistributionDonut';
import HourlyActivityChart from '@/components/charts/HourlyActivityChart';
import SubjectComparisonChart from '@/components/charts/SubjectComparisonChart';
import RecentSessionsList from '@/components/dashboard/RecentSessionsList';

export default function DailyReportPage() {
  const { subjects, sessions } = useTimelab();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const daySessions = sessionsInRange(sessions, dayStart, dayEnd);
  const totalSeconds = totalSecondsForDate(sessions, selectedDate);
  const stats = computePeriodStats(sessions, dayStart, dayEnd);
  const hourlySecs = hourlyActivity(sessions, selectedDate);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Subject distribution
  const distributionData = Object.entries(stats.subjectBreakdown)
    .filter(([_, secs]) => secs > 0)
    .map(([subjectId, secs]) => {
      const sub = subjectMap.get(subjectId);
      const percentage =
        totalSeconds > 0 ? Math.round((secs / totalSeconds) * 100) : 0;
      return {
        subjectId,
        name: sub?.name || 'Unknown',
        color: sub?.color || '#10b981',
        seconds: secs,
        hours: secs / 3600,
        percentage,
      };
    })
    .sort((a, b) => b.seconds - a.seconds);

  const mostStudiedSub = stats.mostStudiedSubjectId
    ? subjectMap.get(stats.mostStudiedSubjectId)?.name || 'Unknown'
    : 'None';

  const handlePrevDay = () => setSelectedDate(addDays(selectedDate, -1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const isToday =
    startOfDay(selectedDate).getTime() === startOfDay(new Date()).getTime();

  return (
    <div className="space-y-6">
      {/* ─── DATE NAVIGATION HEADER ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Daily Report</h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Detailed breakdown of tracked study time, sessions, and hourly distribution for any date.
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-gray-400 hover:text-white transition"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs">
            <CalendarIcon size={14} className="text-emerald-400" />
            <input
              type="date"
              value={dateKey(selectedDate)}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(parseKey(e.target.value));
              }}
              className="bg-transparent text-white font-medium focus:outline-none"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-gray-400 hover:text-white transition"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>

          {!isToday && (
            <button
              onClick={handleToday}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Selected Date Title Banner */}
      <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <span className="font-semibold text-white text-sm">
          {formatDateFull(selectedDate.getTime())}
        </span>
        {isToday && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[10px]">
            Today
          </span>
        )}
      </div>

      {/* ─── 4 DAILY SUMMARY STAT CARDS ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tracked"
          value={formatDuration(totalSeconds)}
          subtitle={totalSeconds > 0 ? `${(totalSeconds / 3600).toFixed(1)} productive hours` : 'No study logged'}
          icon={Clock}
          badge="Daily Total"
        />
        <StatCard
          title="Most Studied Subject"
          value={mostStudiedSub}
          subtitle={
            stats.mostStudiedSubjectId && stats.subjectBreakdown[stats.mostStudiedSubjectId]
              ? formatDurationShort(stats.subjectBreakdown[stats.mostStudiedSubjectId])
              : 'N/A'
          }
          icon={TrendingUp}
        />
        <StatCard
          title="Total Sessions"
          value={`${stats.sessionCount}`}
          subtitle={`Avg: ${formatDurationShort(stats.avgSessionSeconds)} / session`}
          icon={BarChart2}
        />
        <StatCard
          title="Longest Session"
          value={formatDuration(stats.longestSessionSeconds)}
          subtitle="Single continuous block"
          icon={Sparkles}
        />
      </div>

      {/* ─── CHARTS: DONUT & SUBJECT COMPARISON ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Distribution Donut */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <h3 className="text-sm font-bold text-white tracking-tight mb-1">
            Subject-Wise Time Distribution
          </h3>
          <p className="text-[11px] text-[var(--foreground-muted)] mb-4">
            Percentage breakdown of total tracked time
          </p>
          <TimeDistributionDonut data={distributionData} totalSeconds={totalSeconds} />
        </div>

        {/* Subject Comparison Bar Chart */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <h3 className="text-sm font-bold text-white tracking-tight mb-1">
            Subject Comparison (Hours)
          </h3>
          <p className="text-[11px] text-[var(--foreground-muted)] mb-4">
            Direct comparison of study hours per subject
          </p>
          <SubjectComparisonChart data={distributionData} />
        </div>
      </div>

      {/* ─── HOURLY TIMELINE ────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Hourly Activity</h3>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Activity distribution across each hour of the day (00:00 – 23:00)
            </p>
          </div>
          <span className="text-[10px] font-mono text-gray-400">24-Hour Timeline</span>
        </div>
        <HourlyActivityChart hourlySeconds={hourlySecs} />
      </div>

      {/* ─── SESSION TIMELINE & DETAILS ─────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Tracked Sessions for This Day ({daySessions.length})
            </h3>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Chronological log of study blocks
            </p>
          </div>
        </div>
        <RecentSessionsList sessions={daySessions} limit={50} />
      </div>
    </div>
  );
}
