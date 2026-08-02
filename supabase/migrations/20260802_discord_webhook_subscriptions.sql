-- Discord webhook registry for OpenCourseReport notifications
-- Run in Supabase SQL Editor (or via supabase db push)

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
