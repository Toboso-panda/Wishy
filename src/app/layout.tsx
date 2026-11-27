import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import "./christmas.css";
import { currentUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n";
import { translate } from "@/lib/i18n/dictionary";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// Headings: a soft, rounded serif. Body: a friendly rounded sans-serif.
const headingFont = Fraunces({ subsets: ["latin"], axes: ["SOFT", "opsz"], variable: "--font-fraunces", display: "swap" });
const bodyFont = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

// Wishy only has a light theme. Saying so stops phone browsers in night mode from darkening
// the page on their own (they turned the white snow black).
export const viewport: Viewport = { colorScheme: "only light" };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "Wishy — Llistes de regals 🎄"),
    description: translate(locale, "Llistes de regals per compartir en família aquestes festes."),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  const locale = await getLocale();
  return <html lang={locale} className={`${headingFont.variable} ${bodyFont.variable}`}><body>
    <LocaleProvider initialLocale={locale}>
      <SiteHeader userName={user?.name} />
      <main className="page-shell">{children}</main>
      <SiteFooter locale={locale} />
    </LocaleProvider>
  </body></html>;
}
