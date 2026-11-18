export type Locale = "ca" | "es";
export const LOCALES: Locale[] = ["ca", "es"];
export const DEFAULT_LOCALE: Locale = "ca";
export const LOCALE_COOKIE = "locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  ca: "Català",
  es: "Castellano",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ca" || value === "es";
}
