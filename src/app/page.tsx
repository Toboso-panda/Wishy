import Link from "next/link";
import { ArrowRight, CalendarDays, CalendarPlus, Gift, Users } from "lucide-react";
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

  const [events, lists, giftCount, myEntries] = await Promise.all([
    prisma.event.findMany({
      where: { members: { some: { userId: user.id } } }, orderBy: [{ date: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { members: true } } },
    }),
    prisma.wishList.count({ where: { ownerId: user.id } }),
    prisma.item.count({ where: { ownerId: user.id, isHiddenFromListOwner: false, listEntries: { some: {} } } }),
    prisma.eventItem.groupBy({ by: ["eventId"], where: { item: { ownerId: user.id, isHiddenFromListOwner: false } }, _count: { _all: true } }),
  ]);
  const giftsIn = new Map(myEntries.map((entry) => [entry.eventId, entry._count._all]));
  const dateFormat = new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "ca-ES", { dateStyle: "long" });
  const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? t(one) : t(many)}`;
  return <>
    <section className="home-greeting"><h1>{t("Hola")}, {user.name} <span aria-hidden>👋</span></h1><p className="lead">{t("Què vols fer?")}</p></section>
    {deleted && <NoticeDialog title={t("S’ha eliminat l’esdeveniment.")} message={t("Les reserves d’aquest esdeveniment s’han esborrat. Els regals continuen a les llistes personals de cadascú.")} />}

    {/* The two main things to do, as big cards that are easy to tap */}
    <nav className="home-actions" aria-label={t("Què vols fer?")}>
      <Link href="/lists" className="home-action home-action-lists">
        <span className="home-action-icon" aria-hidden><Gift size={34} strokeWidth={1.8} /></span>
        <span className="home-action-text">
          <strong>{t("Les meves llistes")}</strong>
          <span>{t("Apunta què t’agradaria rebre. Després ho podràs afegir als esdeveniments.")}</span>
          {lists > 0 && <span className="home-action-meta">{plural(lists, "llista", "llistes")} · {plural(giftCount, "regal", "regals")}</span>}
        </span>
        <span className="home-action-go">{lists ? t("Obrir") : t("Començar")} <ArrowRight size={18} aria-hidden /></span>
      </Link>
      <Link href="/events/new" className="home-action home-action-event">
        <span className="home-action-icon" aria-hidden><CalendarPlus size={32} strokeWidth={1.8} /></span>
        <span className="home-action-text">
          <strong>{t("Crear un esdeveniment")}</strong>
          <span>{t("Reis, un aniversari, un casament… Convida la família amb un enllaç.")}</span>
        </span>
        <span className="home-action-go">{t("Crear")} <ArrowRight size={18} aria-hidden /></span>
      </Link>
    </nav>

    {/* Only for people who are just starting */}
    {lists === 0 && <section className="home-steps" aria-label={t("Com funciona")}>
      <h2>{t("Com funciona")}</h2>
      <ol>
        <li><span className="home-step-number">1</span><span><strong>{t("Fes la teva llista")}</strong>{t("Apunta els regals que t’agradarien, amb foto o enllaç si vols.")}</span></li>
        <li><span className="home-step-number">2</span><span><strong>{t("Afegeix-la a un esdeveniment")}</strong>{t("Entra a l’esdeveniment de la família i tria quins regals hi poses.")}</span></li>
        <li><span className="home-step-number">3</span><span><strong>{t("La família tria")}</strong>{t("Cadascú reserva un regal i ningú en compra un de repetit.")}</span></li>
      </ol>
    </section>}

    <div className="section-heading"><h2>{t("Els teus esdeveniments")}</h2>{events.length > 0 && <span className="muted small">{events.length} {t("en total")}</span>}</div>
    {events.length ? <div className="event-grid">{events.map((event) => {
      const mine = giftsIn.get(event.id) ?? 0;
      const hasOwnList = event.listMode === "EVERY_MEMBER_LIST" || event.primaryListOwnerId === user.id;
      return <Link href={`/events/${event.id}`} className="card event-card" key={event.id}>
        <div>
          <div className="event-card-title">{event.name}</div>
          <p className="event-card-facts">
            {event.date && <span><CalendarDays size={15} aria-hidden /> {dateFormat.format(event.date)}</span>}
            <span><Users size={15} aria-hidden /> {plural(event._count.members, "persona", "persones")}</span>
          </p>
          {hasOwnList && <p className={`event-card-mine${mine ? "" : " empty"}`}>{mine === 0 ? t("Encara no hi has posat cap regal") : mine === 1 ? t("Hi tens 1 regal") : t("Hi tens {count} regals").replace("{count}", String(mine))}</p>}
        </div>
        <span className="event-card-go">{t("Entrar")} <ArrowRight size={17} aria-hidden /></span>
      </Link>;
    })}</div> : <div className="empty-state"><h3>{t("Encara no tens cap esdeveniment")}</h3><p className="small">{t("Si algú de la família t’ha enviat un enllaç, obre’l i entraràs directament. També en pots crear un tu.")}</p><Link className="button button-primary" href="/events/new">{t("Crear un esdeveniment")}</Link></div>}
  </>;
}
