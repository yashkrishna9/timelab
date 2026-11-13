'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatDurationShort } from '@/lib/utils';
import type { Subject } from '@/types';

interface DistributionItem {
  subjectId: string;
  name: string;
  color: string;
  seconds: number;
  percentage: number;
}

interface TimeDistributionDonutProps {
  data: DistributionItem[];
  totalSeconds: number;
}

export default function TimeDistributionDonut({
  data,
  totalSeconds,
}: TimeDistributionDonutProps) {
  if (data.length === 0 || totalSeconds === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-xs text-[var(--foreground-muted)]">
        <p>No study sessions recorded for this period.</p>
        <p className="mt-1 text-[11px] text-gray-500">
          Start a timer to see your time distribution breakdown.
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.name,
    value: d.seconds,
    color: d.color,
    percentage: d.percentage,
  }));

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Donut chart */}
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={62}
              outerRadius={86}
              paddingAngle={3}
              dataKey="value"
              stroke="#090a0f"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[#141722] p-2.5 shadow-xl text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-white">{item.name}</span>
                      </div>
                      <div className="font-mono text-emerald-400">
                        {formatDurationShort(item.value)} ({item.percentage}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--foreground-muted)]">
            Total
          </span>
          <span className="font-mono text-base font-bold text-white mt-0.5">
            {formatDurationShort(totalSeconds)}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
        {data.map((item) => (
          <div
            key={item.subjectId}
            className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-white truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
              <span className="text-gray-300">{formatDurationShort(item.seconds)}</span>
              <span className="font-semibold text-emerald-400 w-10 text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
