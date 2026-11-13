import type { Metadata } from 'next';
import './globals.css';
import { TimelabProvider } from '@/contexts/TimeLabContext';
import AppShell from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TIMELAB — Personal Time Intelligence',
  description: 'A sophisticated multi-subject time tracking and productivity analysis platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#090a0f] text-[#f3f4f6]">
        <TimelabProvider>
          <AppShell>
            {children}
          </AppShell>
        </TimelabProvider>
      </body>
    </html>
  );
}
