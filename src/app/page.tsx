import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";
import { NoticeDialog } from "@/components/ui/notice-dialog";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n";
import { translate } from "@/lib/i18n/dictionary";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string; mode?: string; deleted?: string }> }) {
  const { error, mode, deleted } = await searchParams;
  const user = await currentUser();
  const locale = await getLocale();
  const t = (s: string) => translate(locale, s);
  if (!user) return <div className="welcome-layout">
    <section className="welcome-copy"><p className="eyebrow">{t("Una manera senzilla d’organitzar els regals")}</p><h1>{t("Regals pensats")}<br />{t("amb estima")} <span aria-hidden>🎄</span></h1><p className="lead">{t("Llistes familiars per a Reis, aniversaris i tots aquells moments que val la pena celebrar.")}</p><div className="welcome-note"><span aria-hidden>❄</span><span>{t("Compartiu idees. Eviteu regals repetits. Gaudiu de la sorpresa.")}</span></div></section>
    <AuthPanel error={error} initialMode={mode === "login" ? "login" : "register"} />
  </div>;

  const events = await prisma.event.findMany({
    where: { members: { some: { userId: user.id } } }, orderBy: [{ date: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { members: true } } },
  });
  return <>
    <section className="hero hero-grid"><div><p className="eyebrow">{t("El teu espai familiar")}</p><h1>{t("Hola")}, {user.name}.</h1><p className="lead">{t("Què esteu celebrant?")}</p></div>
      <Link className="button button-primary" href="/events/new">＋ {t("Crear esdeveniment")}</Link>
    </section>
    {deleted && <NoticeDialog title={t("S’ha eliminat l’esdeveniment.")} message={t("Les llistes i els regals d’aquest esdeveniment s’han esborrat per a tothom.")} />}
    <div className="section-heading"><h2>{t("Els teus esdeveniments")}</h2><span className="muted small">{events.length} {t("en total")}</span></div>
    {events.length ? <div className="event-grid">{events.map((event) => <Link href={`/events/${event.id}`} className="card event-card" key={event.id}>
      <div><p className="eyebrow">{event.listMode === "SINGLE_LIST" ? t("Llista principal") : t("Llistes familiars")}</p><div className="event-card-title">{event.name}</div>{event.description && <p className="muted small">{event.description}</p>}</div>
      <div className="muted small">{event.date ? new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "ca-ES", { dateStyle: "long" }).format(event.date) : ""}　·　{event._count.members} {event._count.members === 1 ? t("membre") : t("membres")} <span style={{ float: "right", color: "var(--green)" }}>{t("Obrir")} →</span></div>
    </Link>)}</div> : <div className="empty-state"><h3>{t("Encara no tens cap esdeveniment")}</h3><p className="small">{t("Crea’n un i convida la família amb un sol enllaç.")}</p><Link className="button button-primary" href="/events/new">{t("Crear esdeveniment")}</Link></div>}
  </>;
}
