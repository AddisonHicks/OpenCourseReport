-- OpenCourseReport schema + RLS
-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  course_name text not null,
  city text not null,
  state text not null,
  zipcode text,
  slug text unique,
  holes integer,
  course_type text check (course_type in ('Public', 'Semi-Private', 'Private')),
  is_user_submitted boolean default false,
  is_approved boolean default true,
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_initial char(1) not null,
  course_id uuid references courses(id) on delete cascade,
  date_played date not null,
  time_of_day text not null check (time_of_day in ('morning', 'midday', 'afternoon')),
  transport_mode text check (transport_mode in ('walking', 'cart')),
  walkability_notes text,
  price_paid numeric,
  holes_played integer check (holes_played in (9, 18)),
  pace_of_play integer,
  greens_report text,
  fairways_tees_report text,
  maintenance_notes text,
  other_conditions_notes text,
  helpful_votes integer default 0,
  slug text,
  created_at timestamptz default now(),
  unique (course_id, slug)
);

create table if not exists report_votes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_reports_course_id on reports(course_id);
create index if not exists idx_reports_date_played on reports(date_played desc);
create index if not exists idx_reports_created_at on reports(created_at desc);
create index if not exists idx_reports_slug on reports(course_id, slug);
create index if not exists idx_courses_name on courses(course_name);
create index if not exists idx_courses_approved on courses(is_approved);

create index if not exists idx_courses_zipcode on courses(zipcode);

create index if not exists idx_courses_slug on courses(slug);

-- Migration for existing databases:
-- alter table courses add column if not exists slug text unique;
-- create index if not exists idx_courses_slug on courses(slug);
-- alter table reports rename column fairways_report to fairways_tees_report;
-- alter table reports add column if not exists holes_played integer check (holes_played in (9, 18));
-- alter table courses add column if not exists zipcode text;
-- create index if not exists idx_courses_zipcode on courses(zipcode);
-- alter table courses drop column if exists phone;
-- alter table courses drop column if exists website;
-- alter table reports add column if not exists slug text;
-- create unique index if not exists idx_reports_course_slug on reports(course_id, slug);
-- Backfill report slugs (run once after adding slug column):
-- with ranked as (
--   select id,
--     date_played::text as base_slug,
--     row_number() over (
--       partition by course_id, date_played
--       order by created_at asc
--     ) as rn
--   from reports
-- )
-- update reports r
-- set slug = case
--   when ranked.rn = 1 then ranked.base_slug
--   else ranked.base_slug || '-' || ranked.rn::text
-- end
-- from ranked
-- where r.id = ranked.id and r.slug is null;

alter table courses enable row level security;
alter table reports enable row level security;
alter table report_votes enable row level security;

-- Public read approved courses + all user-submitted (for reports linking)
drop policy if exists "courses_select" on courses;
create policy "courses_select" on courses for select
  using (is_approved = true or is_user_submitted = true);

-- Anyone can insert user-submitted courses (pending review)
drop policy if exists "courses_insert_user" on courses;
create policy "courses_insert_user" on courses for insert
  with check (is_user_submitted = true and is_approved = false);

-- Approved course seeding (maintainer add-course form)
drop policy if exists "courses_insert_approved" on courses;
create policy "courses_insert_approved" on courses for insert
  with check (is_user_submitted = false and is_approved = true);

-- Public read reports
drop policy if exists "reports_select" on reports;
create policy "reports_select" on reports for select using (true);

-- Public insert reports
drop policy if exists "reports_insert" on reports;
create policy "reports_insert" on reports for insert with check (true);

-- Public update helpful_votes only (anon clients)
drop policy if exists "reports_update_votes" on reports;
create policy "reports_update_votes" on reports for update
  using (true)
  with check (true);

-- Report votes: insert for tracking (optional server-side)
drop policy if exists "report_votes_insert" on report_votes;
create policy "report_votes_insert" on report_votes for insert with check (true);

drop policy if exists "report_votes_select" on report_votes;
create policy "report_votes_select" on report_votes for select using (true);

-- Discord webhook registry (Edge Functions only; no public access)
create table if not exists discord_webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  webhook_url text not null,
  thread_id text,
  city text not null,
  state text not null,
  radius_miles integer not null default 75
    check (radius_miles >= 1 and radius_miles <= 500),
  center_zip text not null,
  manage_token_hash text not null unique,
  created_ip_hash text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists discord_webhook_deliveries (
  subscription_id uuid not null
    references discord_webhook_subscriptions(id) on delete cascade,
  report_id uuid not null references reports(id) on delete cascade,
  delivered_at timestamptz not null default now(),
  primary key (subscription_id, report_id)
);

create index if not exists idx_discord_webhook_subs_enabled
  on discord_webhook_subscriptions(enabled)
  where enabled = true;

create index if not exists idx_discord_webhook_subs_created_ip
  on discord_webhook_subscriptions(created_ip_hash, created_at desc);

alter table discord_webhook_subscriptions enable row level security;
alter table discord_webhook_deliveries enable row level security;

-- No anon/authenticated policies: only service_role (Edge Functions) can access.
