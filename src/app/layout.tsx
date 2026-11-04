import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./redesign.css";
import { currentUser } from "@/lib/session";
import { logout } from "@/app/actions";

export const metadata: Metadata = {
  title: "Wishy — Llistes de regals",
  description: "Llistes de regals per compartir en família.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  return <html lang="ca"><body>
    <header className="topbar"><div className="topbar-inner">
      <Link href="/" className="brand"><span className="brand-mark">w</span> wishy</Link>
      <div className="topbar-user">{user && <><span className="user-name">Hola, {user.name}</span><form action={logout}><button className="quiet-button" type="submit">Sortir</button></form></>}</div>
    </div></header>
    <main className="page-shell">{children}</main>
    <footer className="footer">Fet amb estima, per compartir regals.</footer>
  </body></html>;
}
