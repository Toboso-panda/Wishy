"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/shared";
import { translate } from "@/lib/i18n/dictionary";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (text: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `locale=${l}; path=/; max-age=31536000; samesite=lax`;
    // reload to apply server-rendered translations
    window.location.reload();
  }, []);

  const t = useCallback((text: string) => translate(locale, text), [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
