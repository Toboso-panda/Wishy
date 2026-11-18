"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { logout } from "@/app/actions";
import { useLocale } from "@/components/i18n/locale-provider";
import styles from "./user-menu.module.css";

// Avatar button with a small menu: who is signed in and the option to sign out.
export function UserMenu({ name }: { name: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  return (
    <div className={styles.root} ref={root}>
      <button type="button" className={styles.trigger} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className={styles.avatar} aria-hidden>{name.trim().charAt(0).toUpperCase()}</span>
        <span className={styles.name}>{name}</span>
        <ChevronDown size={16} aria-hidden className={open ? styles.chevronOpen : undefined} />
      </button>
      {open && <div className={styles.menu} role="menu">
        <p className={styles.signedIn}>{t("Has iniciat sessió com a")}<br /><strong>{name}</strong></p>
        <form action={logout}>
          <button className={styles.item} type="submit" role="menuitem"><LogOut size={17} aria-hidden /> {t("Tancar sessió")}</button>
        </form>
      </div>}
    </div>
  );
}
