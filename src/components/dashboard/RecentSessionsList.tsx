'use client';

import React, { useState } from 'react';
import { Clock, Edit3, Trash2 } from 'lucide-react';
import type { Session, Subject } from '@/types';
import { useTimelab } from '@/contexts/TimeLabContext';
import { formatDurationShort, formatTime, formatDate } from '@/lib/utils';
import Icon from '@/components/ui/Icon';
import ManualSessionModal from '@/components/timers/ManualSessionModal';

interface RecentSessionsListProps {
  sessions: Session[];
  limit?: number;
}

export default function RecentSessionsList({
  sessions,
  limit = 10,
}: RecentSessionsListProps) {
  const { subjects, settings, deleteSession } = useTimelab();
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));

  const sortedSessions = [...sessions]
    .sort((a, b) => b.startTimestamp - a.startTimestamp)
    .slice(0, limit);

  if (sortedSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--foreground-muted)] rounded-xl border border-dashed border-[var(--border-subtle)]">
        <Clock size={24} className="text-gray-600 mb-2" />
        <p>No recent study sessions recorded.</p>
        <p className="mt-1 text-[11px] text-gray-500">
          Start a timer or log a manual session to begin building your history.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-[var(--border-subtle)]">
        {sortedSessions.map((session) => {
          const subject = subjectMap.get(session.subjectId);
          const color = subject?.color || '#10b981';
          const icon = subject?.icon || 'Circle';
          const name = subject?.name || 'Unknown Subject';

          return (
            <div
              key={session.id}
              className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-[var(--surface-hover)] transition group text-xs"
            >
              {/* Left: Subject badge & Description */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-bold"
                  style={{
                    backgroundColor: `${color}15`,
                    borderColor: `${color}35`,
                    color: color,
                  }}
                >
                  <Icon name={icon} size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate">{name}</span>
                    {session.isManual && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-gray-800 text-gray-400">
                        Manual
                      </span>
                    )}
                  </div>
                  {session.description ? (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {session.description}
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {formatDate(session.startTimestamp)}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Times & Edit button */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right font-mono text-[11px]">
                  <div className="font-semibold text-emerald-400">
                    {formatDurationShort(session.durationSeconds)}
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    {formatTime(session.startTimestamp, settings.timeFormat)} –{' '}
                    {formatTime(session.endTimestamp, settings.timeFormat)}
                  </div>
                </div>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => setEditingSession(session)}
                    className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition"
                    title="Edit Session"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this session?')) {
                        deleteSession(session.id);
                      }
                    }}
                    className="p-1.5 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete Session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingSession && (
        <ManualSessionModal
          isOpen={true}
          onClose={() => setEditingSession(null)}
          sessionToEdit={editingSession}
        />
      )}
    </>
  );
}
