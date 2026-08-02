# OpenCourseReport

A mobile-first, open-source web app for crowdsourced golf course conditions. Golfers submit and browse real-time reports — no login required.

**Repository:** [github.com/AddisonHicks/OpenCourseReport](https://github.com/AddisonHicks/OpenCourseReport)

## How This Project Works

OpenCourseReport is built around a single shared app and a single shared database. Course and report data live in one Supabase project that powers the live site. That concentration is the point — golfers everywhere contribute to the same pool of conditions, and every new report makes the platform more useful for everyone.

Forking the repo to run a separate deployment with a separate database would split that data and weaken the project. Instead, contributors should work from this repository and open pull requests here. Bug fixes, UI improvements, schema changes, and new features all flow through this repo and into the shared production instance.

## Contributing

1. Fork [github.com/AddisonHicks/OpenCourseReport](https://github.com/AddisonHicks/OpenCourseReport)
2. Create a branch for your change
3. Open a pull request with a clear description of what you changed and why

Database schema lives in `supabase/schema.sql`. App changes go in `src/`. If your work touches both, include both in the same PR so the app and database stay in sync.

For local development, copy `.env.example` to `.env.local` and use the project’s shared Supabase credentials (available from maintainers). Do not create a standalone Supabase project for contribution work unless you are explicitly testing an isolated schema migration.

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS
- Supabase (Postgres + REST via JS SDK)
- Vercel deployment

## App Routes

| Route | Description |
|-------|-------------|
| `/` | Browse — search, recent courses, report feed |
| `/submit` | Submit a condition report |
| `/course/:courseSlug` | Course detail, stats, reports |
| `/about` | About the project |
| `/discord-notifications` | Register / manage Discord webhook notifications |
| `/course/:courseSlug/:reportSlug` | Shareable single report (e.g. `2026-06-08` or `2026-06-08-2`) |
| `/embed/:courseId` | Minimal embed widget (iframe) |

## Discord notifications

Servers can register a Discord **incoming webhook** on the [/discord-notifications](https://open-course-report.vercel.app/discord-notifications) page (linked from About). New reports within that radius are posted automatically via Supabase Edge Functions — no always-on Discord bot required.

Setup guide: [`supabase/DISCORD_WEBHOOKS.md`](supabase/DISCORD_WEBHOOKS.md)

## Local Storage Keys

The app stores a small amount of client-side state in the browser — not on the server:

| Key | Purpose |
|-----|---------|
| `fr_user_zipcode` | User's zip code for nearby report filtering |
| `fr_recent_courses` | Up to 3 recent courses |
| `fr_last_submitted` | Last report submit date |
| `fr_voted_[report-id]` | Helpful vote tracking |

## License

MIT
