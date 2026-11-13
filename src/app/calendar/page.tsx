'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useTimelab } from '@/contexts/TimeLabContext';
import {
  calendarGrid,
  monthLabel,
  weekDayNames,
  dateKey,
  isSameDay,
  addDays,
} from '@/lib/date-utils';
import {
  totalSecondsForDate,
  sessionsInRange,
} from '@/lib/analytics';
import { startOfDay, endOfDay } from '@/lib/date-utils';
import { formatDuration, formatDurationShort } from '@/lib/utils';
import RecentSessionsList from '@/components/dashboard/RecentSessionsList';

export default function CalendarPage() {
  const { sessions, settings } = useTimelab();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const grid = calendarGrid(year, month, settings.weekStart);
  const dayHeaders = weekDayNames(settings.weekStart);

  // Selected date details
  const selDayStart = startOfDay(selectedDate);
  const selDayEnd = endOfDay(selectedDate);
  const selectedDaySessions = sessionsInRange(sessions, selDayStart, selDayEnd);
  const selectedDaySeconds = totalSecondsForDate(sessions, selectedDate);

  // Heatmap intensity calculation based on user settings
  const { low, moderate, high, highest } = settings.calendarThresholds;

  const getIntensityClass = (seconds: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'opacity-30 border-transparent bg-transparent';
    const hours = seconds / 3600;
    if (hours === 0) return 'bg-[var(--surface)] text-gray-500 border-[var(--border-subtle)]';
    if (hours < low) return 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50';
    if (hours < moderate) return 'bg-emerald-900/60 text-emerald-200 border-emerald-700/60';
    if (hours < high) return 'bg-emerald-700/70 text-white border-emerald-600';
    return 'bg-emerald-500 text-black font-bold border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]';
  };

  const handlePrevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));
  const handleThisMonth = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  return (
    <div className="space-y-6">
      {/* ─── NAVIGATION HEADER ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Calendar & Activity History</h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Visual activity heatmap showing study intensity across every day of the month.
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
          <button
            onClick={handleThisMonth}
            className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* ─── HEATMAP LEGEND ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-xs">
        <span className="font-semibold text-white">Activity Intensity:</span>
        <div className="flex items-center gap-4 text-[11px] text-[var(--foreground-muted)]">
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded border border-[var(--border-subtle)] bg-[var(--surface)]" />
            <span>0h (None)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-emerald-950/40 border border-emerald-900/50" />
            <span>&lt; {low}h (Low)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-emerald-900/60 border border-emerald-700/60" />
            <span>{low}–{moderate}h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-emerald-700/70 border border-emerald-600" />
            <span>{moderate}–{high}h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded bg-emerald-500 border border-emerald-400" />
            <span>&gt; {high}h (Peak)</span>
          </div>
        </div>
      </div>

      {/* ─── CALENDAR GRID ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
          {dayHeaders.map((dh) => (
            <div key={dh} className="py-1">
              {dh}
            </div>
          ))}
        </div>

        {/* 6 Weeks Grid */}
        <div className="grid grid-cols-7 gap-2">
          {grid.map((week, wIdx) =>
            week.map((date, dIdx) => {
              if (!date) return <div key={`empty-${wIdx}-${dIdx}`} />;

              const isCurrentM = date.getMonth() === month;
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              const secs = totalSecondsForDate(sessions, date);

              return (
                <button
                  key={`day-${wIdx}-${dIdx}`}
                  onClick={() => setSelectedDate(date)}
                  className={`relative flex flex-col justify-between p-2.5 h-20 sm:h-24 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#090a0f] border-emerald-400 z-10'
                      : ''
                  } ${getIntensityClass(secs, isCurrentM)}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'h-5 w-5 rounded-full bg-emerald-400 text-black flex items-center justify-center font-bold'
                          : ''
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {secs > 0 && isCurrentM && (
                      <span className="text-[10px] font-mono font-medium opacity-80">
                        {formatDurationShort(secs)}
                      </span>
                    )}
                  </div>

                  {secs > 0 && isCurrentM && (
                    <div className="mt-auto">
                      <div className="text-[9px] font-mono opacity-70">
                        {(secs / 3600).toFixed(1)} hrs
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── SELECTED DAY DETAILS DRAWER ────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)] mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <p className="text-xs text-[var(--foreground-muted)]">
              Total tracked:{' '}
              <span className="font-mono font-semibold text-emerald-400">
                {formatDuration(selectedDaySeconds)}
              </span>{' '}
              across {selectedDaySessions.length} session
              {selectedDaySessions.length === 1 ? '' : 's'}
            </p>
          </div>

          <Link
            href="/daily"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
          >
            <span>Open in Daily Analytics</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <RecentSessionsList sessions={selectedDaySessions} limit={20} />
      </div>
    </div>
  );
}
