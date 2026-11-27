import Link from "next/link";
import { CopyPlus, Send } from "lucide-react";
import { renameList } from "@/app/actions";
import { DeleteListButton } from "@/components/lists/list-controls";
import { ListGiftCard } from "@/components/lists/list-gift-card";
import { prisma } from "@/lib/db";
import { myDisplayEvents } from "@/lib/lists";
import { requireOwnList } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n";
import { translate } from "@/lib/i18n/dictionary";

export default async function MyList({ params, searchParams }: { params: Promise<{ listId: string }>; searchParams: Promise<{ error?: string; saved?: string; added?: string }> }) {
  const { listId } = await params;
  const [{ error, saved, added }, { user, list }] = await Promise.all([searchParams, requireOwnList(listId)]);
  const locale = await getLocale();
  const t = (s: string) => translate(locale, s);
  const [entries, events] = await Promise.all([
    prisma.listItem.findMany({
      where: { listId: list.id }, orderBy: [{ sortOrder: "asc" }, { addedAt: "asc" }],
      include: { item: { include: { eventEntries: { select: { event: { select: { name: true } } } }, _count: { select: { listEntries: true } } } } },
    }),
    myDisplayEvents(user.id),
  ]);
  return <>
    <Link href="/lists" className="back-link">← {t("Les meves llistes")}</Link>
    <div className="list-header"><div><p className="eyebrow">{t("La meva llista")}</p><h1>{list.name}</h1></div>
      <div className="toolbar">
        <Link href={`/lists/${list.id}/add`} className="button button-outline button-small"><CopyPlus size={16} aria-hidden /> {t("Afegir d’altres llistes")}</Link>
        <Link href={`/lists/${list.id}/items/new`} className="button button-primary">＋ {t("Afegir regal")}</Link>
      </div>
    </div>
    <p className="muted small list-progress">{entries.length} {entries.length === 1 ? t("regal") : t("regals")}</p>
    {error && <p className="alert">{t(error)}</p>}
    {saved && <p className="success-note">{t("Els canvis s’han desat.")}</p>}
    {added !== undefined && <p className="success-note">{added === "0" ? t("Aquests regals ja eren a la llista.") : t("S’han afegit {count} regals.").replace("{count}", added)}</p>}
    <details className="profile-create-details list-manage">
      <summary>{t("Gestionar la llista")}</summary>
      <div className="profile-create-form">
        <form action={renameList} className="list-manage-rename">
          <input type="hidden" name="listId" value={list.id} />
          <label htmlFor="list-name">{t("Nom de la llista")}</label>
          <div className="inline-form"><input id="list-name" name="name" required maxLength={80} defaultValue={list.name} /><button className="button button-secondary button-small" type="submit">{t("Desar")}</button></div>
        </form>
        <div className="form-actions"><DeleteListButton listId={list.id} name={list.name} /></div>
        <span className="field-help">{t("Esborrar la llista no treu els regals dels esdeveniments ni de les altres llistes on siguin.")}</span>
      </div>
    </details>
    {entries.length > 0 && events.length > 0 && <form method="get" action="/lists/send" className="card send-panel compact">
      <input type="hidden" name="lists" value={list.id} />
      <p className="small"><Send size={16} aria-hidden /> {t("Afegeix els regals d’aquesta llista a un esdeveniment:")}</p>
      <div className="inline-form">
        <select name="event" required aria-label={t("Esdeveniment")} defaultValue=""><option value="" disabled>{t("Tria un esdeveniment…")}</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select>
        <button className="button button-secondary button-small" type="submit">{t("Continuar")} →</button>
      </div>
    </form>}
    {entries.length ? <div className="item-list">{entries.map((entry, index) => <ListGiftCard key={entry.itemId} listId={list.id} gift={entry.item}
      events={entry.item.eventEntries.map((eventEntry) => eventEntry.event.name)} otherLists={entry.item._count.listEntries - 1}
      first={index === 0} last={index === entries.length - 1} />)}</div>
      : <div className="empty-state"><h3>{t("La llista encara és buida")}</h3><p className="small">{t("Afegeix-hi un regal nou o un que ja tinguis en una altra llista.")}</p><div className="toolbar empty-actions"><Link className="button button-outline" href={`/lists/${list.id}/add`}>{t("Afegir d’altres llistes")}</Link><Link className="button button-primary" href={`/lists/${list.id}/items/new`}>{t("Afegir regal")}</Link></div></div>}
  </>;
}
