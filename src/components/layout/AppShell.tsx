'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Timer,
  CalendarDays,
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Settings,
  Menu,
  X,
  Play,
  Pause,
  Square,
  Moon,
  Sun,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useTimelab } from '@/contexts/TimeLabContext';
import { formatDuration, formatTime, getGreeting } from '@/lib/utils';
import Icon from '@/components/ui/Icon';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/timers', label: 'My Timers', icon: Timer },
  { href: '/daily', label: 'Daily Report', icon: CalendarDays },
  { href: '/weekly', label: 'Weekly Analytics', icon: BarChart3 },
  { href: '/monthly', label: 'Monthly Analytics', icon: TrendingUp },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    subjects,
    activeTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getElapsedSeconds,
    settings,
    updateSettings,
    isReady,
  } = useTimelab();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Live clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
      setElapsed(getElapsedSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, [getElapsedSeconds]);

  // Active subject lookup
  const activeSubject = activeTimer
    ? subjects.find((s) => s.id === activeTimer.subjectId)
    : null;

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090a0f] text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="text-sm font-medium tracking-wide">Loading TimeLab...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* ─── DESKTOP SIDEBAR ────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface)] p-4 select-none shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold tracking-wider text-base shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            TL
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
              TIMELAB
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-[var(--foreground-muted)] tracking-wide">
              Time Intelligence
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-semibold'
                    : 'text-[var(--foreground-muted)] hover:text-white hover:bg-[var(--surface-hover)]'
                }`}
              >
                <ItemIcon size={18} className={isActive ? 'text-emerald-400' : 'text-gray-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Sidebar Active Timer Widget */}
        {activeTimer && activeSubject && (
          <div className="mt-auto mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 shadow-lg shadow-emerald-950/40">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {activeTimer.isPaused ? 'Paused' : 'Recording'}
              </span>
              <span className="font-mono text-sm font-semibold">{formatDuration(elapsed)}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: activeSubject.color }}
              />
              <span className="text-xs font-semibold text-white truncate">
                {activeSubject.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {activeTimer.isPaused ? (
                <button
                  onClick={resumeTimer}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition"
                  title="Resume timer"
                >
                  <Play size={12} fill="currentColor" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-gray-800 border border-gray-700 text-gray-200 text-xs font-semibold hover:bg-gray-700 transition"
                  title="Pause timer"
                >
                  <Pause size={12} />
                  Pause
                </button>
              )}
              <button
                onClick={stopTimer}
                className="flex items-center justify-center py-1.5 px-2.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30 transition"
                title="Save & Stop"
              >
                <Square size={12} fill="currentColor" />
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span>{formatTime(currentTime, settings.timeFormat)}</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-gray-400 hover:text-white transition"
            title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface)]/90 px-4 md:px-8 backdrop-blur-md">
          {/* Mobile hamburger + brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--surface-hover)]"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              TIMELAB
            </span>
          </div>

          {/* Desktop Greeting & Live Clock Header */}
          <div className="hidden lg:flex items-center gap-4">
            <span className="text-sm font-medium text-[var(--foreground-muted)]">
              {getGreeting()}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-sm font-semibold text-white">
              {new Date(currentTime).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="text-gray-600">•</span>
            <span className="font-mono text-sm font-medium text-emerald-400 bg-emerald-950/30 px-2.5 py-0.5 rounded border border-emerald-500/20">
              {formatTime(currentTime, settings.timeFormat)}
            </span>
          </div>

          {/* Top Bar Active Timer Status (visible on all screens) */}
          <div className="flex items-center gap-3">
            {activeTimer && activeSubject ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span
                  className="hidden sm:inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: activeSubject.color }}
                />
                <span className="text-xs font-semibold text-white max-w-[100px] sm:max-w-[140px] truncate">
                  {activeSubject.name}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400 bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  {formatDuration(elapsed)}
                </span>

                <div className="flex items-center gap-1 ml-1">
                  {activeTimer.isPaused ? (
                    <button
                      onClick={resumeTimer}
                      className="p-1 rounded bg-emerald-500 text-black hover:bg-emerald-400 transition"
                      title="Resume"
                    >
                      <Play size={11} fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="p-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700 transition"
                      title="Pause"
                    >
                      <Pause size={11} />
                    </button>
                  )}
                  <button
                    onClick={stopTimer}
                    className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition"
                    title="Stop & Save"
                  >
                    <Square size={11} fill="currentColor" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                <span className="h-2 w-2 rounded-full bg-gray-600" />
                <span>No active timer</span>
              </div>
            )}

            {/* Quick Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--surface-hover)] transition"
              title="Toggle theme"
            >
              {settings.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* ─── MOBILE DRAWER MENU ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-[var(--surface)] p-5 border-r border-[var(--border-subtle)] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-sm">
                  TL
                </div>
                <span className="text-base font-bold text-white">TIMELAB</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <ItemIcon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
