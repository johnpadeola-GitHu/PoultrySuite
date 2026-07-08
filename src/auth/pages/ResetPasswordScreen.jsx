import React, { useState } from 'react';
import { AuthShell, Field, Input, Button, Alert } from './_primitives.jsx';
import { supabase } from '../../lib/supabase/client.js';

// Shown when the URL contains ?reset_token=... (the link from the reset
// email). Lets the user set a new password directly — no sign-in needed,
// since by definition they can't sign in with the password they forgot.
export default function ResetPasswordScreen({ token, onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password, token });
    setBusy(false);
    if (error) { setErr(error.message || 'That reset link is invalid or has expired. Request a new one.'); return; }
    setOk(true);
  };

  if (ok) {
    return (
      <AuthShell>
        <Alert kind="ok">Your password has been reset. You can now sign in with your new password.</Alert>
        <Button onClick={onDone}>Back to sign in</Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Set a new password</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 18 }}>Choose a new password for your account.</div>
      <Alert kind="error">{err}</Alert>
      <form onSubmit={submit}>
        <Field label="New password">
          <Input type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" autoFocus />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" />
        </Field>
        <div style={{ marginTop: 18 }}>
          <Button type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Set new password'}</Button>
        </div>
      </form>
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <Button variant="link" onClick={onDone}>Back to sign in</Button>
      </div>
    </AuthShell>
  );
}
