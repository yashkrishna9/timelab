'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: IconComponent,
  badge,
  trend,
}: StatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 transition hover:border-gray-700 hover:bg-[var(--surface-hover)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          {title}
        </span>
        {IconComponent && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IconComponent size={16} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="font-mono text-2xl font-bold tracking-tight text-white">
          {value}
        </div>
        {(subtitle || badge) && (
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            {badge && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                  trend === 'up'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : trend === 'down'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                {badge}
              </span>
            )}
            {subtitle && (
              <span className="text-[var(--foreground-muted)] truncate">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
