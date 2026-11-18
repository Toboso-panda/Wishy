import Link from "next/link";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SnowCap } from "@/components/layout/snow-cap";
import { UserMenu } from "@/components/layout/user-menu";
import styles from "./site-header.module.css";

export function SiteHeader({ userName }: { userName?: string }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}><span className={styles.brandMark}>w</span> wishy</Link>
        <div className={styles.actions}>
          <LanguageSwitcher />
          {userName && <><span className={styles.divider} aria-hidden /><UserMenu name={userName} /></>}
        </div>
      </div>
      <SnowCap className={styles.snow} />
    </header>
  );
}
