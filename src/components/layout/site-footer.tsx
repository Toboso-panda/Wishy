import { translate } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/shared";
import styles from "./site-footer.module.css";

export function SiteFooter({ locale }: { locale: Locale }) {
  return <footer className={styles.footer}>{translate(locale, "❄ Fet amb estima, per compartir regals ❄")}</footer>;
}
