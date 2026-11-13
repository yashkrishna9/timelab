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

interface HourlyActivityChartProps {
  hourlySeconds: number[]; // 24 values
}

export default function HourlyActivityChart({ hourlySeconds }: HourlyActivityChartProps) {
  const data = hourlySeconds.map((seconds, hour) => {
    const label = `${hour.toString().padStart(2, '0')}:00`;
    const minutes = Math.round(seconds / 60);
    return {
      hour,
      label,
      minutes,
      seconds,
    };
  });

  const maxMinutes = Math.max(...data.map((d) => d.minutes), 0);

  return (
    <div className="w-full">
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(hour) => (hour % 3 === 0 ? `${hour}:00` : '')}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              unit="m"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[#141722] p-2 shadow-xl text-xs">
                      <div className="font-semibold text-white mb-0.5">{item.label}</div>
                      <div className="font-mono text-emerald-400">
                        {item.minutes > 0 ? `${item.minutes} mins tracked` : 'No activity'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="minutes" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.minutes === 0
                      ? '#1e2230'
                      : entry.minutes === maxMinutes && maxMinutes > 0
                      ? '#10b981'
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
