"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { LOCALES } from "@/lib/i18n/shared";
import styles from "./language-switcher.module.css";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className={styles.pill} role="group" aria-label={t("Idioma")}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          className={`${styles.option}${locale === l ? ` ${styles.active}` : ""}`}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
