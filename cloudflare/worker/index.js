// ─────────────────────────────────────────────────────────────────────
// PoultrySuite Africa — Cloudflare Worker API
// ─────────────────────────────────────────────────────────────────────
// Replaces Supabase (auth + PostgREST + RPCs) with a single Worker
// backed by Cloudflare D1.
//
// Routes:
//   POST /auth/signup           → create user
//   POST /auth/signin           → email+password login → JWT
//   POST /auth/signout          → (no-op, stateless JWT)
//   POST /auth/reset-password   → generate reset token
//   POST /auth/update-password  → consume reset token
//   GET  /auth/me               → current user from JWT
//
//   GET    /api/profiles/:id
//   GET    /api/farm-members?user_id=
//   GET    /api/farms/:id
//
//   POST   /api/devices/register-own
//   POST   /api/devices/create-pairing-code
//   POST   /api/devices/redeem-pairing-code
//   POST   /api/devices/touch
//   GET    /api/devices/usage
//   GET    /api/devices?farm_id=
//   PUT    /api/devices/:id/revoke
//
//   GET    /api/batches?farm_id=
//   PUT    /api/batches
//   DELETE /api/batches/:id?farm_id=
//
//   GET    /api/records?farm_id=&collection=
//   PUT    /api/records
//   DELETE /api/records?farm_id=&collection=&record_id=
//
//   GET    /api/plans
//   POST   /api/billing/create-intent
//   GET    /api/subscriptions?farm_id=
//   POST   /api/paystack-webhook        (no auth, HMAC verified)
//
//   GET    /api/platform/stats
//   GET    /api/platform/tenants
//   GET    /api/platform/subscriptions
//   GET    /api/platform/tickets
//   PUT    /api/platform/tickets/:id
//   POST   /api/platform/tickets
//
//   GET    /api/platform/is-admin
// ─────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS
    if (method === 'OPTIONS') return corsResponse(env, request);
    const corsHeaders = corsBase(env, request);

    try {
      // ── Auth routes (no JWT required) ──
      if (path === '/auth/signup' && method === 'POST')
        return json(await authSignUp(env, await request.json()), corsHeaders);
      if (path === '/auth/signin' && method === 'POST')
        return json(await authSignIn(env, await request.json()), corsHeaders);
      if (path === '/auth/signout' && method === 'POST')
        return json({ ok: true }, corsHeaders);
      if (path === '/auth/reset-password' && method === 'POST')
        return json(await authResetPassword(env, await request.json()), corsHeaders);
      if (path === '/auth/update-password' && method === 'POST')
        return json(await authUpdatePassword(env, await request.json()), corsHeaders);

      // ── Paystack webhook (no JWT, HMAC verified) ──
      if (path === '/api/paystack-webhook' && method === 'POST')
        return json(await paystackWebhook(env, request), corsHeaders);

      // ── Plans (public — visible before signup, e.g. a pricing page) ──
      if (path === '/api/plans' && method === 'GET') {
        const rows = await env.DB.prepare('SELECT * FROM plans WHERE is_active = 1 ORDER BY display_order').all();
        return json({ data: rows.results }, corsHeaders);
      }

      // ── All other routes require a valid JWT ──
      const user = await verifyJWT(request, env);
      if (!user) return json({ error: 'Unauthorized' }, corsHeaders, 401);

      // Auth
      if (path === '/auth/me' && method === 'GET')
        return json({ user }, corsHeaders);

      // Profiles
      if (path.startsWith('/api/profiles/') && method === 'GET') {
        const id = path.split('/')[3];
        const row = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first();
        return json({ data: row }, corsHeaders);
      }

      // Farm members
      if (path === '/api/farm-members' && method === 'GET') {
        const userId = url.searchParams.get('user_id');
        const rows = await env.DB.prepare(
          `SELECT fm.role, f.id as f_id, f.name as f_name, f.created_at as f_created_at
           FROM farm_members fm JOIN farms f ON f.id = fm.farm_id
           WHERE fm.user_id = ?`
        ).bind(userId).all();
        // Nest farm data to match the shape the frontend expects (mirrors
        // the old Supabase embed syntax `.select('role, farm:farms(*)')`).
        const data = rows.results.map(r => ({
          role: r.role,
          farm: { id: r.f_id, name: r.f_name, created_at: r.f_created_at },
        }));
        return json({ data }, corsHeaders);
      }

      // Devices
      if (path === '/api/devices/register-own' && method === 'POST')
        return json(await registerOwnDevice(env, user, await request.json()), corsHeaders);
      if (path === '/api/devices/create-pairing-code' && method === 'POST')
        return json(await createPairingCode(env, user, await request.json()), corsHeaders);
      if (path === '/api/devices/redeem-pairing-code' && method === 'POST')
        return json(await redeemPairingCode(env, user, await request.json()), corsHeaders);
      if (path === '/api/devices/touch' && method === 'POST')
        return json(await touchDevice(env, await request.json()), corsHeaders);
      if (path === '/api/devices/usage' && method === 'GET')
        return json(await farmDeviceUsage(env, user), corsHeaders);
      if (path === '/api/devices' && method === 'GET') {
        const farmId = url.searchParams.get('farm_id');
        const rows = await env.DB.prepare(
          'SELECT id, name, platform, last_seen_at, revoked, created_at FROM devices WHERE farm_id = ? AND revoked = 0 ORDER BY created_at'
        ).bind(farmId).all();
        return json({ data: rows.results }, corsHeaders);
      }
      if (path.match(/^\/api\/devices\/[^/]+\/revoke$/) && method === 'PUT') {
        const id = path.split('/')[3];
        await env.DB.prepare('UPDATE devices SET revoked = 1 WHERE id = ?').bind(id).run();
        return json({ ok: true }, corsHeaders);
      }

      // Batches
      if (path === '/api/batches' && method === 'GET') {
        const farmId = url.searchParams.get('farm_id');
        const rows = await env.DB.prepare(
          'SELECT * FROM batches WHERE farm_id = ? AND deleted = 0 ORDER BY start_date'
        ).bind(farmId).all();
        return json({ data: rows.results }, corsHeaders);
      }
      if (path === '/api/batches' && method === 'PUT') {
        const row = await request.json();
        await env.DB.prepare(
          `INSERT INTO batches (id,farm_id,house_id,name,breed,source,type,initial_count,current_count,start_date,status,notes,deleted,updated_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,datetime('now'))
           ON CONFLICT(farm_id,id) DO UPDATE SET house_id=?3,name=?4,breed=?5,source=?6,type=?7,initial_count=?8,current_count=?9,start_date=?10,status=?11,notes=?12,deleted=?13,updated_at=datetime('now')`
        ).bind(row.id,row.farm_id,row.house_id,row.name,row.breed,row.source,row.type,row.initial_count,row.current_count,row.start_date,row.status,row.notes,row.deleted?1:0).run();
        return json({ ok: true }, corsHeaders);
      }
      if (path.startsWith('/api/batches/') && method === 'DELETE') {
        const id = path.split('/')[3];
        const farmId = url.searchParams.get('farm_id');
        await env.DB.prepare("UPDATE batches SET deleted = 1, updated_at = datetime('now') WHERE farm_id = ? AND id = ?").bind(farmId, id).run();
        return json({ ok: true }, corsHeaders);
      }

      // Farm records (generic collection sync)
      if (path === '/api/records' && method === 'GET') {
        const farmId = url.searchParams.get('farm_id');
        const collection = url.searchParams.get('collection');
        const rows = await env.DB.prepare(
          'SELECT data FROM farm_records WHERE farm_id = ? AND collection = ? AND deleted = 0'
        ).bind(farmId, collection).all();
        return json({ data: rows.results.map(r => JSON.parse(r.data)) }, corsHeaders);
      }
      if (path === '/api/records' && method === 'PUT') {
        const row = await request.json();
        await env.DB.prepare(
          `INSERT INTO farm_records (farm_id,collection,record_id,data,deleted,updated_at)
           VALUES (?1,?2,?3,?4,0,datetime('now'))
           ON CONFLICT(farm_id,collection,record_id) DO UPDATE SET data=?4,deleted=0,updated_at=datetime('now')`
        ).bind(row.farm_id, row.collection, row.record_id, JSON.stringify(row.data)).run();
        return json({ ok: true }, corsHeaders);
      }
      if (path === '/api/records' && method === 'DELETE') {
        const farmId = url.searchParams.get('farm_id');
        const collection = url.searchParams.get('collection');
        const recordId = url.searchParams.get('record_id');
        await env.DB.prepare(
          "UPDATE farm_records SET deleted = 1, updated_at = datetime('now') WHERE farm_id = ? AND collection = ? AND record_id = ?"
        ).bind(farmId, collection, recordId).run();
        return json({ ok: true }, corsHeaders);
      }

      // Billing
      if (path === '/api/billing/create-intent' && method === 'POST')
        return json(await createPaymentIntent(env, user, await request.json()), corsHeaders);
      if (path === '/api/subscriptions' && method === 'GET') {
        const farmId = url.searchParams.get('farm_id');
        const rows = await env.DB.prepare('SELECT * FROM subscriptions WHERE farm_id = ?').bind(farmId).all();
        return json({ data: rows.results }, corsHeaders);
      }

      // Platform admin
      if (path === '/api/platform/is-admin' && method === 'GET')
        return json({ isAdmin: await isPlatformAdmin(env, user.id) }, corsHeaders);
      if (path === '/api/platform/stats' && method === 'GET') {
        if (!await isPlatformAdmin(env, user.id)) return json({ error: 'Forbidden' }, corsHeaders, 403);
        return json(await platformStats(env), corsHeaders);
      }
      if (path === '/api/platform/tenants' && method === 'GET') {
        if (!await isPlatformAdmin(env, user.id)) return json({ error: 'Forbidden' }, corsHeaders, 403);
        return json(await platformTenants(env), corsHeaders);
      }
      if (path === '/api/platform/subscriptions' && method === 'GET') {
        if (!await isPlatformAdmin(env, user.id)) return json({ error: 'Forbidden' }, corsHeaders, 403);
        const rows = await env.DB.prepare(
          `SELECT s.*, f.name as farm_name, p.name as plan_name, p.tier as plan_tier, p.annual_price_minor
           FROM subscriptions s
           LEFT JOIN farms f ON f.id = s.farm_id
           LEFT JOIN plans p ON p.id = s.plan_id
           ORDER BY s.period_end`
        ).all();
        // Nest farm/plan to match what the dashboard UI expects (mirrors
        // the same fix applied to /api/farm-members).
        const data = rows.results.map(r => ({
          id: r.id, farm_id: r.farm_id, plan_id: r.plan_id, status: r.status,
          period_start: r.period_start, period_end: r.period_end,
          farm: { name: r.farm_name },
          plan: { name: r.plan_name, tier: r.plan_tier, annual_price_minor: r.annual_price_minor },
        }));
        return json({ data }, corsHeaders);
      }
      if (path === '/api/platform/tickets' && method === 'GET') {
        if (!await isPlatformAdmin(env, user.id)) return json({ error: 'Forbidden' }, corsHeaders, 403);
        const status = url.searchParams.get('status');
        let sql = 'SELECT t.*, f.name as farm_name FROM support_tickets t LEFT JOIN farms f ON f.id = t.farm_id';
        const params = [];
        if (status) { sql += ' WHERE t.status = ?'; params.push(status); }
        sql += ' ORDER BY t.created_at DESC';
        const rows = await env.DB.prepare(sql).bind(...params).all();
        return json({ data: rows.results }, corsHeaders);
      }
      if (path.match(/^\/api\/platform\/tickets\/[^/]+$/) && method === 'PUT') {
        if (!await isPlatformAdmin(env, user.id)) return json({ error: 'Forbidden' }, corsHeaders, 403);
        const id = path.split('/')[4];
        const patch = await request.json();
        const sets = []; const vals = [];
        if (patch.status) { sets.push('status = ?'); vals.push(patch.status); }
        if (patch.resolved_at !== undefined) { sets.push('resolved_at = ?'); vals.push(patch.resolved_at); }
        sets.push("updated_at = datetime('now')");
        vals.push(id);
        await env.DB.prepare(`UPDATE support_tickets SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
        return json({ ok: true }, corsHeaders);
      }
      if (path === '/api/platform/tickets' && method === 'POST') {
        const body = await request.json();
        const id = uid();
        await env.DB.prepare(
          'INSERT INTO support_tickets (id, farm_id, raised_by, subject, description, priority) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, body.farm_id, user.id, body.subject, body.description || null, body.priority || 'normal').run();
        return json({ ok: true, id }, corsHeaders);
      }

      return json({ error: 'Not found' }, corsHeaders, 404);
    } catch (err) {
      console.error('[Worker error]', err.stack || err);
      return json({ error: err.message || 'Internal error' }, corsHeaders, 500);
    }
  }
};

// ── Helpers ──────────────────────────────────────────────────────────

function uid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Allowed origins: local dev + production. Add more here if you test from
// other URLs (e.g. a Cloudflare Pages preview URL).
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://poultrysuite.agorox.africa',
  'https://poultrysuite.pages.dev',
];

function resolveOrigin(request, env) {
  const origin = request?.headers?.get('Origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return env.CORS_ORIGIN || ALLOWED_ORIGINS[0];
}

function corsBase(env, request) {
  return {
    'Access-Control-Allow-Origin': resolveOrigin(request, env),
    'Access-Control-Allow-Credentials': 'true',
  };
}

function corsResponse(env, request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': resolveOrigin(request, env),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// ── Auth ─────────────────────────────────────────────────────────────

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyData = enc.encode(password + salt);
  const hash = await crypto.subtle.digest('SHA-256', keyData);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createJWT(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 })).replace(/=/g, '');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(header + '.' + body));
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return header + '.' + body + '.' + sigStr;
}

async function verifyJWT(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBuf = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(parts[0] + '.' + parts[1]));
    if (!valid) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: payload.sub, email: payload.email };
  } catch (_) {
    return null;
  }
}

async function authSignUp(env, { email, password }) {
  if (!email || !password) return { error: 'Email and password required' };
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return { error: 'User already exists' };
  const id = uid();
  const salt = uid();
  const hash = await hashPassword(password, salt);
  await env.DB.prepare('INSERT INTO users (id, email, password_hash, salt) VALUES (?, ?, ?, ?)').bind(id, email, hash, salt).run();

  // Auto-provision: every new user gets their own farm as owner, matching
  // the trigger the old Supabase setup had. Without this, sign-up succeeds
  // but the user has no farm and gets stuck on the device-pairing screen.
  const farmId = uid();
  const farmName = (email.split('@')[0] || 'New Farm') + "'s Farm";
  await env.DB.prepare('INSERT INTO farms (id, name) VALUES (?, ?)').bind(farmId, farmName).run();
  await env.DB.prepare('INSERT INTO farm_members (id, farm_id, user_id, role) VALUES (?, ?, ?, ?)').bind(uid(), farmId, id, 'owner').run();
  await env.DB.prepare('INSERT INTO profiles (id, active_farm_id) VALUES (?, ?)').bind(id, farmId).run();

  const token = await createJWT({ sub: id, email }, env.JWT_SECRET);
  return { user: { id, email }, token };
}

async function authSignIn(env, { email, password }) {
  if (!email || !password) return { error: 'Email and password required' };
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').bind(email).first();
  if (!user) return { error: 'Invalid credentials' };
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) return { error: 'Invalid credentials' };
  await env.DB.prepare("UPDATE users SET last_sign_in = datetime('now') WHERE id = ?").bind(user.id).run();
  const token = await createJWT({ sub: user.id, email: user.email }, env.JWT_SECRET);
  return { user: { id: user.id, email: user.email }, token };
}

async function authResetPassword(env, { email }) {
  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').bind(email).first();
  if (!user) return { ok: true }; // Don't reveal if user exists
  const resetToken = uid();
  const expires = new Date(Date.now() + 3600000).toISOString();
  await env.DB.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?').bind(resetToken, expires, user.id).run();
  // TODO: send email with reset link containing resetToken
  // For now, the token is stored but no email is sent — integrate with Resend later
  return { ok: true };
}

async function authUpdatePassword(env, { token, password }) {
  if (!token || !password) return { error: 'Token and password required' };
  const user = await env.DB.prepare("SELECT id FROM users WHERE reset_token = ? AND reset_expires > datetime('now')").bind(token).first();
  if (!user) return { error: 'Invalid or expired reset token' };
  const salt = uid();
  const hash = await hashPassword(password, salt);
  await env.DB.prepare('UPDATE users SET password_hash = ?, salt = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?').bind(hash, salt, user.id).run();
  return { ok: true };
}

// ── Devices ──────────────────────────────────────────────────────────

async function registerOwnDevice(env, user, { p_name, p_platform }) {
  const membership = await env.DB.prepare('SELECT farm_id FROM farm_members WHERE user_id = ?').bind(user.id).first();
  if (!membership) return { error: 'No farm membership' };
  const farmId = membership.farm_id;
  const id = uid();
  const token = uid();
  await env.DB.prepare(
    "INSERT INTO devices (id, farm_id, name, device_token, platform, registered_by, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
  ).bind(id, farmId, p_name || 'Device', token, p_platform || 'web', user.id).run();
  return { device_token: token, device_name: p_name || 'Device' };
}

async function createPairingCode(env, user, { p_device_name }) {
  const membership = await env.DB.prepare('SELECT farm_id FROM farm_members WHERE user_id = ?').bind(user.id).first();
  if (!membership) return { error: 'No farm membership' };
  const id = uid();
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
  await env.DB.prepare(
    'INSERT INTO pairing_codes (id, farm_id, code, device_name, created_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, membership.farm_id, code, p_device_name || 'New device', user.id, expiresAt).run();
  return { out_code: code, out_expires_at: expiresAt };
}

async function redeemPairingCode(env, user, { p_code, p_platform }) {
  const pc = await env.DB.prepare(
    "SELECT * FROM pairing_codes WHERE code = ? AND redeemed = 0 AND expires_at > datetime('now')"
  ).bind(p_code.trim().toUpperCase()).first();
  if (!pc) return { error: 'Invalid or expired pairing code' };
  const devId = uid();
  const token = uid();
  await env.DB.prepare(
    "INSERT INTO devices (id, farm_id, name, device_token, platform, registered_by, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
  ).bind(devId, pc.farm_id, pc.device_name, token, p_platform || 'web', user.id).run();
  await env.DB.prepare('UPDATE pairing_codes SET redeemed = 1 WHERE id = ?').bind(pc.id).run();
  // Also add user as farm member if not already
  const existing = await env.DB.prepare('SELECT id FROM farm_members WHERE farm_id = ? AND user_id = ?').bind(pc.farm_id, user.id).first();
  if (!existing) {
    await env.DB.prepare("INSERT INTO farm_members (id, farm_id, user_id, role) VALUES (?, ?, ?, 'member')").bind(uid(), pc.farm_id, user.id).run();
  }
  return { device_token: token, farm_id: pc.farm_id, device_name: pc.device_name };
}

async function touchDevice(env, { p_token }) {
  if (!p_token) return { ok: true };
  await env.DB.prepare("UPDATE devices SET last_seen_at = datetime('now') WHERE device_token = ? AND revoked = 0").bind(p_token).run();
  return { ok: true };
}

async function farmDeviceUsage(env, user) {
  const membership = await env.DB.prepare('SELECT farm_id FROM farm_members WHERE user_id = ?').bind(user.id).first();
  if (!membership) return { device_limit: 0, device_used: 0 };
  const sub = await env.DB.prepare(
    `SELECT s.max_devices_override, p.max_devices
     FROM subscriptions s JOIN plans p ON p.id = s.plan_id
     WHERE s.farm_id = ? ORDER BY s.created_at DESC LIMIT 1`
  ).bind(membership.farm_id).first();
  const limit = sub?.max_devices_override || sub?.max_devices || 2;
  const used = await env.DB.prepare('SELECT COUNT(*) as c FROM devices WHERE farm_id = ? AND revoked = 0').bind(membership.farm_id).first();
  return { device_limit: limit, device_used: used?.c || 0 };
}

// ── Billing ──────────────────────────────────────────────────────────

async function createPaymentIntent(env, user, { p_plan_tier }) {
  const plan = await env.DB.prepare('SELECT * FROM plans WHERE tier = ? AND is_active = 1').bind(p_plan_tier).first();
  if (!plan) return { error: 'Plan not found' };
  const membership = await env.DB.prepare('SELECT farm_id FROM farm_members WHERE user_id = ?').bind(user.id).first();
  if (!membership) return { error: 'No farm' };
  const ref = 'PSA-' + uid().slice(0, 12).toUpperCase();
  const id = uid();
  await env.DB.prepare(
    'INSERT INTO payments (id, farm_id, plan_tier, amount_minor, currency, reference, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, membership.farm_id, plan.tier, plan.annual_price_minor, plan.currency_code, ref, user.email, 'pending').run();
  return { reference: ref, amount: plan.annual_price_minor, email: user.email };
}

async function paystackWebhook(env, request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';
  if (!env.PAYSTACK_SECRET_KEY) return { error: 'Paystack not configured' };

  // Verify HMAC-SHA512
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(env.PAYSTACK_SECRET_KEY), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
  if (hex !== signature) return { error: 'Invalid signature' };

  const event = JSON.parse(rawBody);
  if (event?.event !== 'charge.success') return { ok: true };
  const reference = event?.data?.reference;
  if (!reference) return { error: 'No reference' };

  const payment = await env.DB.prepare('SELECT * FROM payments WHERE reference = ?').bind(reference).first();
  if (!payment) return { error: 'Payment not found' };

  // Activate subscription
  await env.DB.prepare("UPDATE payments SET status = 'success' WHERE id = ?").bind(payment.id).run();

  const plan = await env.DB.prepare('SELECT * FROM plans WHERE tier = ?').bind(payment.plan_tier).first();
  const now = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 365 * 86400000).toISOString();
  const subId = uid();
  await env.DB.prepare(
    `INSERT INTO subscriptions (id, farm_id, plan_id, status, period_start, period_end)
     VALUES (?, ?, ?, 'active', ?, ?)
     ON CONFLICT(id) DO UPDATE SET status='active', period_start=?, period_end=?, updated_at=datetime('now')`
  ).bind(subId, payment.farm_id, plan.id, now, periodEnd, now, periodEnd).run();

  return { ok: true, reference };
}

// ── Platform ─────────────────────────────────────────────────────────

async function isPlatformAdmin(env, userId) {
  const row = await env.DB.prepare('SELECT user_id FROM platform_admins WHERE user_id = ?').bind(userId).first();
  return !!row;
}

async function platformStats(env) {
  const stats = {};
  stats.total_tenants = (await env.DB.prepare('SELECT COUNT(*) as c FROM farms').first())?.c || 0;
  stats.active_subscriptions = (await env.DB.prepare("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'active'").first())?.c || 0;
  stats.trial_tenants = (await env.DB.prepare("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'trialing'").first())?.c || 0;
  stats.at_risk_tenants = (await env.DB.prepare("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'active' AND period_end < datetime('now', '+7 days')").first())?.c || 0;
  stats.open_tickets = (await env.DB.prepare("SELECT COUNT(*) as c FROM support_tickets WHERE status IN ('open','in_progress')").first())?.c || 0;
  const mrr = await env.DB.prepare(
    "SELECT COALESCE(SUM(p.annual_price_minor) / 12, 0) as v FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.status = 'active'"
  ).first();
  stats.mrr_minor = mrr?.v || 0;
  return { stats };
}

async function platformTenants(env) {
  const rows = await env.DB.prepare(
    `SELECT f.id as farm_id, f.name as farm_name, f.created_at as farm_created_at,
            p.tier as plan_tier, p.name as plan_name,
            s.status as subscription_status, s.period_end as subscription_period_end,
            (SELECT COUNT(*) FROM farm_members fm WHERE fm.farm_id = f.id) as member_count,
            (SELECT COUNT(*) FROM devices d WHERE d.farm_id = f.id AND d.revoked = 0) as device_count,
            (SELECT COUNT(*) FROM support_tickets t WHERE t.farm_id = f.id AND t.status IN ('open','in_progress')) as open_tickets
     FROM farms f
     LEFT JOIN subscriptions s ON s.farm_id = f.id
     LEFT JOIN plans p ON p.id = s.plan_id`
  ).all();
  return { data: rows.results };
}
