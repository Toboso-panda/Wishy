import "server-only";

export type { Locale } from "./shared";
export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_LABELS, isLocale } from "./shared";
import type { Locale } from "./shared";
import { cookies } from "next/headers";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("locale")?.value;
  return value === "es" ? "es" : "ca";
}
