'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  TrendingUp,
  BarChart2,
  Sparkles,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useTimelab } from '@/contexts/TimeLabContext';
import {
  totalSecondsInRange,
  secondsBySubjectInRange,
  sessionCountBySubject,
  computePeriodStats,
  weeklyDailyTotals,
  totalSecondsForDate,
} from '@/lib/analytics';
import {
  startOfWeek,
  endOfWeek,
  addDays,
  weekLabel,
  weekDayNames,
  dateKey,
  isSameDay,
} from '@/lib/date-utils';
import {
  formatDuration,
  formatDurationHours,
  formatDurationShort,
} from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import TimeDistributionDonut from '@/components/charts/TimeDistributionDonut';
import DailyBarChart from '@/components/charts/DailyBarChart';
import SubjectComparisonChart from '@/components/charts/SubjectComparisonChart';
import Icon from '@/components/ui/Icon';

export default function WeeklyAnalyticsPage() {
  const { subjects, sessions, goals, settings } = useTimelab();
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());

  const weekStart = startOfWeek(currentWeekDate, settings.weekStart);
  const weekEnd = endOfWeek(currentWeekDate, settings.weekStart);

  // Previous week for comparison
  const prevWeekDate = addDays(currentWeekDate, -7);
  const prevWeekStart = startOfWeek(prevWeekDate, settings.weekStart);
  const prevWeekEnd = endOfWeek(prevWeekDate, settings.weekStart);

  // Statistics
  const currentStats = computePeriodStats(sessions, weekStart, weekEnd);
  const prevStats = computePeriodStats(sessions, prevWeekStart, prevWeekEnd);

  const prevWeekBreakdown = secondsBySubjectInRange(sessions, prevWeekStart, prevWeekEnd);
  const sessionCounts = sessionCountBySubject(sessions, weekStart, weekEnd);

  // Difference vs last week
  const diffHours =
    (currentStats.totalSeconds - prevStats.totalSeconds) / 3600;
  const pctChange =
    prevStats.totalSeconds > 0
      ? Math.round(
          ((currentStats.totalSeconds - prevStats.totalSeconds) /
            prevStats.totalSeconds) *
            100
        )
      : null;

  // Daily totals for 7 days
  const dayNames = weekDayNames(settings.weekStart);
  const dailyBars = [];
  let mostActiveDayName = '';
  let maxDaySecs = 0;
  const inactiveDays: string[] = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const secs = totalSecondsForDate(sessions, day);
    const hours = secs / 3600;
    const isToday = isSameDay(day, new Date());
    const dayLabel = dayNames[i];

    if (secs > maxDaySecs) {
      maxDaySecs = secs;
      mostActiveDayName = day.toLocaleDateString('en-US', { weekday: 'long' });
    }
    if (secs < 60) {
      inactiveDays.push(day.toLocaleDateString('en-US', { weekday: 'long' }));
    }

    dailyBars.push({
      dayLabel,
      fullDate: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      seconds: secs,
      hours,
      isToday,
    });
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Subject distribution
  const distributionData = Object.entries(currentStats.subjectBreakdown)
    .filter(([_, secs]) => secs > 0)
    .map(([subjectId, secs]) => {
      const sub = subjectMap.get(subjectId);
      const percentage =
        currentStats.totalSeconds > 0
          ? Math.round((secs / currentStats.totalSeconds) * 100)
          : 0;
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

  // Subject-wise weekly analysis table rows
  const subjectRows = subjects
    .filter((s) => s.isActive || (currentStats.subjectBreakdown[s.id] || 0) > 0)
    .map((sub) => {
      const curSecs = currentStats.subjectBreakdown[sub.id] || 0;
      const prevSecs = prevWeekBreakdown[sub.id] || 0;
      const count = sessionCounts[sub.id] || 0;
      const avgSecs = count > 0 ? curSecs / count : 0;
      const percentage =
        currentStats.totalSeconds > 0
          ? Math.round((curSecs / currentStats.totalSeconds) * 100)
          : 0;

      const weeklyGoal = goals.find(
        (g) => g.subjectId === sub.id && g.period === 'weekly'
      );
      const targetSecs = weeklyGoal?.targetSeconds || 0;
      const targetPct =
        targetSecs > 0 ? Math.min(100, Math.round((curSecs / targetSecs) * 100)) : null;

      const subDiffHours = (curSecs - prevSecs) / 3600;

      return {
        subject: sub,
        currentSeconds: curSecs,
        previousSeconds: prevSecs,
        sessionCount: count,
        avgSeconds: avgSecs,
        percentage,
        targetSeconds: targetSecs,
        targetPercentage: targetPct,
        diffHours: subDiffHours,
      };
    })
    .sort((a, b) => b.currentSeconds - a.currentSeconds);

  // Rule-based insights generation
  const insights: string[] = [];
  if (currentStats.totalSeconds > 0) {
    if (distributionData[0]) {
      insights.push(
        `${distributionData[0].name} received ${distributionData[0].percentage}% of total tracked time this week.`
      );
    }
    if (mostActiveDayName) {
      insights.push(
        `${mostActiveDayName} was your most productive day with ${formatDurationShort(maxDaySecs)} recorded.`
      );
    }
    if (inactiveDays.length > 0 && inactiveDays.length < 7) {
      insights.push(
        `No study activity was logged on ${inactiveDays.slice(0, 2).join(' and ')}.`
      );
    }
    if (pctChange !== null) {
      insights.push(
        pctChange >= 0
          ? `Overall study volume is up ${pctChange}% (+${diffHours.toFixed(1)}h) compared with last week.`
          : `Overall study volume is down ${Math.abs(pctChange)}% (${diffHours.toFixed(1)}h) compared with last week.`
      );
    }
    // Check goal completions
    const completedGoals = subjectRows.filter(
      (r) => r.targetPercentage !== null && r.targetPercentage >= 100
    );
    if (completedGoals.length > 0) {
      insights.push(
        `Target achieved for ${completedGoals.map((g) => g.subject.name).join(', ')}!`
      );
    }
  }

  const handlePrevWeek = () => setCurrentWeekDate(addDays(currentWeekDate, -7));
  const handleNextWeek = () => setCurrentWeekDate(addDays(currentWeekDate, 7));
  const handleThisWeek = () => setCurrentWeekDate(new Date());

  const isCurrentWeek =
    startOfWeek(currentWeekDate, settings.weekStart).getTime() ===
    startOfWeek(new Date(), settings.weekStart).getTime();

  return (
    <div className="space-y-6">
      {/* ─── NAVIGATION HEADER ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Weekly Analytics</h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Comprehensive 7-day productivity review, subject targets, and week-over-week trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-gray-400 hover:text-white transition"
            title="Previous Week"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-semibold text-white">
            {weekLabel(currentWeekDate, settings.weekStart)}
          </div>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-gray-400 hover:text-white transition"
            title="Next Week"
          >
            <ChevronRight size={16} />
          </button>

          {!isCurrentWeek && (
            <button
              onClick={handleThisWeek}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
            >
              This Week
            </button>
          )}
        </div>
      </div>

      {/* ─── 4 MAIN WEEKLY STAT CARDS ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Weekly Tracked Hours"
          value={formatDuration(currentStats.totalSeconds)}
          subtitle={
            pctChange !== null
              ? `${pctChange >= 0 ? '+' : ''}${pctChange}% vs last week`
              : 'First tracking week'
          }
          icon={Clock}
          badge={
            pctChange !== null
              ? `${pctChange >= 0 ? '+' : ''}${diffHours.toFixed(1)}h`
              : undefined
          }
          trend={pctChange !== null ? (pctChange >= 0 ? 'up' : 'down') : 'neutral'}
        />
        <StatCard
          title="Daily Average"
          value={formatDurationShort(currentStats.totalSeconds / 7)}
          subtitle={`${currentStats.activeDays} of 7 active days`}
          icon={CalendarDays}
        />
        <StatCard
          title="Top Studied Subject"
          value={
            currentStats.mostStudiedSubjectId
              ? subjectMap.get(currentStats.mostStudiedSubjectId)?.name || 'N/A'
              : 'None'
          }
          subtitle={
            currentStats.mostStudiedSubjectId &&
            currentStats.subjectBreakdown[currentStats.mostStudiedSubjectId]
              ? formatDurationShort(
                  currentStats.subjectBreakdown[currentStats.mostStudiedSubjectId]
                )
              : 'N/A'
          }
          icon={TrendingUp}
        />
        <StatCard
          title="Total Sessions"
          value={`${currentStats.sessionCount}`}
          subtitle={`Avg: ${formatDurationShort(currentStats.avgSessionSeconds)} / session`}
          icon={BarChart2}
        />
      </div>

      {/* ─── RULE-BASED WEEKLY INSIGHTS BANNER ──────────────────── */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
            <Sparkles size={15} />
            <span>Weekly Intelligence & Insights</span>
          </div>
          <ul className="space-y-1.5 text-xs text-gray-300">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── CHARTS: 7-DAY BARS & DISTRIBUTION DONUT ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Study Hours Bar Chart */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Daily Study Hours (7 Days)
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Hours tracked per day throughout this week
              </p>
            </div>
          </div>
          <DailyBarChart data={dailyBars} height={220} />
        </div>

        {/* Distribution Donut */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Subject Distribution
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Proportion of study time allocated across subjects
              </p>
            </div>
          </div>
          <TimeDistributionDonut
            data={distributionData}
            totalSeconds={currentStats.totalSeconds}
          />
        </div>
      </div>

      {/* ─── SUBJECT-WISE WEEKLY ANALYSIS TABLE ─────────────────── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Subject-Wise Performance Table
            </h3>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Detailed tracking metrics, weekly targets, and trends vs previous week
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[10px] uppercase font-bold tracking-wider text-[var(--foreground-muted)]">
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Total Time</th>
                <th className="py-3 px-3">Share</th>
                <th className="py-3 px-3">Sessions</th>
                <th className="py-3 px-3">Avg Length</th>
                <th className="py-3 px-3">Weekly Target</th>
                <th className="py-3 px-3">Target %</th>
                <th className="py-3 px-3 text-right">vs Last Week</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {subjectRows.map((row) => (
                <tr
                  key={row.subject.id}
                  className="hover:bg-[var(--surface-hover)] transition"
                >
                  {/* Subject Name & Icon */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg border font-bold"
                        style={{
                          backgroundColor: `${row.subject.color}15`,
                          borderColor: `${row.subject.color}40`,
                          color: row.subject.color,
                        }}
                      >
                        <Icon name={row.subject.icon} size={14} />
                      </div>
                      <span className="font-semibold text-white">{row.subject.name}</span>
                    </div>
                  </td>

                  {/* Total Time */}
                  <td className="py-3 px-3 font-mono font-semibold text-white">
                    {formatDurationShort(row.currentSeconds)}
                  </td>

                  {/* Share % */}
                  <td className="py-3 px-3 font-mono text-emerald-400">
                    {row.percentage}%
                  </td>

                  {/* Sessions count */}
                  <td className="py-3 px-3 font-mono text-gray-300">
                    {row.sessionCount}
                  </td>

                  {/* Avg length */}
                  <td className="py-3 px-3 font-mono text-gray-400">
                    {formatDurationShort(row.avgSeconds)}
                  </td>

                  {/* Weekly Target */}
                  <td className="py-3 px-3 font-mono text-gray-300">
                    {row.targetSeconds > 0
                      ? formatDurationShort(row.targetSeconds)
                      : '—'}
                  </td>

                  {/* Target Completion Progress */}
                  <td className="py-3 px-3">
                    {row.targetPercentage !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${row.targetPercentage}%`,
                              backgroundColor:
                                row.targetPercentage >= 100
                                  ? '#10b981'
                                  : row.subject.color,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-gray-300">
                          {row.targetPercentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>

                  {/* vs Last Week */}
                  <td className="py-3 px-3 text-right font-mono">
                    {row.diffHours !== 0 ? (
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          row.diffHours > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {row.diffHours > 0 ? (
                          <ArrowUpRight size={13} />
                        ) : (
                          <ArrowDownRight size={13} />
                        )}
                        {row.diffHours > 0 ? '+' : ''}
                        {row.diffHours.toFixed(1)}h
                      </span>
                    ) : (
                      <span className="text-gray-500">0.0h</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
