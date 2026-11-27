import Link from "next/link";
import { addGiftsToEvent } from "@/app/actions";
import { GiftPicker, type PickableGift } from "@/components/lists/gift-picker";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n";
import { translate } from "@/lib/i18n/dictionary";

// Bring gifts from my personal lists into my display in this event.
// Step 1: choose lists. Step 2: untick the gifts I don't want (each gift appears once).
export default async function ImportToEvent({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ lists?: string | string[]; error?: string }> }) {
  const { eventId } = await params;
  const [{ lists, error }, { user, event }] = await Promise.all([searchParams, requireMembership(eventId)]);
  const locale = await getLocale();
  const t = (s: string) => translate(locale, s);
  const back = <Link href={`/events/${eventId}/members/${user.id}`} className="back-link">← {event.name}</Link>;
  if (event.listMode === "SINGLE_LIST" && event.primaryListOwnerId !== user.id) return <>{back}
    <div className="empty-state"><h3>{t("En aquest esdeveniment només hi ha una llista principal.")}</h3></div></>;

  const myLists = await prisma.wishList.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" }, include: { _count: { select: { items: true } } } });
  const chosenIds = new Set(Array.isArray(lists) ? lists : lists ? [lists] : []);
  const chosen = myLists.filter((list) => chosenIds.has(list.id));
  const heading = <div><p className="eyebrow">{event.name}</p><h2>{t("Afegir des de les meves llistes")}</h2></div>;

  if (!chosen.length) return <>{back}
    <form method="get" className="card form-card form-stack">
      {heading}
      <p className="muted small">{t("Tria una o més llistes. Al pas següent podràs treure els regals que no vulguis.")}</p>
      {error && <p className="alert">{t(error)}</p>}
      {myLists.length ? <>
        <ul className="picker-list">{myLists.map((list) => <li key={list.id}><label className="picker-row">
          <input type="checkbox" name="lists" value={list.id} />
          <span className="picker-text"><strong>{list.name}</strong><span className="muted small">{list._count.items} {list._count.items === 1 ? t("regal") : t("regals")}</span></span>
        </label></li>)}</ul>
        <div className="form-actions"><button className="button button-primary" type="submit">{t("Continuar")} →</button><Link className="button button-outline" href="/lists">{t("Les meves llistes")}</Link></div>
      </> : <div className="empty-state"><h3>{t("Encara no tens cap llista")}</h3><p className="small">{t("Crea-la a «Les meves llistes» i torna aquí.")}</p><Link className="button button-primary" href="/lists">{t("Les meves llistes")}</Link></div>}
    </form>
  </>;

  // Gifts of the chosen lists, in list order, each one only once
  const entries = await prisma.listItem.findMany({
    where: { listId: { in: chosen.map((list) => list.id) }, item: { ownerId: user.id, isHiddenFromListOwner: false } },
    orderBy: [{ sortOrder: "asc" }, { addedAt: "asc" }],
    include: { item: { include: { eventEntries: { where: { eventId }, select: { id: true } } } } },
  });
  const listOrder = new Map(chosen.map((list, index) => [list.id, index]));
  const listName = new Map(chosen.map((list) => [list.id, list.name]));
  entries.sort((a, b) => listOrder.get(a.listId)! - listOrder.get(b.listId)!);
  const gifts = new Map<string, PickableGift>();
  for (const entry of entries) {
    const existing = gifts.get(entry.itemId);
    if (existing) { existing.sources.push(listName.get(entry.listId)!); continue; }
    gifts.set(entry.itemId, {
      id: entry.item.id, name: entry.item.name, imagePath: entry.item.imagePath, price: entry.item.price,
      sources: [listName.get(entry.listId)!], alreadyThere: entry.item.eventEntries.length > 0,
    });
  }
  const picked = [...gifts.values()].sort((a, b) => Number(a.alreadyThere) - Number(b.alreadyThere));
  return <>{back}
    <section className="card form-card form-stack">
      {heading}
      <p className="muted small">{t("De")} {chosen.map((list) => list.name).join(", ")}. {t("Desmarca els regals que no vulguis afegir. Els que són a diverses llistes només surten una vegada.")} <Link href={`/events/${eventId}/import`}>{t("Canviar les llistes")}</Link></p>
      {error && <p className="alert">{t(error)}</p>}
      {picked.length ? <GiftPicker gifts={picked} action={addGiftsToEvent}
        hidden={<><input type="hidden" name="eventId" value={eventId} />{chosen.map((list) => <input key={list.id} type="hidden" name="listId" value={list.id} />)}</>}
        submitLabel={t("Afegir a l’esdeveniment")} alreadyLabel={t("Ja és en aquest esdeveniment")} />
        : <p className="muted">{t("Aquestes llistes encara són buides.")}</p>}
    </section>
  </>;
}
