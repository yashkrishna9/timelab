'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatDurationShort } from '@/lib/utils';

export interface SubjectComparisonItem {
  subjectId: string;
  name: string;
  color: string;
  seconds: number;
  hours: number;
  percentage: number;
}

interface SubjectComparisonChartProps {
  data: SubjectComparisonItem[];
}

export default function SubjectComparisonChart({ data }: SubjectComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] text-xs text-[var(--foreground-muted)]">
        No comparative subject data available.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              unit="h"
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as SubjectComparisonItem;
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
                        {formatDurationShort(item.seconds)} ({item.hours.toFixed(1)} hrs • {item.percentage}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
