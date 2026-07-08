import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { redeemPairingCode, registerOwnDevice } from './deviceService.js';
import { AuthShell, Field, Input, Button, Alert, T } from '../auth/pages/_primitives.jsx';

// Shown when an authenticated user's device is not yet bound. Offers two paths:
//   • This is my first device → register it directly (if the farm has room)
//   • This is an additional device → enter the pairing code the owner generated
export default function PairingScreen({ onBound, diag, activeFarm }) {
  const { signOut, role } = useAuth();
  const isOwnerLike = role === 'owner';
  const limitReached = !!(diag?.usage && !diag.usage.error && diag.usage.limit > 0 && diag.usage.used >= diag.usage.limit);
  const [mode, setMode] = useState(isOwnerLike && !limitReached ? 'choose' : 'code');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const doOwnDevice = async () => {
    setBusy(true); setErr(null);
    const r = await registerOwnDevice(name);
    setBusy(false);
    if (r.error) setErr(r.error);
    else onBound();
  };

  const doRedeem = async () => {
    if (!code.trim()) { setErr('Enter the pairing code.'); return; }
    setBusy(true); setErr(null);
    const r = await redeemPairingCode(code);
    setBusy(false);
    if (r.error) setErr(r.error);
    else onBound();
  };

  return (
    <AuthShell>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Set up this device</div>
      <div style={{ fontSize: 13, color: T.ink3, marginBottom: 22, lineHeight: 1.5 }}>
        This tablet needs to be registered to your farm before you can use the app.
      </div>
      {limitReached && (
        <Alert kind="error">
          Device limit for your subscription tier has been reached ({diag.usage.used}/{diag.usage.limit}). Please deactivate an existing device in Settings, or upgrade your plan, before adding this one.
        </Alert>
      )}
      <Alert kind="error">{err}</Alert>

      {mode === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Name this device (optional)">
            <Input type="text" value={name} onChange={setName} placeholder="e.g. Office iPad" />
          </Field>
          <Button onClick={doOwnDevice} disabled={busy || limitReached}>
            {busy ? 'Registering…' : limitReached ? 'Device limit reached' : 'Register this as my device'}
          </Button>
          <Button variant="ghost" onClick={() => { setErr(null); setMode('code'); }}>
            I have a pairing code instead
          </Button>
        </div>
      )}

      {mode === 'code' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Pairing code">
            <Input type="text" value={code} onChange={(v) => setCode(v.toUpperCase())} placeholder="FARM-XXXX" />
          </Field>
          <Button onClick={doRedeem} disabled={busy}>
            {busy ? 'Joining…' : 'Join farm'}
          </Button>
          {isOwnerLike && (
            <Button variant="ghost" onClick={() => { setErr(null); setMode('choose'); }}>
              Back
            </Button>
          )}
        </div>
      )}

      <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${T.line}`, textAlign: 'center', fontSize: 12, color: T.ink3 }}>
        <Button variant="link" onClick={signOut}>Sign out</Button>
      </div>
    </AuthShell>
  );
}
