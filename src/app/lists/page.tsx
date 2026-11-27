import Link from "next/link";
import { Send } from "lucide-react";
import { createList } from "@/app/actions";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { myDisplayEvents } from "@/lib/lists";
import { getLocale } from "@/lib/i18n";
import { translate } from "@/lib/i18n/dictionary";

// My personal lists. From here I can also send the gifts of several lists to an event.
export default async function MyLists({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string }> }) {
  const user = await requireUser();
  const { error, deleted } = await searchParams;
  const locale = await getLocale();
  const t = (s: string) => translate(locale, s);
  const [lists, events] = await Promise.all([
    prisma.wishList.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" }, include: { _count: { select: { items: true } } } }),
    myDisplayEvents(user.id),
  ]);
  return <>
    <Link href="/" className="back-link">← {t("Els meus esdeveniments")}</Link>
    <section className="list-header">
      <div><p className="eyebrow">{t("Només les veus tu")}</p><h1>{t("Les meves llistes")}</h1><p className="lead" style={{ marginBottom: 0 }}>{t("Guarda aquí els teus desitjos. Un mateix regal pot ser a diverses llistes, i després els pots afegir als esdeveniments que vulguis.")}</p></div>
    </section>
    {error && <p className="alert">{t(error)}</p>}
    {deleted && <p className="success-note">{t("S’ha esborrat la llista.")}</p>}
    <form action={createList} className="card new-list-form">
      <label htmlFor="new-list-name">{t("Nova llista")}</label>
      <div className="inline-form"><input id="new-list-name" name="name" required maxLength={80} placeholder={t("Per exemple, Llibres que vull llegir")} /><button className="button button-primary button-small" type="submit">＋ {t("Crear llista")}</button></div>
    </form>
    {lists.length ? <>
      <form method="get" action="/lists/send" className="lists-send">
        <div className="section-heading"><h2>{t("Les teves llistes")}</h2><span className="muted small">{lists.length} {t("en total")}</span></div>
        <div className="event-grid">{lists.map((list) => <div key={list.id} className="card event-card list-card">
          <label className="list-card-check" title={t("Seleccionar per enviar a un esdeveniment")}><input type="checkbox" name="lists" value={list.id} /><span className="sr-only">{t("Seleccionar")} {list.name}</span></label>
          <Link href={`/lists/${list.id}`} className="list-card-link">
            <div><p className="eyebrow">{t("Llista")}</p><div className="event-card-title">{list.name}</div></div>
            <div className="muted small">{list._count.items} {list._count.items === 1 ? t("regal") : t("regals")} <span style={{ float: "right", color: "var(--green)" }}>{t("Obrir")} →</span></div>
          </Link>
        </div>)}</div>
        <div className="card send-panel">
          <div><h3><Send size={18} aria-hidden /> {t("Enviar a un esdeveniment")}</h3><p className="muted small">{t("Marca una o més llistes, tria l’esdeveniment i després podràs treure els regals que no vulguis. Si un regal és a diverses llistes, només s’hi afegirà una vegada.")}</p></div>
          {events.length ? <div className="inline-form">
            <select name="event" required aria-label={t("Esdeveniment")} defaultValue=""><option value="" disabled>{t("Tria un esdeveniment…")}</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select>
            <button className="button button-primary button-small" type="submit">{t("Continuar")} →</button>
          </div> : <p className="small muted">{t("Encara no formes part de cap esdeveniment on puguis tenir llista.")}</p>}
        </div>
      </form>
    </> : <div className="empty-state"><h3>{t("Encara no tens cap llista")}</h3><p className="small">{t("Crea’n una a dalt i comença a afegir-hi els teus desitjos.")}</p></div>}
  </>;
}
