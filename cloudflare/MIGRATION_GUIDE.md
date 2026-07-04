# PoultrySuite Africa — Cloudflare Migration Guide

## What changed

The entire backend moved from **Supabase** to **Cloudflare Workers + D1**.

| Before (Supabase) | After (Cloudflare) |
|---|---|
| PostgreSQL | D1 (SQLite) |
| Supabase Auth | Worker + JWT |
| PostgREST | Worker API endpoints |
| Edge Functions | Worker (same file) |
| RLS policies | Worker-level auth checks |

The frontend `src/lib/supabase/client.js` is now a compatibility shim
that translates existing `supabase.from(...)` / `supabase.rpc(...)`
calls into `fetch()` calls to the Worker. No other source files needed
changing.

## Deployment steps

### 1. Install Wrangler (Cloudflare CLI)

```bash
npm install -g wrangler
wrangler login
```

### 2. Create the D1 database

```bash
cd cloudflare
wrangler d1 create poultrysuite-db
```

This prints a `database_id`. Copy it into `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "poultrysuite-db"
database_id = "paste-your-id-here"
```

### 3. Run the schema migration

```bash
wrangler d1 execute poultrysuite-db --file=migrations/0001_schema.sql
```

### 4. Set secrets

Edit `wrangler.toml` and set:
- `JWT_SECRET` — a long random string (generate with `openssl rand -hex 32`)
- `CORS_ORIGIN` — your frontend URL (e.g. `https://poultrysuite.agorox.africa`)
- `PAYSTACK_SECRET_KEY` — your Paystack secret key

Or use Wrangler secrets for sensitive values:
```bash
wrangler secret put JWT_SECRET
wrangler secret put PAYSTACK_SECRET_KEY
```

### 5. Deploy the Worker

```bash
wrangler deploy
```

This prints the Worker URL (e.g. `https://poultrysuite-api.johnpadeola.workers.dev`).

### 6. Update Cloudflare Pages environment

In Cloudflare Pages → PoultrySuite project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://poultrysuite-api.johnpadeola.workers.dev` |
| `VITE_PAYSTACK_PUBLIC_KEY` | `pk_test_or_live_...` |

Remove the old Supabase variables:
- ~~`VITE_SUPABASE_URL`~~
- ~~`VITE_SUPABASE_ANON_KEY`~~

### 7. Update Paystack webhook URL

Paystack Dashboard → Settings → API Keys & Webhooks → Webhook URL:
```
https://poultrysuite-api.johnpadeola.workers.dev/api/paystack-webhook
```

### 8. Create your admin account

Since this is a fresh database, you need to create your user account.
You can do this by signing up through the app, then granting yourself
platform admin:

```bash
wrangler d1 execute poultrysuite-db --command "INSERT INTO platform_admins (user_id, email) SELECT id, email FROM users WHERE email = 'johnpadeola@hotmail.com'"
```

### 9. Migrate existing data (if needed)

If you have real farm data in Supabase that needs to move:

1. Export from Supabase: Table Editor → each table → Export CSV
2. Transform to match D1 schema (mostly the same columns)
3. Import: `wrangler d1 execute poultrysuite-db --file=data_import.sql`

For a fresh start (testing/demo), skip this — the app creates data
as you use it.

## File structure

```
cloudflare/
├── wrangler.toml           — Worker config + D1 binding
├── worker/
│   └── index.js            — The entire API (auth + CRUD + billing + platform)
└── migrations/
    └── 0001_schema.sql     — D1 database schema

src/lib/supabase/
    └── client.js           — Compatibility shim (Supabase API → Worker fetch)
```

## What the Worker handles

- **Auth**: signup, signin, signout, password reset, JWT creation/verification
- **Profiles & farm members**: read by user ID
- **Devices**: register, pair, revoke, touch, usage
- **Batches**: CRUD with offline-queue support (unchanged on frontend)
- **Farm records**: generic collection sync (unchanged on frontend)
- **Plans & billing**: load plans, create payment intent, Paystack webhook
- **Platform admin**: stats, tenants, subscriptions, support tickets

## Important notes

1. **No email sending yet.** Password reset generates a token but doesn't
   email it. Integrate with Resend (you already use it for other projects)
   when ready.

2. **No realtime subscriptions.** Supabase had `onAuthStateChange` which
   the shim emulates locally. If you need cross-device realtime updates
   later, Cloudflare Durable Objects is the path.

3. **The shim is intentionally imperfect.** It covers every pattern
   actually used in the PoultrySuite codebase, but it's not a full
   Supabase client replica. If you add new query patterns, you may need
   to extend the shim's query builder.

4. **D1 pausing: never happens.** Workers and D1 are serverless — they
   spin up on demand with no inactivity timeout. This is the core reason
   for the migration.
