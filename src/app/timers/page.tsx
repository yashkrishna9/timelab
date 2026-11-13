'use client';

import React, { useState } from 'react';
import { Plus, Clock, Archive, Filter, CheckCircle2 } from 'lucide-react';
import { useTimelab } from '@/contexts/TimeLabContext';
import TimerCard from '@/components/timers/TimerCard';
import SubjectModal from '@/components/timers/SubjectModal';
import ManualSessionModal from '@/components/timers/ManualSessionModal';
import type { Subject } from '@/types';
import Icon from '@/components/ui/Icon';

export default function TimersPage() {
  const { subjects } = useTimelab();
  const [filter, setFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedSubjectToEdit, setSelectedSubjectToEdit] = useState<Subject | null>(null);

  const filteredSubjects = subjects.filter((s) => {
    if (filter === 'active') return s.isActive;
    if (filter === 'archived') return !s.isActive;
    return true;
  });

  const handleEdit = (sub: Subject) => {
    setSelectedSubjectToEdit(sub);
    setSubjectModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedSubjectToEdit(null);
    setSubjectModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Timers</h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Track, start, pause, and manage multi-subject stopwatches with automated session saving.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-white transition"
          >
            <Clock size={14} className="text-emerald-400" />
            <span>Manual Entry</span>
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition"
          >
            <Plus size={14} />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'active'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-[var(--foreground-muted)] hover:text-white bg-[var(--surface)]'
          }`}
        >
          Active Subjects ({subjects.filter((s) => s.isActive).length})
        </button>
        <button
          onClick={() => setFilter('archived')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'archived'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-[var(--foreground-muted)] hover:text-white bg-[var(--surface)]'
          }`}
        >
          Archived ({subjects.filter((s) => !s.isActive).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'all'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-[var(--foreground-muted)] hover:text-white bg-[var(--surface)]'
          }`}
        >
          All ({subjects.length})
        </button>
      </div>

      {/* Grid of Subject Cards */}
      {filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-[var(--foreground-muted)] rounded-2xl border border-dashed border-[var(--border-subtle)]">
          <Archive size={32} className="text-gray-600 mb-2" />
          <p className="font-semibold text-white">No subjects found</p>
          <p className="mt-1 text-[11px] text-gray-500 max-w-sm">
            {filter === 'archived'
              ? 'You have no archived subjects.'
              : 'Click "Add Subject" above to create your first custom timer.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubjects.map((subject) => (
            <TimerCard key={subject.id} subject={subject} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* Modals */}
      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => {
          setSubjectModalOpen(false);
          setSelectedSubjectToEdit(null);
        }}
        subjectToEdit={selectedSubjectToEdit}
      />
      <ManualSessionModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
      />
    </div>
  );
}
