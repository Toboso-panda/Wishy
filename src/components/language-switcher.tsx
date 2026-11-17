"use client";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n-shared";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const options: Locale[] = ["ca", "es"];
  return (
    <div className="language-pill" role="group" aria-label="Idioma">
      {options.map((l) => (
        <button
          key={l}
          type="button"
          className={`language-pill-option${locale === l ? " active" : ""}`}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
