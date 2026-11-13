'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import type { Subject, Session } from '@/types';
import { useTimelab } from '@/contexts/TimeLabContext';
import { dateKey, parseKey } from '@/lib/date-utils';
import { formatDuration } from '@/lib/utils';

interface ManualSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit?: Session | null;
}

export default function ManualSessionModal({
  isOpen,
  onClose,
  sessionToEdit,
}: ManualSessionModalProps) {
  const { subjects, addManualSession, updateSession, deleteSession } = useTimelab();

  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(dateKey(new Date()));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionToEdit) {
      setSubjectId(sessionToEdit.subjectId);
      const startD = new Date(sessionToEdit.startTimestamp);
      const endD = new Date(sessionToEdit.endTimestamp);
      setDate(dateKey(startD));
      setStartTime(
        `${startD.getHours().toString().padStart(2, '0')}:${startD.getMinutes().toString().padStart(2, '0')}`
      );
      setEndTime(
        `${endD.getHours().toString().padStart(2, '0')}:${endD.getMinutes().toString().padStart(2, '0')}`
      );
      setDescription(sessionToEdit.description || '');
      setError(null);
    } else {
      if (subjects.length > 0) setSubjectId(subjects[0].id);
      setDate(dateKey(new Date()));
      setStartTime('09:00');
      setEndTime('10:30');
      setDescription('');
      setError(null);
    }
  }, [sessionToEdit, subjects, isOpen]);

  if (!isOpen) return null;

  // Calculate duration preview
  const parseTimestamps = () => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const baseDate = parseKey(date);

    const start = new Date(baseDate);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(baseDate);
    end.setHours(endH, endM, 0, 0);

    // If end is before start, assume next day midnight overlap or error
    return {
      startMs: start.getTime(),
      endMs: end.getTime(),
      durationSecs: (end.getTime() - start.getTime()) / 1000,
    };
  };

  const { durationSecs } = parseTimestamps();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { startMs, endMs, durationSecs } = parseTimestamps();

    if (durationSecs <= 0) {
      setError('End time must be after start time.');
      return;
    }
    if (endMs > Date.now() + 60000) {
      setError('Session cannot end in the future.');
      return;
    }

    if (sessionToEdit) {
      updateSession(sessionToEdit.id, {
        subjectId,
        startTimestamp: startMs,
        endTimestamp: endMs,
        durationSeconds: durationSecs,
        description,
      });
      onClose();
    } else {
      const err = addManualSession(subjectId, startMs, endMs, description);
      if (err) {
        setError(err);
      } else {
        onClose();
      }
    }
  };

  const handleDelete = () => {
    if (sessionToEdit && confirm('Are you sure you want to delete this session?')) {
      deleteSession(sessionToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock size={18} className="text-emerald-400" />
            {sessionToEdit ? 'Edit Session' : 'Log Manual Session'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[var(--surface-hover)]"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Subject */}
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
                .filter((s) => s.isActive || s.id === subjectId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {!s.isActive ? '(Archived)' : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Duration Preview */}
          <div className="flex items-center justify-between rounded-lg bg-black/40 border border-black/60 px-3 py-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Calculated Duration:</span>
            <span
              className={`font-mono font-semibold ${
                durationSecs > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {durationSecs > 0 ? formatDuration(durationSecs) : 'Invalid Time Range'}
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
              Notes / Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Chapter 4 Problem Set, Macroeconomics Essay..."
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
            {sessionToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-[var(--surface-hover)] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={durationSecs <= 0}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-semibold transition"
              >
                {sessionToEdit ? 'Save Changes' : 'Record Session'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
