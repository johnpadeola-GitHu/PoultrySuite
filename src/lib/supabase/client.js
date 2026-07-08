// ─────────────────────────────────────────────────────────────────────
// API client — replaces Supabase with Cloudflare Workers + D1
// ─────────────────────────────────────────────────────────────────────
// Drop-in replacement: every function the app called on `supabase` is
// now a fetch to the Worker API. The `supabase` export is a
// compatibility shim so existing code (`supabase.from(...)`,
// `supabase.rpc(...)`, `supabase.auth.*`) keeps working with minimal
// changes to each service file.
// ─────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'psa::auth_token';

export const isSupabaseConfigured = !!API_URL;
// Keep the old name so existing `if (!isSupabaseConfigured)` checks still work.

function getToken() {
  try { return window.localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
}
function setToken(token) {
  try { if (token) window.localStorage.setItem(TOKEN_KEY, token); else window.localStorage.removeItem(TOKEN_KEY); } catch (_) {}
}

async function apiFetch(path, { method = 'GET', body, noAuth } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (!noAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(API_URL + path, opts);
  const data = await res.json();
  if (!res.ok && !data.error) data.error = `HTTP ${res.status}`;
  return data;
}

// ── Auth shim ────────────────────────────────────────────────────────
// Mirrors Supabase's auth API shape so AuthProvider/AuthGate work
// with minimal changes.

let _authStateListeners = [];
let _currentUser = null;

function _notifyAuthChange(event, session) {
  _authStateListeners.forEach(fn => {
    try { fn(event, session); } catch (_) {}
  });
}

function _sessionFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    _currentUser = { id: payload.sub, email: payload.email };
    return { access_token: token, user: _currentUser };
  } catch (_) {
    return null;
  }
}

const auth = {
  async signUp({ email, password }) {
    const res = await apiFetch('/auth/signup', { method: 'POST', body: { email, password }, noAuth: true });
    if (res.error) return { data: {}, error: { message: res.error } };
    setToken(res.token);
    const session = _sessionFromToken(res.token);
    _notifyAuthChange('SIGNED_IN', session);
    return { data: { user: res.user, session }, error: null };
  },
  async signInWithPassword({ email, password }) {
    const res = await apiFetch('/auth/signin', { method: 'POST', body: { email, password }, noAuth: true });
    if (res.error) return { data: {}, error: { message: res.error } };
    setToken(res.token);
    const session = _sessionFromToken(res.token);
    _notifyAuthChange('SIGNED_IN', session);
    return { data: { user: res.user, session }, error: null };
  },
  async signOut() {
    setToken(null);
    _currentUser = null;
    _notifyAuthChange('SIGNED_OUT', null);
    return { error: null };
  },
  async resetPasswordForEmail(email) {
    const res = await apiFetch('/auth/reset-password', { method: 'POST', body: { email }, noAuth: true });
    return { error: res.error ? { message: res.error } : null };
  },
  // token comes from the reset-link URL (?reset_token=...), read by
  // ResetPasswordScreen and passed straight through here.
  async updateUser({ password, token }) {
    if (!token) return { error: { message: 'Missing reset token' } };
    const res = await apiFetch('/auth/update-password', { method: 'POST', body: { token, password }, noAuth: true });
    return { error: res.error ? { message: res.error } : null };
  },
  async getSession() {
    const token = getToken();
    const session = _sessionFromToken(token);
    return { data: { session }, error: null };
  },
  async getUser() {
    const token = getToken();
    if (!token) return { data: { user: null }, error: null };
    const session = _sessionFromToken(token);
    return { data: { user: session?.user || null }, error: null };
  },
  onAuthStateChange(callback) {
    _authStateListeners.push(callback);
    // Immediately fire with current state
    const token = getToken();
    const session = _sessionFromToken(token);
    if (session) callback('INITIAL_SESSION', session);
    return { data: { subscription: { unsubscribe: () => { _authStateListeners = _authStateListeners.filter(fn => fn !== callback); } } } };
  }
};

// ── Query builder shim ───────────────────────────────────────────────
// Replaces supabase.from('table').select(...).eq(...) etc.
// This is a simplified shim that covers the patterns actually used in
// the PoultrySuite codebase.

