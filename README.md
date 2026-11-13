# TIMELAB — Personal Time Intelligence & Productivity Dashboard

![TimeLab Banner](https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200&auto=format&fit=crop)

**TIMELAB** is a personal time intelligence application designed to accurately measure, record, and analyze how much time you dedicate to academic subjects, research topics, and professional activities.

Inspired by the refined minimalism of **Linear**, **Notion**, and **Raycast**, TimeLab delivers a clean, high-performance experience with zero clutter, accurate timestamp calculations, and deep daily, weekly, and monthly productivity analytics.

---

## Key Features

### 1. Multi-Subject Stopwatch & Precision Timer
- **Seven Default Academic Subjects**: Economics, Mathematics, Econometrics, Python Programming, Quant Research, Reading, and Personal Development.
- **Custom Subjects**: Create unlimited custom subjects with unique colors and Lucide icons.
- **Strict Single-Timer Execution**: Only one timer runs at any moment; switching automatically pauses/saves elapsed time.
- **Timestamp Integrity**: Elapsed time calculations use real millisecond timestamps (`Date.now()`), avoiding drift from tab suspension or throttled intervals.
- **Midnight Splitting**: Study sessions that cross midnight are automatically partitioned between the appropriate calendar dates.
- **Persistent State**: Timers survive page refreshes, browser restarts, and tab switches without losing session state.

### 2. Main Intelligence Dashboard (Overview)
- **Top Status Banner**: Real-time greeting, local clock, and prominent live session counter.
- **4 Primary Metrics**: Tracked Today, Tracked This Week, Tracked This Month, and Active Subjects Studied Today.
- **Subject Timer Grid**: Instant one-click Start, Pause, Resume, and Stop controls with daily and weekly progress indicators.
- **Today's Distribution Donut**: Interactive breakdown of proportional study investment by subject with exact hours and percentages.
- **24-Hour Activity Pattern**: Hourly bar visualization showing exact hours of active focus throughout the day.
- **Recent Sessions Feed**: Chronological log with quick editing and deletion.

### 3. Dedicated Analytics Suite
- **Daily Analytics (`/daily`)**: Full date-picker navigation, longest session detection, average session duration, subject comparison bar chart, and chronological session logs.
- **Weekly Analytics (`/weekly`)**: 7-day performance review (Monday–Sunday), day-by-day comparison, rule-based automated insights, subject-wise targets, and week-over-week trends.
- **Monthly Analytics (`/monthly`)**: 30-day macro-level tracking, daily study distribution, best study day identification, and month-over-month trajectory analysis.

### 4. Interactive Activity Calendar (`/calendar`)
- Monthly visual activity heatmap with configurable intensity thresholds:
  - Neutral / 0h
  - Low (< 2h)
  - Moderate (2–4h)
  - High (4–6h)
  - Peak (> 6h)
- Click any calendar date to inspect all sessions recorded on that day or drill down into its Daily Analytics report.

### 5. Goal Management (`/goals`)
- Set custom target hours per subject across **Daily**, **Weekly**, and **Monthly** intervals.
- Live progress bars indicating completed hours, target hours, and remaining hours.

### 6. Settings, Backup & Data Privacy (`/settings`)
- **Theme**: Dark and Light mode toggle with persistent state.
- **Time Clock**: 12-hour or 24-hour display formats.
- **Calendar**: Customizable first day of the week (Monday or Sunday) and heatmap thresholds.
- **Data Export**:
  - Export all sessions to **RFC4180 CSV**.
  - Download a full **JSON database backup** (subjects, sessions, goals, preferences).
- **Data Import**: Restore any JSON backup with deduplication and data validation.
- **Demo Data Generator**: One-click feature to populate 30 days of realistic study sessions to explore all charts immediately.
- **Local-First & Private**: All data resides entirely in your browser's persistent storage. No mandatory external databases or paid third-party dependencies.

---

## Tech Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components + Client interactivity)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (strict mode)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with custom CSS variables
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Storage Layer**: Local-first storage with versioned schema and migrations (`src/lib/storage.ts`)

---

## Directory Structure

```text
src/
├── app/
│   ├── page.tsx             # Overview / Home Dashboard
│   ├── timers/page.tsx      # My Timers management
│   ├── daily/page.tsx       # Daily Report & Analytics
│   ├── weekly/page.tsx      # Weekly Analytics & Insights
│   ├── monthly/page.tsx     # Monthly Macro Analytics
│   ├── calendar/page.tsx    # Heatmap Activity Calendar
│   ├── goals/page.tsx       # Goal Management
│   ├── settings/page.tsx    # Settings, CSV/JSON Export & Import
│   ├── globals.css          # Design system & dark mode variables
│   └── layout.tsx           # Root Layout with TimelabProvider & AppShell
├── components/
│   ├── layout/              # AppShell, Desktop Sidebar & Mobile Drawer
│   ├── timers/              # TimerCard, ManualSessionModal, SubjectModal
│   ├── charts/              # Donut, DailyBarChart, HourlyActivityChart, SubjectComparison
│   ├── dashboard/           # StatCard, RecentSessionsList
│   └── ui/                  # Dynamic Icon renderer & primitives
├── contexts/
│   └── TimeLabContext.tsx   # Central Timer Engine & State Management
├── lib/
│   ├── analytics.ts         # Math, period calculations, midnight splitting
│   ├── date-utils.ts        # Calendar boundaries, date keys, range helpers
│   ├── storage.ts           # Schema persistence, backup/restore
│   ├── validation.ts        # Session & import validation
│   ├── export.ts            # CSV generation & file downloads
│   └── utils.ts             # Formatting & time helpers
└── types/
    └── index.ts             # Strong TypeScript interfaces & defaults
test/
└── timelab.test.ts          # Automated unit test suite (15 tests)
```

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js 22 and 26)
- npm

### Installation
```bash
git clone https://github.com/yashkrishna9/timelab.git
cd timelab
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests
```bash
npm test
```
Executes the comprehensive 15-test suite validating timer arithmetic, midnight splitting, date boundaries, session overlap detection, and CSV formatting.

### Production Build
```bash
npm run build
```

---

## Vercel Deployment Guide

Deploying TimeLab to Vercel takes less than a minute:

1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Navigate to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your **`yashkrishna9/timelab`** repository.
4. Framework Preset will be automatically detected as **Next.js**.
5. Leave all default settings unchanged (no environment variables required) and click **Deploy**.
6. Your live production application will be online instantly with global edge delivery!

---

## License

MIT © [Yash Krishna](https://github.com/yashkrishna9)
