// ─────────────────────────────────────────────────────────────────────────
// Language context — global state, persistence, useLanguage hook.
// Mirrors the existing CurrencyContext pattern for consistency.
//
// Usage:
//   import { LanguageProvider, useLanguage } from './i18n/LanguageContext.jsx';
//
//   // At the root:
//   <LanguageProvider><App /></LanguageProvider>
//
//   // In any component:
//   const { lang, setLang, t } = useLanguage();
//   <span>{t('common.save')}</span>
// ─────────────────────────────────────────────────────────────────────────

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE, translate } from './translations.js';

const STORAGE_KEY = 'psa::language';

const LanguageContext = createContext(null);

function readPersisted() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (_) {
    return null;
  }
}
function writePersisted(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch (_) {}
}

function resolveInitialLanguage() {
  const persisted = readPersisted();
  if (persisted && LANGUAGES[persisted]) return persisted;
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(resolveInitialLanguage);

  const setLang = useCallback((code) => {
    if (!LANGUAGES[code]) return;
    setLangState(code);
    writePersisted(code);
  }, []);

  const t = useCallback((path, vars) => translate(lang, path, vars), [lang]);

  // Publish to window.__psa so any static/legacy helper outside the React
  // tree (mirrors how currency does this for ngn()/fmtN()) can also read
  // the active language if ever needed.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.__psa) window.__psa = {};
    window.__psa.lang = lang;
    window.__psa.t = t;
  }, [lang, t]);

  const value = { lang, setLang, t, languages: LANGUAGES };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Defensive fallback so a component rendered outside the provider
    // (e.g. during a refactor) degrades to English instead of crashing.
    return { lang: DEFAULT_LANGUAGE, setLang: () => {}, t: (p, vars) => translate(DEFAULT_LANGUAGE, p, vars), languages: LANGUAGES };
  }
  return ctx;
}
