'use client';

import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Clock, Trash2, Edit3, X } from 'lucide-react';
import { useTimelab } from '@/contexts/TimeLabContext';
import type { Subject, Goal, GoalPeriod } from '@/types';
import {
  totalSecondsForDate,
  totalSecondsInRange,
} from '@/lib/analytics';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from '@/lib/date-utils';
import { formatDurationShort, formatDurationHours } from '@/lib/utils';
import Icon from '@/components/ui/Icon';

export default function GoalsPage() {
  const { subjects, sessions, goals, setGoal, deleteGoal, settings } = useTimelab();
  const [selectedPeriod, setSelectedPeriod] = useState<GoalPeriod>('weekly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [period, setPeriod] = useState<GoalPeriod>('weekly');
  const [targetHours, setTargetHours] = useState('10');

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, settings.weekStart);
  const weekEnd = endOfWeek(now, settings.weekStart);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));

  // Filter goals by period
  const periodGoals = goals.filter((g) => g.period === selectedPeriod);

  // Compute progress for each goal
  const goalItems = periodGoals
    .map((goal) => {
      const subject = subjectMap.get(goal.subjectId);
      if (!subject) return null;

      let completedSecs = 0;
      if (goal.period === 'daily') {
        completedSecs = totalSecondsForDate(
          sessions.filter((s) => s.subjectId === subject.id),
          now
        );
      } else if (goal.period === 'weekly') {
        completedSecs = totalSecondsInRange(
          sessions.filter((s) => s.subjectId === subject.id),
          weekStart,
          weekEnd
        );
      } else {
        completedSecs = totalSecondsInRange(
          sessions.filter((s) => s.subjectId === subject.id),
          monthStart,
          monthEnd
        );
      }

      const completedHours = completedSecs / 3600;
      const targetH = goal.targetSeconds / 3600;
      const remainingSecs = Math.max(0, goal.targetSeconds - completedSecs);
      const remainingHours = remainingSecs / 3600;
      const percentage =
        goal.targetSeconds > 0
          ? Math.min(100, Math.round((completedSecs / goal.targetSeconds) * 100))
          : 0;

      return {
        goal,
        subject,
        completedSecs,
        completedHours,
        targetHours: targetH,
        remainingHours,
        percentage,
        isAchieved: completedSecs >= goal.targetSeconds,
      };
    })
    .filter(Boolean);

  const handleOpenAdd = () => {
    if (subjects.length > 0) setSubjectId(subjects[0].id);
    setPeriod(selectedPeriod);
    setTargetHours('10');
    setIsModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(targetHours);
    if (!subjectId || isNaN(hours) || hours <= 0) return;

    setGoal(subjectId, period, Math.round(hours * 3600));
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Goal Management</h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Set and monitor daily, weekly, and monthly study volume targets for each subject.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition"
        >
          <Plus size={14} />
          <span>Set Target</span>
        </button>
      </div>

      {/* Period Selection Tabs */}
      <div className="flex items-center gap-2">
        {(['daily', 'weekly', 'monthly'] as GoalPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPeriod(p)}
            className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition ${
              selectedPeriod === p
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-white bg-[var(--surface)]'
            }`}
          >
            {p} Goals ({goals.filter((g) => g.period === p).length})
          </button>
        ))}
      </div>

      {/* ─── GOAL CARDS GRID ────────────────────────────────────── */}
      {goalItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-[var(--foreground-muted)] rounded-2xl border border-dashed border-[var(--border-subtle)]">
          <Target size={32} className="text-gray-600 mb-2" />
          <p className="font-semibold text-white">No {selectedPeriod} goals defined</p>
          <p className="mt-1 text-[11px] text-gray-500 max-w-sm">
            Set deliberate target hours for your study subjects to track completion rates.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold text-xs hover:bg-emerald-500/20 transition"
          >
            + Set First {selectedPeriod} Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goalItems.map((item) => {
            if (!item) return null;
            const { goal, subject, completedHours, targetHours, remainingHours, percentage, isAchieved } = item;

            return (
              <div
                key={goal.id}
                className={`relative flex flex-col justify-between rounded-xl border p-5 transition ${
                  isAchieved
                    ? 'border-emerald-500/40 bg-emerald-950/15'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-card)]'
                }`}
              >
                <div>
                  {/* Top Bar: Subject icon, Name, Delete action */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg border font-bold"
                        style={{
                          backgroundColor: `${subject.color}15`,
                          borderColor: `${subject.color}40`,
                          color: subject.color,
                        }}
                      >
                        <Icon name={subject.icon} size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-white">{subject.name}</h3>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          {goal.period} target
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Remove this ${goal.period} goal for ${subject.name}?`)) {
                          deleteGoal(goal.id);
                        }
                      }}
                      className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete Goal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Hours Metric */}
                  <div className="flex items-baseline justify-between mt-4">
                    <div className="font-mono text-2xl font-bold text-white">
                      {completedHours.toFixed(1)}h{' '}
                      <span className="text-xs text-gray-400 font-normal">
                        / {targetHours.toFixed(1)}h target
                      </span>
                    </div>
                    <span
                      className={`font-mono text-sm font-bold ${
                        isAchieved ? 'text-emerald-400' : 'text-gray-300'
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2.5 h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isAchieved ? '#10b981' : subject.color,
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Footer Details */}
                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--foreground-muted)]">
                  {isAchieved ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 size={13} />
                      Target Achieved!
                    </span>
                  ) : (
                    <span>
                      <strong className="text-white font-mono">{remainingHours.toFixed(1)}h</strong>{' '}
                      remaining
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-gray-500">
                    {formatDurationShort(item.completedSecs)} logged
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ADD / EDIT GOAL MODAL ──────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Target size={18} className="text-emerald-400" />
                Set Study Goal
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[var(--surface-hover)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Subject
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  {subjects
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Target Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'monthly'] as GoalPeriod[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`py-1.5 rounded-lg text-xs capitalize transition ${
                        period === p
                          ? 'bg-emerald-500 text-black font-semibold'
                          : 'bg-[var(--surface)] text-gray-400 border border-[var(--border-subtle)]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Target Hours ({period})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="168"
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
