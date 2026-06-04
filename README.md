# OpenCourseReport

A mobile-first, open-source web app for crowdsourced golf course conditions. Golfers submit and browse real-time reports — no login required.

**Repository:** [github.com/AddisonHicks/OpenCourseReport](https://github.com/AddisonHicks/OpenCourseReport)

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS
- Supabase (Postgres + REST via JS SDK)
- Vercel deployment

## Quick Start

1. **Clone and install**

   ```bash
   git clone https://github.com/AddisonHicks/OpenCourseReport.git
   cd OpenCourseReport
   npm install
   ```

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Run `supabase/schema.sql` in the SQL Editor
   - Copy Project URL and anon key from Settings → API

3. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run locally**

   ```bash
   npm run dev
   ```

5. **Deploy to Vercel**

   - Connect the GitHub repo
   - Add the same `VITE_*` env vars in Vercel project settings
   - `vercel.json` handles SPA routing

## App Routes

| Route | Description |
|-------|-------------|
| `/` | Browse — search, recent courses, report feed |
| `/submit` | Submit a condition report |
| `/course/:courseId` | Course detail, stats, reports |
| `/about` | About the project |
| `/report/:reportId` | Shareable single report |
| `/embed/:courseId` | Minimal embed widget (iframe) |

## Local Storage Keys

| Key | Purpose |
|-----|---------|
| `fr_recent_courses` | Up to 3 recent courses |
| `fr_last_submitted` | Last report submit date |
| `fr_voted_[report-id]` | Helpful vote tracking |

## License

MIT
