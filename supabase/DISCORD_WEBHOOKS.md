# Discord webhook notifications

OpenCourseReport can post new condition reports to Discord servers via **incoming webhooks** (no always-on bot).

## How it works

1. A Discord admin registers a webhook URL + city/state/radius on the **About** page.
2. On each `reports` INSERT, Supabase Database Webhooks call the `notify-discord-webhooks` Edge Function.
3. The function filters subscriptions by zip-code radius and POSTs embeds to matching Discord webhooks.

## 1. Apply database migration

In the Supabase SQL Editor, run:

[`migrations/20260802_discord_webhook_subscriptions.sql`](./migrations/20260802_discord_webhook_subscriptions.sql)

Or the Discord tables section at the bottom of [`schema.sql`](./schema.sql).

## 2. Deploy Edge Functions

From this repo (with [Supabase CLI](https://supabase.com/docs/guides/cli) logged in):

```bash
supabase functions deploy register-discord-webhook --no-verify-jwt
supabase functions deploy manage-discord-webhook --no-verify-jwt
supabase functions deploy notify-discord-webhooks --no-verify-jwt
```

Set function secrets (Dashboard → Edge Functions → Secrets, or CLI):

```bash
supabase secrets set SITE_URL=https://open-course-report.vercel.app
supabase secrets set DISCORD_NOTIFY_WEBHOOK_SECRET=generate-a-long-random-string
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually injected automatically for Edge Functions.

## 3. Create the Database Webhook

In Supabase Dashboard → **Database** → **Webhooks** (or Integrations → Database Webhooks):

| Setting | Value |
|---------|--------|
| Name | `notify-discord-on-report-insert` |
| Table | `reports` |
| Events | **Insert** |
| Type | HTTP Request |
| Method | POST |
| URL | `https://<PROJECT_REF>.supabase.co/functions/v1/notify-discord-webhooks` |
| HTTP Headers | `Content-Type: application/json` |
| HTTP Headers | `x-webhook-secret: <same value as DISCORD_NOTIFY_WEBHOOK_SECRET>` |

Leave the body as the default JSON payload (includes `type`, `table`, `record`).

## 4. Register a Discord destination

1. Discord → channel (or forum parent) → Integrations → Webhooks → New Webhook → Copy URL
2. For a **forum post**: Developer Mode → right-click the post → Copy Thread ID
3. Open the live site **About** page → fill the Discord notifications form
4. **Copy and save the manage token** shown after success

## 5. Test

Submit a report for a course within the registered radius. Within a few seconds you should see the embed in Discord.

Check Edge Function logs if nothing appears.

## 6. Shut down the Railway Discord bot

Once webhooks work in production:

1. Stop/delete the Railway service for `OpenCourseReportDiscordBot`
2. Keep the bot repo only as an archive if desired

The webhook registry replaces the always-on bot for multi-server notifications.

## Manage / disable

On the About page → **Manage an existing subscription** → paste manage token → Look up → Disable or Update location.
