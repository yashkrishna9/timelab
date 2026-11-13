'use client';

import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Clock,
  Calendar,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  FileJson,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useTimelab } from '@/contexts/TimeLabContext';
import { exportCSV, downloadFile } from '@/lib/export';
import * as storage from '@/lib/storage';
import { validateImportData } from '@/lib/validation';
import type { Subject, ThemeMode, TimeFormat, WeekStart } from '@/types';
import SubjectModal from '@/components/timers/SubjectModal';
import Icon from '@/components/ui/Icon';

export default function SettingsPage() {
  const {
    subjects,
    sessions,
    goals,
    settings,
    updateSettings,
    refreshData,
    seedSampleData,
  } = useTimelab();

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = exportCSV(sessions, subjects);
    downloadFile(
      csvContent,
      `timelab-sessions-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );
    showMessage(`Exported ${sessions.length} sessions to CSV.`);
  };

  // JSON Export
  const handleExportJSON = () => {
    const exportData = storage.exportAllData();
    downloadFile(
      JSON.stringify(exportData, null, 2),
      `timelab-backup-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json;charset=utf-8;'
    );
    showMessage('Full JSON backup downloaded successfully.');
  };

  // JSON Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validationError = validateImportData(parsed);
        if (validationError) {
          showMessage(`Import failed: ${validationError}`, 'error');
          return;
        }

        const { imported, skipped } = storage.importData(parsed);
        refreshData();
        showMessage(
          `Import complete! Imported ${imported} new items (${skipped} duplicates skipped).`
        );
      } catch (err) {
        showMessage('Invalid JSON file format.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset All Data
  const handleReset = () => {
    if (
      confirm(
        'WARNING: Are you sure you want to reset all TimeLab data? This will clear all sessions, custom subjects, and goals, restoring default subjects.'
      )
    ) {
      storage.resetAllData();
      refreshData();
      showMessage('All data reset to clean default state.');
    }
  };

  // Load Demo Data
  const handleSeedData = () => {
    if (
      confirm(
        'Generate realistic study data across the last 30 days? This will allow you to preview comprehensive analytics, daily heatmaps, and charts immediately.'
      )
    ) {
      seedSampleData();
      showMessage('Sample 30-day productivity dataset loaded successfully!');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div className="pb-6 border-b border-[var(--border-subtle)]">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings & Preferences</h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          Customize application themes, time conventions, subject definitions, and data backups.
        </p>
      </div>

      {/* Notification Toast */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>{message.text}</span>
        </div>
      )}

      {/* ─── 1. APPEARANCE & THEME ──────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">Appearance & Display</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Adjust visual theme and time display format.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition ${
                  settings.theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-[var(--border-subtle)] bg-[var(--surface)] text-gray-400 hover:text-white'
                }`}
              >
                <Moon size={15} />
                <span>Dark Theme</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition ${
                  settings.theme === 'light'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-[var(--border-subtle)] bg-[var(--surface)] text-gray-400 hover:text-white'
                }`}
              >
                <Sun size={15} />
                <span>Light Theme</span>
              </button>
            </div>
          </div>

          {/* Time Format */}
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-2">
              Time Clock Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ timeFormat: '24h' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition ${
                  settings.timeFormat === '24h'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-[var(--border-subtle)] bg-[var(--surface)] text-gray-400 hover:text-white'
                }`}
              >
                <Clock size={15} />
                <span>24-Hour (14:30)</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ timeFormat: '12h' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition ${
                  settings.timeFormat === '12h'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-[var(--border-subtle)] bg-[var(--surface)] text-gray-400 hover:text-white'
                }`}
              >
                <Clock size={15} />
                <span>12-Hour (2:30 PM)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Week Start Preference */}
        <div>
          <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-2">
            First Day of the Week
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateSettings({ weekStart: 'monday' })}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold transition ${
                settings.weekStart === 'monday'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                  : 'border-[var(--border-subtle)] bg-[var(--surface)] text-gray-400 hover:text-white'
              }`}
            >
              Monday (Default)
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ weekStart: 'sunday' })}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold transition ${
                settings.weekStart === 'sunday'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                  : 'border-[var(--border-subtle)] bg-[var(--surface)] text-gray-400 hover:text-white'
              }`}
            >
              Sunday
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. SUBJECT MANAGEMENT ──────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Study Subjects</h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              Create, edit, color-code, or archive your study subjects.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSubject(null);
              setSubjectModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition"
          >
            <Plus size={14} />
            <span>Add Subject</span>
          </button>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between py-2.5 px-1 hover:bg-[var(--surface-hover)] rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg border font-bold"
                  style={{
                    backgroundColor: `${sub.color}15`,
                    borderColor: `${sub.color}40`,
                    color: sub.color,
                  }}
                >
                  <Icon name={sub.icon} size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{sub.name}</span>
                    {!sub.isActive && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                        Archived
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingSubject(sub);
                  setSubjectModalOpen(true);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded hover:bg-emerald-500/10 transition"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 3. DATA BACKUP & EXPORT ────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Data Management & Backup</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Export all session records to CSV or create a complete JSON backup to restore later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CSV Export */}
          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                <FileSpreadsheet size={16} className="text-emerald-400" />
                <span>Export Sessions to CSV</span>
              </div>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Download a spreadsheet containing date, subject, start, end, and duration for all sessions.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="mt-4 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-white transition"
            >
              <Download size={14} />
              <span>Download CSV ({sessions.length} sessions)</span>
            </button>
          </div>

          {/* JSON Backup & Restore */}
          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                <FileJson size={16} className="text-emerald-400" />
                <span>Full JSON Backup & Restore</span>
              </div>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Export complete database state (subjects, sessions, goals, preferences) or restore from file.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-white transition"
              >
                <Download size={13} />
                <span>Backup</span>
              </button>
              <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-white cursor-pointer transition">
                <Upload size={13} />
                <span>Restore</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Demo Data Generator */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-0.5">
              <Sparkles size={14} />
              <span>Load 30-Day Demonstration Dataset</span>
            </div>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Instantly populate your database with 30 days of realistic study sessions across all default subjects to test heatmaps, weekly reports, and charts.
            </p>
          </div>
          <button
            onClick={handleSeedData}
            className="shrink-0 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-sm"
          >
            Load Demo Data
          </button>
        </div>
      </div>

      {/* ─── 4. DANGER ZONE ─────────────────────────────────────── */}
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-rose-300 flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>Danger Zone</span>
          </h2>
          <p className="text-xs text-rose-200/70 mt-0.5">
            Resetting clears stored data and restores default application settings.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
        >
          Reset All TimeLab Data
        </button>
      </div>

      {/* Subject Modal */}
      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => {
          setSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        subjectToEdit={editingSubject}
      />
    </div>
  );
}
