# PoultrySuite Africa (Cloudflare Edition)

A tablet-first farm management PWA for African poultry, hatchery, and feed
mill operations, by AgoroX Technologies.

## ⚠️ About this repo

This is a **separate, new repo** created specifically to migrate the backend
from Supabase to Cloudflare Workers + D1. The original Supabase-based
version keeps running untouched in the old `PoultrySuite-Africa` repo and
its existing Cloudflare Pages deployment — nothing there is affected by
this repo until you deliberately decide to cut over.

Build this out, test it fully on its own Pages URL, and only point your
real domain at it once you're confident it works.

## What's inside

```
src/             → application source (frontend, unchanged UI/logic)
cloudflare/      → the NEW backend: D1 schema, Worker API, deploy guide
supabase/        → OLD backend reference only, not used — see supabase/LEGACY_README.md
package.json     → dependencies (React 18, Supabase JS client used only for local dev shim, Vite)
vite.config.js   → build config (React + PWA plugin)
index.html       → HTML entry point
.gitignore       → excludes node_modules/, dist/, .env
.env.example     → documents required environment variables (now VITE_API_URL, not Supabase)
```

## First-time setup

```bash
npm install
cp .env.example .env.local
# edit .env.local — set VITE_API_URL once the Worker is deployed (see below)
npm run dev
```

## Backend setup — see `cloudflare/MIGRATION_GUIDE.md` for full detail

Quick version:
```bash
cd cloudflare
npm install -g wrangler
wrangler login
wrangler d1 create poultrysuite-db
# paste the database_id it prints into wrangler.toml
wrangler d1 execute poultrysuite-db --file=migrations/0001_schema.sql
wrangler secret put JWT_SECRET
wrangler secret put PAYSTACK_SECRET_KEY
wrangler deploy
```

This prints your Worker URL — put it in `.env.local` / Cloudflare Pages env
vars as `VITE_API_URL`.

## Frontend deploy (new Cloudflare Pages project)

1. Push this repo to GitHub
2. Cloudflare Dashboard → Pages → **Create a project** → connect this new repo
   (do NOT reuse the old PoultrySuite-Africa Pages project)
3. Build command: `npm run build`, output directory: `dist`
4. Environment variables: `VITE_API_URL` (your Worker URL), `VITE_PAYSTACK_PUBLIC_KEY`
5. Deploy — test on the `*.pages.dev` URL Cloudflare gives you

## Creating your platform admin account

Since this is a fresh D1 database, sign up through the app once deployed,
then grant yourself platform admin:

```bash
wrangler d1 execute poultrysuite-db --command "INSERT INTO platform_admins (user_id, email) SELECT id, email FROM users WHERE email = 'johnpadeola@hotmail.com'"
```

## Known limitations (honest, by design)

- **Password reset doesn't send email yet** — a reset token is generated
  but not delivered. Wire up Resend (already used elsewhere in your stack)
  before relying on this in production.
- **No realtime subscriptions** — not needed for current usage patterns;
  Durable Objects would be the path if needed later.
- **"View as tenant" in the Platform Dashboard** shows a read-only summary,
  not the full live module UI — see the comment in `src/App.jsx`
  (`ViewRouter`) for why.
- **This Worker + shim setup has been read-through audited, not run.** I
  don't currently have a Node environment to actually execute
  `wrangler dev` / `wrangler deploy` myself, so treat first deployment as
  the real test. Report back exactly what happens at each step.

## Still outstanding from the old Supabase version

- "Buy License" button was unresponsive on Supabase due to a CSS transform
  issue; a fix was applied there but never confirmed. Worth retesting once
  this Cloudflare version is stable, since the same frontend code applies.
