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

export interface DayDataPoint {
  dayLabel: string;
  fullDate: string;
  seconds: number;
  hours: number;
  isToday?: boolean;
}

interface DailyBarChartProps {
  data: DayDataPoint[];
  height?: number;
}

export default function DailyBarChart({ data, height = 220 }: DailyBarChartProps) {
  const maxHours = Math.max(...data.map((d) => d.hours), 0);

  return (
    <div className="w-full">
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="dayLabel"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              unit="h"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DayDataPoint;
                  return (
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[#141722] p-2.5 shadow-xl text-xs">
                      <div className="font-semibold text-white mb-0.5">{item.fullDate}</div>
                      <div className="font-mono text-emerald-400">
                        {formatDurationShort(item.seconds)} ({item.hours.toFixed(1)} hrs)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`day-cell-${index}`}
                  fill={
                    entry.hours === 0
                      ? '#1e2230'
                      : entry.isToday
                      ? '#10b981'
                      : entry.hours === maxHours && maxHours > 0
                      ? '#34d399'
                      : '#059669'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
