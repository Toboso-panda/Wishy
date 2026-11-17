import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./christmas.css";
import { currentUser } from "@/lib/session";
import { logout } from "@/app/actions";
import { getLocale } from "@/lib/i18n";
import { LocaleProvider } from "@/components/locale-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export const metadata: Metadata = {
  title: "Wishy — Llistes de regals 🎄",
  description: "Llistes de regals per compartir en família aquestes festes.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  const locale = await getLocale();
  return <html lang={locale}><body>
    <LocaleProvider initialLocale={locale}>
      <header className="topbar"><div className="topbar-inner">
        <Link href="/" className="brand"><span className="brand-mark">w</span> wishy</Link>
        <div className="topbar-user">{user && <><span className="user-name">{locale === "es" ? "Hola" : "Hola"}, {user.name}</span><form action={logout}><button className="quiet-button" type="submit">{locale === "es" ? "Salir" : "Sortir"}</button></form></>}<LanguageSwitcher /></div>
      </div></header>
      <main className="page-shell">{children}</main>
      <footer className="footer">{locale === "es" ? "❄ Hecho con cariño, para compartir regalos ❄" : "❄ Fet amb estima, per compartir regals ❄"}</footer>
    </LocaleProvider>
  </body></html>;
}
