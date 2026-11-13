'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  TrendingUp,
  BarChart2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useTimelab } from '@/contexts/TimeLabContext';
import {
  totalSecondsInRange,
  secondsBySubjectInRange,
  sessionCountBySubject,
  computePeriodStats,
  totalSecondsForDate,
} from '@/lib/analytics';
import {
  startOfMonth,
  endOfMonth,
  daysInMonth,
  monthLabel,
  addDays,
  isSameDay,
} from '@/lib/date-utils';
import {
  formatDuration,
  formatDurationShort,
  formatDurationHours,
} from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import TimeDistributionDonut from '@/components/charts/TimeDistributionDonut';
import DailyBarChart from '@/components/charts/DailyBarChart';
import SubjectComparisonChart from '@/components/charts/SubjectComparisonChart';
import Icon from '@/components/ui/Icon';

export default function MonthlyAnalyticsPage() {
  const { subjects, sessions, goals } = useTimelab();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Previous month for comparison
  const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const prevMonthStart = startOfMonth(prevMonthDate);
  const prevMonthEnd = endOfMonth(prevMonthDate);

  const currentStats = computePeriodStats(sessions, monthStart, monthEnd);
  const prevStats = computePeriodStats(sessions, prevMonthStart, prevMonthEnd);
  const prevBreakdown = secondsBySubjectInRange(sessions, prevMonthStart, prevMonthEnd);
  const sessionCounts = sessionCountBySubject(sessions, monthStart, monthEnd);

  // Difference vs last month
  const diffHours = (currentStats.totalSeconds - prevStats.totalSeconds) / 3600;
  const pctChange =
    prevStats.totalSeconds > 0
      ? Math.round(
          ((currentStats.totalSeconds - prevStats.totalSeconds) /
            prevStats.totalSeconds) *
            100
        )
      : null;

  // Daily hours for the entire month (1 to numDays)
  const numDays = daysInMonth(currentDate);
  const dailyBars = [];
  let bestDayName = '';
  let bestDayHours = 0;

  for (let d = 1; d <= numDays; d++) {
    const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
    const secs = totalSecondsForDate(sessions, day);
    const hours = secs / 3600;
    const isToday = isSameDay(day, new Date());

    if (hours > bestDayHours) {
      bestDayHours = hours;
      bestDayName = day.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }

    dailyBars.push({
      dayLabel: `${d}`,
      fullDate: day.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      seconds: secs,
      hours,
      isToday,
    });
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Distribution Data
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

  // Subject breakdown rows
  const subjectRows = subjects
    .filter((s) => s.isActive || (currentStats.subjectBreakdown[s.id] || 0) > 0)
    .map((sub) => {
      const curSecs = currentStats.subjectBreakdown[sub.id] || 0;
      const prevSecs = prevBreakdown[sub.id] || 0;
      const count = sessionCounts[sub.id] || 0;
      const avgSecs = count > 0 ? curSecs / count : 0;
      const percentage =
        currentStats.totalSeconds > 0
          ? Math.round((curSecs / currentStats.totalSeconds) * 100)
          : 0;

      const monthlyGoal = goals.find(
        (g) => g.subjectId === sub.id && g.period === 'monthly'
      );
      const targetSecs = monthlyGoal?.targetSeconds || 0;
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

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleThisMonth = () => setCurrentDate(new Date());

  const isCurrentMonth =
    currentDate.getFullYear() === new Date().getFullYear() &&
    currentDate.getMonth() === new Date().getMonth();

  return (
    <div className="space-y-6">
      {/* ─── NAVIGATION HEADER ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Monthly Analytics</h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Macro-level productivity analysis, subject allocation, and month-over-month trajectory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-gray-400 hover:text-white transition"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-semibold text-white">
            {monthLabel(currentDate)}
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-gray-400 hover:text-white transition"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={handleThisMonth}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
            >
              Current Month
            </button>
          )}
        </div>
      </div>

      {/* ─── 4 MAIN MONTHLY STAT CARDS ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Tracked Hours"
          value={formatDuration(currentStats.totalSeconds)}
          subtitle={
            pctChange !== null
              ? `${pctChange >= 0 ? '+' : ''}${pctChange}% vs last month`
              : 'First tracking month'
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
          value={formatDurationShort(currentStats.totalSeconds / numDays)}
          subtitle={`${currentStats.activeDays} of ${numDays} active days`}
          icon={Calendar}
        />
        <StatCard
          title="Best Study Day"
          value={bestDayName || 'None'}
          subtitle={bestDayHours > 0 ? `${bestDayHours.toFixed(1)} hours logged` : 'No study'}
          icon={Sparkles}
        />
        <StatCard
          title="Longest Session"
          value={formatDurationShort(currentStats.longestSessionSeconds)}
          subtitle={`${currentStats.sessionCount} total sessions logged`}
          icon={BarChart2}
        />
      </div>

      {/* ─── CHARTS: FULL MONTH BARS & SUBJECT DISTRIBUTION ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full Month Daily Bar Chart */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Daily Study Hours (All {numDays} Days)
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Daily hours throughout {monthLabel(currentDate)}
              </p>
            </div>
          </div>
          <DailyBarChart data={dailyBars} height={230} />
        </div>

        {/* Donut Chart */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Monthly Subject Allocation
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Percentage of monthly hours spent on each subject
              </p>
            </div>
          </div>
          <TimeDistributionDonut
            data={distributionData}
            totalSeconds={currentStats.totalSeconds}
          />
        </div>
      </div>

      {/* ─── SUBJECT COMPARISON BAR CHART ──────────────────────── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
        <h3 className="text-sm font-bold text-white tracking-tight mb-1">
          Subject Comparison (Monthly Hours)
        </h3>
        <p className="text-[11px] text-[var(--foreground-muted)] mb-4">
          Direct comparative view of study investments
        </p>
        <SubjectComparisonChart data={distributionData} />
      </div>

      {/* ─── SUBJECT BREAKDOWN TABLE ───────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Monthly Subject Performance
            </h3>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Full breakdown with session averages, goals, and month-over-month differences
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
                <th className="py-3 px-3">Avg Session</th>
                <th className="py-3 px-3">Monthly Goal</th>
                <th className="py-3 px-3">Goal %</th>
                <th className="py-3 px-3 text-right">vs Last Month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {subjectRows.map((row) => (
                <tr
                  key={row.subject.id}
                  className="hover:bg-[var(--surface-hover)] transition"
                >
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

                  <td className="py-3 px-3 font-mono font-semibold text-white">
                    {formatDurationShort(row.currentSeconds)}
                  </td>

                  <td className="py-3 px-3 font-mono text-emerald-400">
                    {row.percentage}%
                  </td>

                  <td className="py-3 px-3 font-mono text-gray-300">
                    {row.sessionCount}
                  </td>

                  <td className="py-3 px-3 font-mono text-gray-400">
                    {formatDurationShort(row.avgSeconds)}
                  </td>

                  <td className="py-3 px-3 font-mono text-gray-300">
                    {row.targetSeconds > 0
                      ? formatDurationShort(row.targetSeconds)
                      : '—'}
                  </td>

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
