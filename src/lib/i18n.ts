import "server-only";

export type { Locale } from "./i18n-shared";
export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_LABELS, isLocale } from "./i18n-shared";
import type { Locale } from "./i18n-shared";
import { cookies } from "next/headers";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("locale")?.value;
  return value === "es" ? "es" : "ca";
}
