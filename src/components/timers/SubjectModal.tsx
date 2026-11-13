'use client';

import React, { useState, useEffect } from 'react';
import { X, Palette, Trash2, Archive, RefreshCw } from 'lucide-react';
import type { Subject } from '@/types';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '@/types';
import { useTimelab } from '@/contexts/TimeLabContext';
import Icon from '@/components/ui/Icon';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit?: Subject | null;
}

export default function SubjectModal({
  isOpen,
  onClose,
  subjectToEdit,
}: SubjectModalProps) {
  const {
    addSubject,
    updateSubject,
    archiveSubject,
    restoreSubject,
    deleteSubject,
  } = useTimelab();

  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState(SUBJECT_ICONS[0]);

  useEffect(() => {
    if (subjectToEdit) {
      setName(subjectToEdit.name);
      setColor(subjectToEdit.color);
      setIcon(subjectToEdit.icon);
    } else {
      setName('');
      setColor(SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]);
      setIcon(SUBJECT_ICONS[0]);
    }
  }, [subjectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (subjectToEdit) {
      updateSubject(subjectToEdit.id, {
        name: name.trim(),
        color,
        icon,
      });
    } else {
      addSubject(name.trim(), color, icon);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!subjectToEdit) return;
    if (
      confirm(
        `Are you sure you want to delete "${subjectToEdit.name}"? Note: Historical session records will remain preserved in reports.`
      )
    ) {
      deleteSubject(subjectToEdit.id);
      onClose();
    }
  };

  const handleToggleArchive = () => {
    if (!subjectToEdit) return;
    if (subjectToEdit.isActive) {
      archiveSubject(subjectToEdit.id);
    } else {
      restoreSubject(subjectToEdit.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Palette size={18} className="text-emerald-400" />
            {subjectToEdit ? 'Edit Subject' : 'Add New Subject'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-[var(--surface-hover)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Subject Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
              Subject Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Behavioral Economics, Linear Algebra..."
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              required
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-2">
              Color Accent
            </label>
            <div className="flex flex-wrap gap-2.5">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-2">
              Icon
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)]">
              {SUBJECT_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition ${
                    icon === iconName
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  title={iconName}
                >
                  <Icon name={iconName} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-black/60">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg border font-bold"
              style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}60`,
                color: color,
              }}
            >
              <Icon name={icon} size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {name || 'Subject Preview'}
              </div>
              <div className="text-[11px] text-gray-400">Ready for tracking</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
            {subjectToEdit ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleArchive}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                  title={subjectToEdit.isActive ? 'Archive Subject' : 'Restore Subject'}
                >
                  {subjectToEdit.isActive ? <Archive size={13} /> : <RefreshCw size={13} />}
                  {subjectToEdit.isActive ? 'Archive' : 'Restore'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Delete Subject"
                >
                  <Trash2 size={14} />
                </button>
              </div>
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
                disabled={!name.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-semibold transition"
              >
                {subjectToEdit ? 'Save Changes' : 'Create Subject'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
