import type { Session, Subject } from '../types/index.ts';
import { formatTime, formatDuration } from './utils.ts';

/** Export sessions as CSV */
export function exportCSV(sessions: Session[], subjects: Subject[]): string {
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const header =
    'Subject,Start Date,Start Time,End Date,End Time,Duration (seconds),Duration,Description';
  const rows = sessions
    .sort((a, b) => a.startTimestamp - b.startTimestamp)
    .map((s) => {
      const startD = new Date(s.startTimestamp);
      const endD = new Date(s.endTimestamp);
      const name = subjectMap.get(s.subjectId) || 'Unknown';
      return [
        `"${name}"`,
        startD.toLocaleDateString(),
        startD.toLocaleTimeString(),
        endD.toLocaleDateString(),
        endD.toLocaleTimeString(),
        Math.round(s.durationSeconds),
        `"${formatDuration(s.durationSeconds)}"`,
        `"${(s.description || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
  return [header, ...rows].join('\n');
}

/** Trigger a file download in the browser */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