function createQueryBuilder(table) {
  let _method = 'GET';
  let _path = '';
  let _body = null;
  let _params = new URLSearchParams();
  let _selectCols = '*';

  const builder = {
    select(cols) { _selectCols = cols || '*'; return builder; },
    eq(col, val) { _params.set(col, val); return builder; },
    order(col, opts) { _params.set('_order', col); return builder; },
    maybeSingle() { builder._single = true; return builder; },

    insert(data) {
      _method = 'POST';
      _body = data;
      return builder;
    },
    upsert(data, opts) {
      _method = 'PUT';
      _body = data;
      return builder;
    },
    update(data) {
      _method = 'PATCH';
      _body = data;
      return builder;
    },

    async then(resolve) {
      // Map table names to API paths
      const tableMap = {
        'profiles': '/api/profiles',
        'farm_members': '/api/farm-members',
        'farms': '/api/farms',
        'devices': '/api/devices',
        'batches': '/api/batches',
        'farm_records': '/api/records',
        'plans': '/api/plans',
        'subscriptions': '/api/subscriptions',
        'support_tickets': '/api/platform/tickets',
      };

      let path = tableMap[table] || `/api/${table}`;

      // Special handling per table based on actual usage patterns
      if (table === 'profiles' && _params.get('id')) {
        path = `/api/profiles/${_params.get('id')}`;
        _params.delete('id');
      }

      if (table === 'devices' && _method === 'PATCH' && _params.get('id')) {
        path = `/api/devices/${_params.get('id')}/revoke`;
        _method = 'PUT';
        _params.delete('id');
      }

      if (table === 'support_tickets' && _method === 'PATCH' && _params.get('id')) {
        // updateTicket() calls .update({...}).eq('id', ticketId) — the
        // Worker route is PUT /api/platform/tickets/:id, not a query param,
        // so this never actually reached a valid route before.
        path = `/api/platform/tickets/${_params.get('id')}`;
        _method = 'PUT';
        _params.delete('id');
      }

      if (table === 'batches' && _method === 'PUT') {
        path = '/api/batches';
      }

      if (table === 'batches' && _method === 'PATCH') {
        // soft-delete via update({deleted:true})
        const batchId = _params.get('id');
        const farmId = _params.get('farm_id');
        path = `/api/batches/${batchId}?farm_id=${farmId}`;
        _method = 'DELETE';
        _body = null;
        _params = new URLSearchParams();
      }

      if (table === 'farm_records' && _method === 'PATCH') {
        // soft-delete via update({deleted:true})
        const farmId = _params.get('farm_id');
        const collection = _params.get('collection');
        const recordId = _params.get('record_id');
        path = `/api/records?farm_id=${farmId}&collection=${collection}&record_id=${recordId}`;
        _method = 'DELETE';
        _body = null;
        _params = new URLSearchParams();
      }

      const qs = _params.toString();
      const fullPath = path + (qs ? (path.includes('?') ? '&' : '?') + qs : '');

      try {
        const opts = { method: _method === 'PATCH' ? 'PUT' : _method };
        if (_body) opts.body = _body;
        const result = await apiFetch(fullPath, opts);
        if (result.error) {
          resolve({ data: null, error: { message: result.error } });
        } else {
          const data = result.data !== undefined ? result.data : result;
          resolve({ data: builder._single ? (Array.isArray(data) ? data[0] || null : data) : data, error: null });
        }
      } catch (err) {
        resolve({ data: null, error: { message: err.message } });
      }
    }
  };

  return builder;
}

// ── RPC shim ─────────────────────────────────────────────────────────

const rpcMap = {
  'is_platform_admin': { method: 'GET', path: '/api/platform/is-admin', extract: r => r.isAdmin },
  'platform_overview_stats': { method: 'GET', path: '/api/platform/stats', extract: r => r.stats },
  'platform_list_tenants': { method: 'GET', path: '/api/platform/tenants', extract: r => r.data },
  'platform_list_subscriptions': { method: 'GET', path: '/api/platform/subscriptions', extract: r => r.data },
  'register_own_device': { method: 'POST', path: '/api/devices/register-own' },
  'redeem_pairing_code': { method: 'POST', path: '/api/devices/redeem-pairing-code' },
  'create_pairing_code': { method: 'POST', path: '/api/devices/create-pairing-code' },
  'farm_device_usage': { method: 'GET', path: '/api/devices/usage' },
  'touch_device': { method: 'POST', path: '/api/devices/touch' },
  'create_payment_intent': { method: 'POST', path: '/api/billing/create-intent' },
};

async function rpc(name, params) {
  const spec = rpcMap[name];
  if (!spec) return { data: null, error: { message: `Unknown RPC: ${name}` } };
  try {
    const result = await apiFetch(spec.path, {
      method: spec.method,
      body: spec.method !== 'GET' ? params : undefined,
    });
    if (result.error) return { data: null, error: { message: result.error } };
    const data = spec.extract ? spec.extract(result) : result;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

// Farm-level license snapshot — lets a fresh device/session restore an
// already-activated license without repeating onboarding. Kept as direct
// functions rather than forced into the generic rpcMap pattern, since the
// farm ID needs to be embedded in the URL path, not sent as a body/query
// param the way other RPCs work.
export async function getLicenseSnapshot(farmId) {
  const res = await apiFetch(`/api/farms/${farmId}/license-snapshot`, { method: 'GET' });
  if (res.error) return { data: null, error: res.error };
  return { data: res.data, error: null };
}
export async function saveLicenseSnapshot(farmId, snapshot) {
  const res = await apiFetch(`/api/farms/${farmId}/license-snapshot`, { method: 'PUT', body: snapshot });
  return { error: res.error || null };
}

// ── Exported shim ────────────────────────────────────────────────────

export const supabase = {
  auth,
  from: (table) => createQueryBuilder(table),
  rpc: (name, params) => rpc(name, params),
};

export function requireSupabase() {
  if (!API_URL) throw new Error('API not configured. Set VITE_API_URL.');
}
