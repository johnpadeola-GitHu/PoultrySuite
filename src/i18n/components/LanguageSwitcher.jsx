// ─────────────────────────────────────────────────────────────────────────
// <LanguageSwitcher> — compact dropdown for the app header, styled to match
// the existing CurrencySwitcher. Only two options (English/Français), so
// this stays a simple toggle-style dropdown rather than the full
// searchable list the currency switcher needs.
// ─────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../LanguageContext.jsx';

const STYLES = {
  wrap: { position: 'relative', display: 'inline-block' },
  trigger: {
    height: 32,
    padding: '0 10px',
    background: '#F3F4F6',
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  caret: { color: '#9CA3AF', fontSize: 10 },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    width: 160,
    background: '#fff',
    border: '1px solid #D1D5DB',
    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
    zIndex: 9100,
  },
  option: {
    width: '100%',
    padding: '9px 12px',
    background: 'transparent',
    border: 'none',
    borderTop: '1px solid #F3F4F6',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    color: '#111827',
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
  },
};

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const current = languages[lang] || languages.en;
  const list = Object.values(languages);

  return (
    <div ref={ref} style={STYLES.wrap}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={STYLES.trigger} title="Language / Langue">
        <span>{lang.toUpperCase()}</span>
        <span style={STYLES.caret}>▾</span>
      </button>
      {open && (
        <div style={STYLES.panel}>
          {list.map((l, i) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLang(l.code); setOpen(false); }}
              style={{ ...STYLES.option, borderTop: i === 0 ? 'none' : STYLES.option.borderTop, fontWeight: l.code === lang ? 700 : 500, color: l.code === lang ? '#0f5540' : '#111827' }}
            >
              <span>{l.nativeLabel}</span>
              {l.code === lang && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
